const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dataStore = require('./dataStore');

let cachedData = null;

const MONTH_MAP = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
    'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
};

function parseClassDates(dateStr) {
    if (!dateStr) return [];
    const dates = [];
    // Normalize string: "07, 08 de abril 2026 y 01 de mayo 2026"
    // Split by blocks that end in a year or just commas
    const parts = dateStr.split(/ y | y, |, /);
    
    let currentMonth = '';
    let currentYear = '2026'; // Default to 2026 as per images

    // We iterate backwards to catch month and year first
    for (let i = parts.length - 1; i >= 0; i--) {
        let p = parts[i].trim().toLowerCase();
        if (!p) continue;

        // Check for year
        const yearMatch = p.match(/\b(202\d)\b/);
        if (yearMatch) {
            currentYear = yearMatch[1];
            p = p.replace(currentYear, '').trim();
        }

        // Check for month
        for (const [mName, mNum] of Object.entries(MONTH_MAP)) {
            if (p.includes(mName)) {
                currentMonth = mNum;
                p = p.replace(mName, '').replace('de', '').trim();
                break;
            }
        }

        // Days can be multiple in one part: "07, 08"
        const days = p.match(/\d+/g);
        if (days && currentMonth && currentYear) {
            days.forEach(d => {
                const dayStr = d.padStart(2, '0');
                dates.unshift(`${currentYear}-${currentMonth}-${dayStr}`);
            });
        }
    }
    return [...new Set(dates)].sort();
}

function applyOverrides(data) {
    if (!data || !data.students) return data;

    Object.keys(data.students).forEach(username => {
        const overrides = dataStore.getNoteOverrides(username);
        data.students[username].materias.forEach(m => {
            if (m.originalNota === undefined) m.originalNota = m.nota;

            if (overrides[m.materia] !== undefined) {
                m.nota = overrides[m.materia];
            } else {
                m.nota = m.originalNota;
            }
        });
    });
    return data;
}

