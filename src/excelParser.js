const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dataStore = require('./dataStore');

let cachedData = null;

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
            rawRows: []
        };

        // ── Main sheet (first sheet) ──────────────────────────────────────────────
        const mainSheetName = workbook.SheetNames[0];
        const mainSheet = workbook.Sheets[mainSheetName];
        const rows = XLSX.utils.sheet_to_json(mainSheet, { defval: '' });
        data.rawRows = rows;

        rows.forEach(row => {
            const programa = String(row['Programa'] || '').trim();
            const estudianteNombre = String(row['Estudiante'] || '').trim();
            const usuarioEst = String(row['Usuario estudiante'] || row['Usuario_estudiante'] || '').trim().toLowerCase();
            const passEst = String(row['Contraseña estudiante'] || row['Contraseña_estudiante'] || row['Contrase?a estudiante'] || '').trim();
            const docenteNombre = String(row['Docente'] || '').trim();
            const usuarioDoc = String(row['Usuario Docente'] || row['Usuario_Docente'] || '').trim().toLowerCase();
            const passDoc = String(row['Contraseña doc'] || row['Contraseña_doc'] || row['Contrase?a doc'] || '').trim();
            const materia = String(row['Materia'] || '').trim();
            const nota = row['Nota'] !== undefined ? parseFloat(row['Nota']) : null;

            // Register student user
            if (usuarioEst && !data.users[usuarioEst]) {
                data.users[usuarioEst] = {
                    username: usuarioEst,
                    password: passEst,
                    role: 'estudiante',
                    nombre: estudianteNombre,
                    programa: programa
                };
            }

            // Register teacher user
            if (usuarioDoc && !data.users[usuarioDoc]) {
                data.users[usuarioDoc] = {
                    username: usuarioDoc,
                    password: passDoc,
                    role: 'docente',
                    nombre: docenteNombre,
                    programas: []
                };
            }

            // Build student data
            if (usuarioEst) {
                if (!data.students[usuarioEst]) {
                    data.students[usuarioEst] = {
                        nombre: estudianteNombre,
                        programa: programa,
                        materias: []
                    };
                }
                if (materia) {
                    data.students[usuarioEst].materias.push({
                        materia,
                        nota: nota !== null ? nota : null,
                        docente: docenteNombre,
                        usuarioDocente: usuarioDoc
                    });
                }
            }

            // Build teacher data
            if (usuarioDoc) {
                if (!data.teachers[usuarioDoc]) {
                    data.teachers[usuarioDoc] = {
                        nombre: docenteNombre,
                        programas: new Set(),
                        estudiantes: []
                    };
                }
                if (programa) data.teachers[usuarioDoc].programas.add(programa);
                if (usuarioEst && estudianteNombre) {
                    const exists = data.teachers[usuarioDoc].estudiantes.find(e => e.usuario === usuarioEst);
                    if (!exists) {
                        data.teachers[usuarioDoc].estudiantes.push({
                            usuario: usuarioEst,
                            nombre: estudianteNombre,
                            programa
                        });
                    }
                }
            }

            // Build programs
            if (programa) {
                if (!data.programs[programa]) data.programs[programa] = { estudiantes: new Set(), materias: new Set() };
                if (usuarioEst) data.programs[programa].estudiantes.add(usuarioEst);
                if (materia) data.programs[programa].materias.add(materia);
            }
        });

        // Convert Sets to Arrays
        Object.keys(data.teachers).forEach(k => {
            data.teachers[k].programas = Array.from(data.teachers[k].programas);
            if (data.users[k]) data.users[k].programas = data.teachers[k].programas;
        });
        Object.keys(data.programs).forEach(k => {
            data.programs[k].estudiantes = Array.from(data.programs[k].estudiantes);
            data.programs[k].materias = Array.from(data.programs[k].materias);
        });

        // ── Evaluation Questions sheet ────────────────────────────────────────────
        const evalSheetName = workbook.SheetNames.find(n =>
            n.toLowerCase().includes('pregunta') || n.toLowerCase().includes('evaluaci')
        );
        if (evalSheetName) {
            const evalSheet = workbook.Sheets[evalSheetName];
            const evalRows = XLSX.utils.sheet_to_json(evalSheet, { defval: '' });
            data.evaluationQuestions = evalRows.map((r, i) => ({
                id: r['id'] || r['ID'] || i + 1,
                pregunta: r['pregunta'] || r['Pregunta'] || r['PREGUNTA'] || Object.values(r)[0] || ''
            })).filter(q => q.pregunta);
        }

        // Default questions if sheet not found
        if (data.evaluationQuestions.length === 0) {
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
        }

        // ── Admin user ────────────────────────────────────────────────────────────
        data.users['admin'] = {
            username: 'admin',
            password: 'admin2024',
            role: 'administrativo',
            nombre: 'Administrador del Sistema'
        };

        cachedData = data;
        return data;
    } catch (err) {
        console.error('Error parsing Excel:', err.message);
        return getDefaultData();
    }
}

