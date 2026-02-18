const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { authenticate, requireAuth, requireRole } = require('../src/auth');
const { getData, reloadFromFile, clearCache } = require('../src/excelParser');
const dataStore = require('../src/dataStore');
const pdfGen = require('../src/pdfGenerator');

const upload = multer({ dest: path.join(__dirname, '../data/uploads/') });

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Credenciales requeridas' });
    const user = authenticate(username.trim(), String(password).trim());
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    req.session.user = user;
    res.json({ success: true, user: { username: user.username, role: user.role, nombre: user.nombre } });
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.session.user });
});

// ── Student endpoints ─────────────────────────────────────────────────────────
router.get('/student/grades', requireAuth, requireRole('estudiante'), (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const data = getData();
    const username = req.session.user.username;
    const student = data.students[username];
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const materias = student.materias;

    const withNotes = materias.filter(m => m.nota !== null && !isNaN(m.nota));
    const promedio = withNotes.length
        ? (withNotes.reduce((s, m) => s + parseFloat(m.nota), 0) / withNotes.length).toFixed(2)
        : null;

    res.json({ nombre: student.nombre, programa: student.programa, materias, promedio });
});

router.get('/student/evaluation-questions', requireAuth, requireRole('estudiante'), (req, res) => {
    const data = getData();
    const username = req.session.user.username;
    const student = data.students[username];
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

    // Get unique teachers for this student
    const teachers = [...new Set(student.materias.map(m => m.usuarioDocente))].map(tu => {
        const t = data.teachers[tu];
        return { username: tu, nombre: t ? t.nombre : tu, evaluated: dataStore.hasEvaluated(username, tu) };
    });

    res.json({ questions: data.evaluationQuestions, teachers });
});

router.post('/student/evaluation', requireAuth, requireRole('estudiante'), (req, res) => {
    const { teacherUser, answers } = req.body;
    const studentUser = req.session.user.username;
    if (dataStore.hasEvaluated(studentUser, teacherUser)) {
        return res.status(409).json({ error: 'Ya evaluaste a este docente' });
    }
    dataStore.saveEvaluation(studentUser, teacherUser, answers);
    res.json({ success: true, message: 'Evaluación enviada correctamente' });
});

// ── Teacher endpoints ─────────────────────────────────────────────────────────
router.get('/teacher/info', requireAuth, requireRole('docente'), (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const data = getData();
    const username = req.session.user.username;
    const teacher = data.teachers[username];
    if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });
    const attendance = dataStore.getAttendance(username);
    const students = teacher.estudiantes.map(s => ({
        ...s,
        attendance: attendance[s.usuario] || 'sin_registro'
    }));
    res.json({ nombre: teacher.nombre, programas: teacher.programas, estudiantes: students, username });
});

router.post('/teacher/attendance', requireAuth, requireRole('docente'), (req, res) => {
    const { studentUser, status } = req.body;
    const teacherUser = req.session.user.username;
    dataStore.setAttendance(teacherUser, studentUser, status);
    res.json({ success: true });
});

router.post('/teacher/grade', requireAuth, requireRole('docente'), (req, res) => {
    const { studentUser, materia, nota } = req.body;
    if (studentUser && materia && nota !== undefined) {
        dataStore.setNote(studentUser, materia, parseFloat(nota));
        res.json({ success: true, message: 'Nota guardada' });
    } else {
        res.status(400).json({ error: 'Datos incompletos' });
    }
});

router.get('/teacher/evaluations', requireAuth, requireRole('docente'), (req, res) => {
    const data = getData();
    const username = req.session.user.username;
    const evaluations = dataStore.getTeacherEvaluations(username);
    res.json({ evaluations, questions: data.evaluationQuestions });
});