function parseExcel(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const data = {
            users: {},
            students: {},
            teachers: {},
            programs: {},
            evaluationQuestions: [],
            rawRows: [] // Keep for compatibility
        };

        // --- Estudiantes Sheet ---
        const estSheet = workbook.Sheets['Estudiantes'];
        if (estSheet) {
            const rows = XLSX.utils.sheet_to_json(estSheet, { defval: '' });
            rows.forEach(row => {
                const user = String(row['Usuario'] || '').trim().toLowerCase();
                if (!user) return;
                
                const studentData = {
                    username: user,
                    password: String(row['Contraseña'] || row['Password'] || '').trim(),
                    role: 'estudiante',
                    nombre: String(row['Estudiante'] || '').trim(),
                    programa: String(row['Programa asignado'] || '').trim(),
                    codigoPrograma: String(row['Código programa'] || '').trim(),
                    correo: String(row['Correo'] || '').trim()
                };

                data.users[user] = studentData;
                data.students[user] = {
                    nombre: studentData.nombre,
                    programa: studentData.programa,
                    codigoPrograma: studentData.codigoPrograma,
                    materias: []
                };

                if (studentData.programa) {
                    if (!data.programs[studentData.programa]) {
                        data.programs[studentData.programa] = { estudiantes: [], materias: [] };
                    }
                    data.programs[studentData.programa].estudiantes.push(user);
                }
            });
        }

        // --- Docentes Sheet ---
        const docSheet = workbook.Sheets['Docentes'];
        if (docSheet) {
            const rows = XLSX.utils.sheet_to_json(docSheet, { defval: '' });
            rows.forEach(row => {
                const user = String(row['Usuario'] || '').trim().toLowerCase();
                if (!user) return;

                const materia = String(row['Materia'] || '').trim();
                const progName = String(row['Programa asignado'] || '').trim();
                const horas = parseInt(row['Horas']) || 0;
                const dates = parseClassDates(String(row['Fechas de clases'] || '').trim());

                if (!data.users[user]) {
                    data.users[user] = {
                        username: user,
                        password: String(row['Contraseña'] || '').trim(),
                        role: 'docente',
                        nombre: String(row['NOMBRE'] || '').trim(),
                        programas: []
                    };
                }

                if (!data.teachers[user]) {
                    data.teachers[user] = {
                        nombre: data.users[user].nombre,
                        programas: new Set(),
                        materias: [],
                        estudiantes: []
                    };
                }

                if (progName) data.teachers[user].programas.add(progName);
                if (materia) {
                    data.teachers[user].materias.push({
                        nombre: materia,
                        programa: progName,
                        horas: horas,
                        fechas: dates
                    });
                    
                    // Link students to this teacher/materia based on program
                    Object.entries(data.students).forEach(([sUser, sData]) => {
                        if (sData.programa === progName) {
                            // Link student to materia
                            if (!sData.materias.find(m => m.materia === materia)) {
                                sData.materias.push({
                                    materia,
                                    nota: null,
                                    docente: data.users[user].nombre,
                                    usuarioDocente: user,
                                    horas: horas,
                                    fechas: dates
                                });
                            }
                            
                            // Add student to teacher's general list if not already there
                            if (!data.teachers[user].estudiantes.find(e => e.usuario === sUser)) {
                                data.teachers[user].estudiantes.push({
                                    usuario: sUser,
                                    nombre: sData.nombre,
                                    programa: progName
                                });
                            }
                        }
                    });
                }
            });
        }

        // Convert Sets to Arrays
        Object.keys(data.teachers).forEach(k => {
            data.teachers[k].programas = Array.from(data.teachers[k].programas);
            data.users[k].programas = data.teachers[k].programas;
        });

        // Evaluation questions (Comprehensive Form)
        data.evaluationQuestions = [
            // 1 Contenido y Pertinencia Temática
            { id: 1, section: 'Contenido y Pertinencia Temática', pregunta: 'El contenido temático abordado fue pertinente para mi desarrollo profesional.', type: 'rating' },
            { id: 2, section: 'Contenido y Pertinencia Temática', pregunta: 'La profundidad y el nivel de complejidad de los contenidos fueron apropiados para el programa.', type: 'rating' },
            { id: 3, section: 'Contenido y Pertinencia Temática', pregunta: 'Los objetivos del programa fueron claros y se alinearon con los contenidos desarrollados.', type: 'rating' },
            
            // 2 Desempeño Docente
            { id: 4, section: 'Desempeño Docente', pregunta: 'El/La docente demostró un amplio dominio y actualización de los temas tratados.', type: 'rating' },
            { id: 5, section: 'Desempeño Docente', pregunta: 'El/La docente explicó los conceptos de manera clara y organizada.', type: 'rating' },
            { id: 6, section: 'Desempeño Docente', pregunta: 'El/La docente demostró capacidad efectiva para resolver dudas e inquietudes de los participantes.', type: 'rating' },
            { id: 7, section: 'Desempeño Docente', pregunta: 'El trato del/la docente hacia los participantes fue respetuoso e incluyente.', type: 'rating' },
            
            // 3 Metodología y Estrategias Pedagógicas
            { id: 8, section: 'Metodología y Estrategias Pedagógicas', pregunta: 'Las estrategias pedagógicas utilizadas promovieron la participación y el intercambio de ideas.', type: 'rating' },
            { id: 9, section: 'Metodología y Estrategias Pedagógicas', pregunta: 'Las actividades prácticas y/o ejercicios propuestos contribuyeron significativamente al aprendizaje.', type: 'rating' },
            { id: 10, section: 'Metodología y Estrategias Pedagógicas', pregunta: 'El tiempo asignado a cada tema o actividad fue suficiente para su comprensión.', type: 'rating' },
            
            // 4 Planeación y Organización del Curso
            { id: 11, section: 'Planeación y Organización del Curso', pregunta: 'La estructura y secuencia de los módulos o sesiones fueron lógicas y coherentes.', type: 'rating' },
            { id: 12, section: 'Planeación y Organización del Curso', pregunta: 'La información sobre horarios, fechas y logística fue comunicada de forma oportuna y clara.', type: 'rating' },
            { id: 13, section: 'Planeación y Organización del Curso', pregunta: 'La gestión administrativa del programa (inscripción, certificaciones, etc.) fue eficiente.', type: 'rating' },

            // 5 Recursos y Medios Utilizados
            { id: 14, section: 'Recursos y Medios Utilizados', pregunta: 'Los recursos y materiales entregados (digitales o físicos) fueron de calidad y utilidad.', type: 'rating' },
            { id: 15, section: 'Recursos y Medios Utilizados', pregunta: 'Los medios tecnológicos utilizados (plataformas, software, equipos) facilitaron el desarrollo del programa.', type: 'rating' },
            { id: 16, section: 'Recursos y Medios Utilizados', pregunta: 'La infraestructura física (o virtual, si aplica) fue adecuada para el desarrollo de las sesiones.', type: 'rating' },

            // 6 Logro de Aprendizajes y Evaluación
            { id: 17, section: 'Logro de Aprendizajes y Evaluación', pregunta: 'Considero que alcancé los objetivos de aprendizaje esperados al inicio del programa.', type: 'rating' },
            { id: 18, section: 'Logro de Aprendizajes y Evaluación', pregunta: 'Los contenidos y actividades me permitieron adquirir nuevas competencias aplicables a mi ámbito laboral.', type: 'rating' },
            { id: 19, section: 'Logro de Aprendizajes y Evaluación', pregunta: 'Las pautas y los criterios de evaluación del programa fueron presentados con total claridad.', type: 'rating' },
            { id: 20, section: 'Logro de Aprendizajes y Evaluación', pregunta: 'La retroalimentación recibida sobre mis evaluaciones fue constructiva y útil para mi mejora.', type: 'rating' },

            // 7 Satisfacción General
            { id: 21, section: 'Satisfacción General', pregunta: 'Estoy satisfecho con el desarrollo general del programa.', type: 'rating' },
            { id: 22, section: 'Satisfacción General', pregunta: 'Recomendaría este programa de educación continua a otros colegas o profesionales.', type: 'rating' },
            { id: 23, section: 'Satisfacción General', pregunta: 'El valor de la inversión (tiempo y costo) fue proporcional a la calidad de la formación recibida.', type: 'rating' },

            // 8 Experiencia del Participante (Open Text)
            { id: 24, section: 'Experiencia del Participante', pregunta: '¿Desea compartir comentarios, sugerencias o recomendaciones adicionales que contribuyan a mejorar la calidad del programa y del proceso formativo?', type: 'text' }
        ];

        // --- Administrativos Sheet ---
        const admSheet = workbook.Sheets['Administrativos'];
        if (admSheet) {
            const rows = XLSX.utils.sheet_to_json(admSheet, { defval: '' });
            rows.forEach(row => {
                const user = String(row['Usuario'] || '').trim().toLowerCase();
                if (!user) return;
                
                data.users[user] = {
                    username: user,
                    password: String(row['Contraseña'] || '').trim(),
                    role: 'administrativo',
                    nombre: String(row['NOMBRE'] || '').trim()
                };
            });
        }

        // Admin user (legacy/fallback)
        if (!data.users['admin']) {
            data.users['admin'] = {
                username: 'admin',
                password: 'admin2024',
                role: 'administrativo',
                nombre: 'Administrador del Sistema'
            };
        }

        cachedData = data;
        return data;
    } catch (err) {
        console.error('Error parsing Excel:', err);
        return { users: {}, students: {}, teachers: {}, programs: {}, evaluationQuestions: [] };
    }
}

function getData() {
    if (cachedData) return applyOverrides(cachedData);
    const excelPath = path.join(__dirname, '../data/journey.xlsx');
    if (fs.existsSync(excelPath)) {
        cachedData = parseExcel(excelPath);
        return applyOverrides(cachedData);
    }
    return { users: {}, students: {}, teachers: {}, programs: {}, evaluationQuestions: [] };
}

function reloadFromFile(filePath) {
    cachedData = parseExcel(filePath);
    return applyOverrides(cachedData);
}

function clearCache() {
    cachedData = null;
}

module.exports = { getData, parseExcel, reloadFromFile, clearCache };