function getDefaultData() {
    return {
        users: {
            'est12': { username: 'est12', password: '789', role: 'estudiante', nombre: 'Ximena', programa: 'Gestión De Turismo De Reuniones, Incentivos Y Convenciones' },
            'est06': { username: 'est06', password: '789', role: 'estudiante', nombre: 'Katerine', programa: 'Gestión Estratégica de la experiencia' },
            'est11': { username: 'est11', password: '789', role: 'estudiante', nombre: 'Eliana', programa: 'Marketing Digital para hoteles' },
            'est01': { username: 'est01', password: '987', role: 'estudiante', nombre: 'David', programa: 'Sales Upgrade: Dominando Las Tecnologías' },
            'est03': { username: 'est03', password: '789', role: 'estudiante', nombre: 'Claudia', programa: 'Sales Upgrade: Dominando Las Tecnologías' },
            'est07': { username: 'est07', password: '789', role: 'estudiante', nombre: 'Camila', programa: 'Liderazgo y Desarrollo de equipos' },
            'est02': { username: 'est02', password: '789', role: 'estudiante', nombre: 'Laura', programa: 'Sales Upgrade: Dominando Las Tecnologías' },
            'est08': { username: 'est08', password: '789', role: 'estudiante', nombre: 'Sofia', programa: 'Habilidades para el siglo XXI' },
            'est04': { username: 'est04', password: '789', role: 'estudiante', nombre: 'Arturo', programa: 'Sales Upgrade: Dominando Las Tecnologías' },
            'est09': { username: 'est09', password: '789', role: 'estudiante', nombre: 'María', programa: 'IA y estrategia digital para el tiempo compartido' },
            'est10': { username: 'est10', password: '789', role: 'estudiante', nombre: 'Jonatan', programa: 'Analítica de negocios de Alojamiento' },
            'est05': { username: 'est05', password: '789', role: 'estudiante', nombre: 'Heither', programa: 'Sales Upgrade: Dominando Las Tecnologías' },
            'doc01': { username: 'doc01', password: '123', role: 'docente', nombre: 'Edgar Blanco', programas: ['Gestión De Turismo De Reuniones, Incentivos Y Convenciones', 'Gestión Estratégica de la experiencia', 'Marketing Digital para hoteles', 'Sales Upgrade: Dominando Las Tecnologías'] },
            'doc02': { username: 'doc02', password: '123', role: 'docente', nombre: 'Eduardo Pacheco', programas: ['De La Gestión De Eventos Sostenibles A La Gestión Sostenible De Eventos', 'Liderazgo y Desarrollo de equipos', 'Sales Upgrade: Dominando Las Tecnologías'] },
            'doc03': { username: 'doc03', password: '123', role: 'docente', nombre: 'Ramiro Parias', programas: ['Habilidades para el siglo XXI', 'Sales Upgrade: Dominando Las Tecnologías', 'Uso estratégico de IA y transformación digital para la toma de decisiones, la eficiencia y la experiencia empresarial'] },
            'doc04': { username: 'doc04', password: '123', role: 'docente', nombre: 'Ingrid Duque', programas: ['Control, costos y presupuestos de alimentos y bebidas', 'Creador y gestor de contenidos para empresas turisticas', 'IA y estrategia digital para el tiempo compartido', 'Sales Upgrade: Dominando Las Tecnologías'] },
            'doc05': { username: 'doc05', password: '123', role: 'docente', nombre: 'Camilo Ayala', programas: ['Analítica de negocios de Alojamiento', 'Innovación tecnológica aplicada al sector turístico', 'Logística, administración financiera y evaluación de eventos', 'Revenue management en la industria del Alojamiento', 'Sales Upgrade: Dominando Las Tecnologías'] },
            'admin': { username: 'admin', password: 'admin2024', role: 'administrativo', nombre: 'Administrador del Sistema' }
        },
        students: {
            'est12': { nombre: 'Ximena', programa: 'Gestión De Turismo De Reuniones, Incentivos Y Convenciones', materias: [{ materia: 'Presupuestos', nota: null, docente: 'Edgar Blanco', usuarioDocente: 'doc01' }] },
            'est06': { nombre: 'Katerine', programa: 'Gestión Estratégica de la experiencia', materias: [{ materia: 'Presupuestos', nota: null, docente: 'Edgar Blanco', usuarioDocente: 'doc01' }] },
            'est11': { nombre: 'Eliana', programa: 'Marketing Digital para hoteles', materias: [{ materia: 'Presupuestos', nota: null, docente: 'Edgar Blanco', usuarioDocente: 'doc01' }] },
            'est01': { nombre: 'David', programa: 'Sales Upgrade: Dominando Las Tecnologías', materias: [{ materia: 'Presupuestos', nota: null, docente: 'Edgar Blanco', usuarioDocente: 'doc01' }, { materia: 'Normatividad', nota: null, docente: 'Camilo Ayala', usuarioDocente: 'doc05' }] },
            'est03': { nombre: 'Claudia', programa: 'Sales Upgrade: Dominando Las Tecnologías', materias: [{ materia: 'Diseño', nota: null, docente: 'Eduardo Pacheco', usuarioDocente: 'doc02' }, { materia: 'Costos', nota: null, docente: 'Ramiro Parias', usuarioDocente: 'doc03' }, { materia: 'Normatividad', nota: null, docente: 'Camilo Ayala', usuarioDocente: 'doc05' }] },
            'est07': { nombre: 'Camila', programa: 'Liderazgo y Desarrollo de equipos', materias: [{ materia: 'Diseño', nota: null, docente: 'Eduardo Pacheco', usuarioDocente: 'doc02' }] },
            'est02': { nombre: 'Laura', programa: 'Sales Upgrade: Dominando Las Tecnologías', materias: [{ materia: 'Diseño', nota: null, docente: 'Eduardo Pacheco', usuarioDocente: 'doc02' }, { materia: 'Analítica', nota: null, docente: 'Ingrid Duque', usuarioDocente: 'doc04' }] },
            'est08': { nombre: 'Sofia', programa: 'Habilidades para el siglo XXI', materias: [{ materia: 'Costos', nota: null, docente: 'Ramiro Parias', usuarioDocente: 'doc03' }] },
            'est04': { nombre: 'Arturo', programa: 'Sales Upgrade: Dominando Las Tecnologías', materias: [{ materia: 'Costos', nota: null, docente: 'Ramiro Parias', usuarioDocente: 'doc03' }, { materia: 'Analítica', nota: null, docente: 'Ingrid Duque', usuarioDocente: 'doc04' }] },
            'est09': { nombre: 'María', programa: 'IA y estrategia digital para el tiempo compartido', materias: [{ materia: 'Analítica', nota: null, docente: 'Ingrid Duque', usuarioDocente: 'doc04' }] },
            'est10': { nombre: 'Jonatan', programa: 'Analítica de negocios de Alojamiento', materias: [{ materia: 'Normatividad', nota: null, docente: 'Camilo Ayala', usuarioDocente: 'doc05' }] },
            'est05': { nombre: 'Heither', programa: 'Sales Upgrade: Dominando Las Tecnologías', materias: [{ materia: 'Normatividad', nota: null, docente: 'Camilo Ayala', usuarioDocente: 'doc05' }] }
        },
        teachers: {
            'doc01': {
                nombre: 'Edgar Blanco', programas: ['Gestión De Turismo De Reuniones, Incentivos Y Convenciones', 'Gestión Estratégica de la experiencia', 'Marketing Digital para hoteles', 'Sales Upgrade: Dominando Las Tecnologías'], estudiantes: [
                    { usuario: 'est12', nombre: 'Ximena', programa: 'Gestión De Turismo' },
                    { usuario: 'est06', nombre: 'Katerine', programa: 'Gestión Estratégica' },
                    { usuario: 'est11', nombre: 'Eliana', programa: 'Marketing Digital' },
                    { usuario: 'est01', nombre: 'David', programa: 'Sales Upgrade' }
                ]
            },
            'doc02': {
                nombre: 'Eduardo Pacheco', programas: ['De La Gestión De Eventos Sostenibles A La Gestión Sostenible De Eventos', 'Liderazgo y Desarrollo de equipos', 'Sales Upgrade: Dominando Las Tecnologías'], estudiantes: [
                    { usuario: 'est03', nombre: 'Claudia', programa: 'De La Gestión' },
                    { usuario: 'est07', nombre: 'Camila', programa: 'Liderazgo' },
                    { usuario: 'est02', nombre: 'Laura', programa: 'Sales Upgrade' }
                ]
            },
            'doc03': {
                nombre: 'Ramiro Parias', programas: ['Habilidades para el siglo XXI', 'Sales Upgrade: Dominando Las Tecnologías', 'Uso estratégico de IA y transformación digital para la toma de decisiones, la eficiencia y la experiencia empresarial'], estudiantes: [
                    { usuario: 'est08', nombre: 'Sofia', programa: 'Habilidades' },
                    { usuario: 'est03', nombre: 'Claudia', programa: 'Sales Upgrade' },
                    { usuario: 'est04', nombre: 'Arturo', programa: 'Uso estratégico' }
                ]
            },
            'doc04': {
                nombre: 'Ingrid Duque', programas: ['Control, costos y presupuestos de alimentos y bebidas', 'Creador y gestor de contenidos para empresas turisticas', 'IA y estrategia digital para el tiempo compartido', 'Sales Upgrade: Dominando Las Tecnologías'], estudiantes: [
                    { usuario: 'est04', nombre: 'Arturo', programa: 'Control, costos' },
                    { usuario: 'est02', nombre: 'Laura', programa: 'Creador y gestor' },
                    { usuario: 'est09', nombre: 'María', programa: 'IA y estrategia' },
                    { usuario: 'est04', nombre: 'Arturo', programa: 'Sales Upgrade' }
                ]
            },
            'doc05': {
                nombre: 'Camilo Ayala', programas: ['Analítica de negocios de Alojamiento', 'Innovación tecnológica aplicada al sector turístico', 'Logística, administración financiera y evaluación de eventos', 'Revenue management en la industria del Alojamiento', 'Sales Upgrade: Dominando Las Tecnologías'], estudiantes: [
                    { usuario: 'est10', nombre: 'Jonatan', programa: 'Analítica' },
                    { usuario: 'est03', nombre: 'Claudia', programa: 'Innovación' },
                    { usuario: 'est05', nombre: 'Heither', programa: 'Logística' },
                    { usuario: 'est01', nombre: 'David', programa: 'Revenue' },
                    { usuario: 'est05', nombre: 'Heither', programa: 'Sales Upgrade' }
                ]
            }
        },
        programs: {},
        evaluationQuestions: [
            { id: 1, pregunta: '¿El docente explica los temas con claridad?' },
            { id: 2, pregunta: '¿El docente muestra dominio del tema?' },
            { id: 3, pregunta: '¿El docente es puntual y cumple el horario?' },
            { id: 4, pregunta: '¿El docente fomenta la participación activa?' },
            { id: 5, pregunta: '¿El docente brinda retroalimentación oportuna?' },
            { id: 6, pregunta: '¿El docente utiliza recursos didácticos adecuados?' },
            { id: 7, pregunta: '¿El docente genera un ambiente de respeto?' },
            { id: 8, pregunta: '¿Recomendarías este docente a otros estudiantes?' }
        ],
        rawRows: []
    };
}

function getData() {
    if (cachedData) return applyOverrides(cachedData);
    const excelPath = path.join(__dirname, '../data/journey.xlsx');
    if (fs.existsSync(excelPath)) {
        cachedData = parseExcel(excelPath);
        return applyOverrides(cachedData);
    }
    cachedData = getDefaultData();
    return applyOverrides(cachedData);
}

function reloadFromFile(filePath) {
    cachedData = parseExcel(filePath);
    return applyOverrides(cachedData);
}

function clearCache() {
    cachedData = null;
    console.log('Cache cleared, reloading academic data on next request...');
}

module.exports = { getData, parseExcel, reloadFromFile, clearCache, getDefaultData };