// ── Admin endpoints ───────────────────────────────────────────────────────────
router.get('/admin/stats', requireAuth, requireRole('administrativo'), (req, res) => {
    const data = getData();
    const allEvals = dataStore.getAllEvaluations();

    const students = Object.values(data.students);
    const teachers = Object.values(data.teachers);

    // Stats by program
    const byProgram = {};
    students.forEach(s => {
        if (!byProgram[s.programa]) byProgram[s.programa] = { count: 0, notas: [] };
        byProgram[s.programa].count++;
        s.materias.forEach(m => { if (m.nota !== null && !isNaN(m.nota)) byProgram[s.programa].notas.push(parseFloat(m.nota)); });
    });
    Object.keys(byProgram).forEach(p => {
        const n = byProgram[p].notas;
        byProgram[p].avg = n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(2) : null;
    });

    // Subject averages
    const subjectMap = {};
    students.forEach(s => s.materias.forEach(m => {
        if (!subjectMap[m.materia]) subjectMap[m.materia] = [];
        if (m.nota !== null && !isNaN(m.nota)) subjectMap[m.materia].push(parseFloat(m.nota));
    }));
    const subjectAvgs = Object.entries(subjectMap).map(([name, notes]) => ({
        name, avg: notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2) : null
    })).filter(s => s.avg !== null);
    subjectAvgs.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));

    // Teacher evaluation averages
    const teacherEvalAvgs = teachers.map(t => {
        // Find evaluations by username (find the key in data.teachers that matches this teacher object)
        const username = Object.keys(data.teachers).find(u => data.teachers[u].nombre === t.nombre);
        const evals = dataStore.getTeacherEvaluations(username || t.nombre.toLowerCase().replace(' ', ''));
        const allAnswers = evals.flatMap(e => e.answers.map(a => parseFloat(a.value)));
        const avg = allAnswers.length ? (allAnswers.reduce((a, b) => a + b, 0) / allAnswers.length).toFixed(2) : null;
        return { name: t.nombre, avg };
    }).filter(t => t.avg !== null);
    teacherEvalAvgs.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));

    // Overall avg
    const allNotes = students.flatMap(s => s.materias.map(m => m.nota).filter(n => n !== null && !isNaN(n)));
    const overallAvg = allNotes.length ? (allNotes.reduce((a, b) => a + b, 0) / allNotes.length).toFixed(2) : null;
    const passRate = allNotes.length ? Math.round(allNotes.filter(n => n >= 3.0).length / allNotes.length * 100) : 0;

    // Count evaluations
    let totalEvaluations = 0;
    Object.values(allEvals).forEach(ev => { totalEvaluations += Object.keys(ev).length; });

    res.json({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalPrograms: Object.keys(data.programs).length || Object.keys(byProgram).length,
        overallAvg,
        passRate,
        totalEvaluations,
        byProgram,
        bestSubject: subjectAvgs[0] || null,
        worstSubject: subjectAvgs[subjectAvgs.length - 1] || null,
        bestTeacher: teacherEvalAvgs[0] || null,
        subjectAvgs,
        teacherEvalAvgs
    });
});

router.get('/admin/users', requireAuth, requireRole('administrativo'), (req, res) => {
    const data = getData();
    res.json({
        students: Object.entries(data.students).map(([username, s]) => ({ username, ...s })),
        teachers: Object.entries(data.teachers).map(([username, t]) => ({ username, ...t }))
    });
});

router.get('/admin/teacher-evaluations/:teacherUser', requireAuth, requireRole('administrativo'), (req, res) => {
    const data = getData();
    const teacherUser = req.params.teacherUser;
    const teacher = data.teachers[teacherUser];
    if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });

    const evaluations = dataStore.getTeacherEvaluations(teacherUser);
    const questions = data.evaluationQuestions || [];

    // Calculate averages per question
    const questionStats = questions.map(q => {
        const answers = evaluations.map(e => {
            const ans = e.answers.find(a => a.questionId == q.id);
            return ans ? parseFloat(ans.value) : null;
        }).filter(v => v !== null);

        const avg = answers.length ? (answers.reduce((s, v) => s + v, 0) / answers.length).toFixed(2) : 'N/A';
        return {
            id: q.id,
            pregunta: q.pregunta,
            avg,
            count: answers.length
        };
    });

    const allAnswers = evaluations.flatMap(e => e.answers.map(a => parseFloat(a.value)));
    const overallAvg = allAnswers.length ? (allAnswers.reduce((s, v) => s + v, 0) / allAnswers.length).toFixed(2) : 'N/A';

    res.json({
        teacherName: teacher.nombre,
        overallAvg,
        totalEvaluations: evaluations.length,
        questionStats
    });
});

router.post('/admin/clear', requireAuth, requireRole('administrativo'), (req, res) => {
    const { type } = req.body;
    if (type === 'notes') dataStore.clearNotes();
    else if (type === 'evaluations') dataStore.clearEvaluations();
    else if (type === 'attendance') dataStore.clearAttendance();
    else if (type === 'all') dataStore.clearAll();
    res.json({ success: true, message: `Datos de ${type} limpiados` });
});

