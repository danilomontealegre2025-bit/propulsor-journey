const fs = require('fs');
const dataStore = require('./src/dataStore');
const pdfGen = require('./src/pdfGenerator');
const parser = require('./src/excelParser');

async function run() {
    parser.reloadFromFile('./data/journey.xlsx');
    const data = parser.getData();
    const username = '39789871';
    const student = data.students[username];
    if (!student) {
        console.error('Estudiante no encontrado');
        return;
    }
    const overrides = dataStore.getNoteOverrides(username);
    const allAttendance = dataStore.getAllAttendance();
    const materias = student.materias.map(m => {
        let presentCount = 0;
        if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
            const matAtt = allAttendance[m.usuarioDocente][m.materia];
            Object.keys(matAtt).forEach(date => {
                if (matAtt[date][username] === 'presente') presentCount++;
            });
        }
        return {
            ...m,
            nota: overrides[m.materia] !== undefined ? overrides[m.materia] : m.nota,
            attendance: { present: presentCount }
        };
    });
    console.log('Generando PDF...');
    try {
        const pdf = await pdfGen.generateStudentPDF({ ...student, materias });
        console.log('PDF generado. Tamaño:', pdf.length);
    } catch (e) {
        console.error('FALLO LA GENERACION:', e);
    }
    process.exit(0);
}
run();
