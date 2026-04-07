const pdfGen = require('./src/pdfGenerator');
const fs = require('fs');
const path = require('path');

async function test() {
    console.log('Test start');
    try {
        const studentData = {
            nombre: 'Prueba Local',
            programa: 'Ingeniería Test',
            materias: [
                { materia: 'Materia 1', docente: 'Docente 1', fechas: ['2023-01-01'], attendance: { present: 1 }, nota: 4.5 },
                { materia: 'Materia 2', docente: 'Docente 2', fechas: ['2023-01-01'], attendance: { present: 0 }, nota: 2.5 }
            ]
        };
        console.log('Generating PDF...');
        const pdf = await pdfGen.generateStudentPDF(studentData);
        console.log('PDF generated properly, size:', pdf.length);
        fs.writeFileSync('test_output.pdf', pdf);
        console.log('Success!');
    } catch (e) {
        console.error('FAILED:', e);
        process.exit(1);
    }
}

test();