router.post('/admin/upload', requireAuth, requireRole('administrativo'), upload.single('excel'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    const destPath = path.join(__dirname, '../data/journey.xlsx');
    fs.renameSync(req.file.path, destPath);
    clearCache();
    dataStore.clearAll();
    try {
        const newData = reloadFromFile(destPath);
        res.json({ success: true, message: 'Excel cargado correctamente', users: Object.keys(newData.users).length });
    } catch (e) {
        res.status(500).json({ error: 'Error al procesar el Excel: ' + e.message });
    }
});

// ── PDF endpoints ─────────────────────────────────────────────────────────────
router.get('/pdf/student', requireAuth, requireRole('estudiante'), async (req, res) => {
    try {
        const data = getData();
        const username = req.session.user.username;
        const student = data.students[username];
        if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
        const overrides = dataStore.getNoteOverrides(username);
        const materias = student.materias.map(m => ({
            ...m, nota: overrides[m.materia] !== undefined ? overrides[m.materia] : m.nota
        }));
        const pdf = await pdfGen.generateStudentPDF({ ...student, materias });
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${username}.pdf"` });
        res.send(pdf);
    } catch (e) {
        console.error('PDF error:', e);
        res.status(500).json({ error: 'Error generando PDF' });
    }
});

router.get('/pdf/teacher', requireAuth, requireRole('docente'), async (req, res) => {
    try {
        const data = getData();
        const username = req.session.user.username;
        const teacher = data.teachers[username];
        if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });
        const evaluations = dataStore.getTeacherEvaluations(username);
        const pdf = await pdfGen.generateTeacherEvaluationPDF(teacher, evaluations, data.evaluationQuestions);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="evaluacion-${username}.pdf"` });
        res.send(pdf);
    } catch (e) {
        console.error('PDF error:', e);
        res.status(500).json({ error: 'Error generando PDF' });
    }
});

router.get('/pdf/admin', requireAuth, requireRole('administrativo'), async (req, res) => {
    try {
        const data = getData();
        const students = Object.values(data.students);
        const teachers = Object.values(data.teachers);
        const byProgram = {};
        students.forEach(s => {
            if (!byProgram[s.programa]) byProgram[s.programa] = { count: 0, notas: [] };
            byProgram[s.programa].count++;
            s.materias.forEach(m => { if (m.nota !== null && !isNaN(m.nota)) byProgram[s.programa].notas.push(parseFloat(m.nota)); });
        });
        Object.keys(byProgram).forEach(p => {
            const n = byProgram[p].notas;
            byProgram[p].avg = n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(2) : null;
        });
        const subjectMap = {};
        students.forEach(s => s.materias.forEach(m => {
            if (!subjectMap[m.materia]) subjectMap[m.materia] = [];
            if (m.nota !== null && !isNaN(m.nota)) subjectMap[m.materia].push(parseFloat(m.nota));
        }));
        const subjectAvgs = Object.entries(subjectMap).map(([name, notes]) => ({
            name, avg: notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2) : null
        })).filter(s => s.avg !== null).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
        const allNotes = students.flatMap(s => s.materias.map(m => m.nota).filter(n => n !== null && !isNaN(n)));
        const overallAvg = allNotes.length ? (allNotes.reduce((a, b) => a + b, 0) / allNotes.length).toFixed(2) : null;
        const passRate = allNotes.length ? Math.round(allNotes.filter(n => n >= 3.0).length / allNotes.length * 100) : 0;
        let totalEvaluations = 0;
        Object.values(dataStore.getAllEvaluations()).forEach(ev => { totalEvaluations += Object.keys(ev).length; });
        const pdf = await pdfGen.generateAdminReportPDF({
            totalStudents: students.length, totalTeachers: teachers.length,
            totalPrograms: Object.keys(byProgram).length, overallAvg, passRate, totalEvaluations,
            byProgram, bestSubject: subjectAvgs[0] || null, worstSubject: subjectAvgs[subjectAvgs.length - 1] || null,
            bestTeacher: null
        });
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="informe-general.pdf"' });
        res.send(pdf);
    } catch (e) {
        console.error('PDF error:', e);
        res.status(500).json({ error: 'Error generando PDF' });
    }
});

// Admin can also get student/teacher PDFs for any user
router.get('/pdf/student/:username', requireAuth, requireRole('administrativo'), async (req, res) => {
    try {
        const data = getData();
        const username = req.params.username;
        const student = data.students[username];
        if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
        const pdf = await pdfGen.generateStudentPDF(student);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${username}.pdf"` });
        res.send(pdf);
    } catch (e) {
        res.status(500).json({ error: 'Error generando PDF' });
    }
});

module.exports = router;
