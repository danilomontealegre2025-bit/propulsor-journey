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

        // Evaluation questions (simplified/default)
        data.evaluationQuestions = [
            { id: 1, pregunta: '¿El docente explica los temas con claridad?' },
            { id: 2, pregunta: '¿El docente muestra dominio del tema?' },
            { id: 3, pregunta: '¿El docente es puntual y cumple el horario?' },
            { id: 4, pregunta: '¿El docente fomenta la participación activa?' },
            { id: 5, pregunta: '¿El docente brinda retroalimentación oportuna?' },
            { id: 6, pregunta: '¿El docente utiliza recursos didácticos adecuados?' },
            { id: 7, pregunta: '¿El docente genera un ambiente de respeto?' },
            { id: 8, pregunta: '¿Recomendarías este docente a otros estudiantes?' }
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
