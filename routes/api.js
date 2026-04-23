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

    const allAttendance = dataStore.getAllAttendance();
    const materias = student.materias.map(m => {
        let totalSessions = (m.fechas || []).length;
        let presentCount = 0;
        let absentCount = 0;

        if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
            const matAtt = allAttendance[m.usuarioDocente][m.materia];
            Object.keys(matAtt).forEach(date => {
                const status = matAtt[date][username];
                if (status === 'presente') presentCount++;
                else if (status === 'ausente') absentCount++;
                else if (typeof status === 'number') {
                    // It's hours
                    presentCount += status; // count hours as "present count" for legacy fallback or UI display
                }
            });
        }

        return {
            ...m,
            attendance: {
                total: m.horas || totalSessions, // use total hours if available
                present: presentCount,
                absent: absentCount,
                percentage: (m.horas || totalSessions) > 0 ? ((presentCount / (m.horas || totalSessions)) * 100).toFixed(0) : 0
            }
        };
    });

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
    
    // Return materias with their dates and students
    // Enrich students with their grades for this teacher's materias and overall badge status
    const allAttendance = dataStore.getAllAttendance();
    const enrichedStudents = teacher.estudiantes.map(s => {
        const studentData = data.students[s.usuario];
        const studentNotes = {};
        let totalProgramHours = 0;
        let totalAssistedHours = 0;
        let noteSum = 0;
        let noteCount = 0;

        if (studentData && studentData.materias) {
            studentData.materias.forEach(m => {
                if (m.usuarioDocente === username) {
                    studentNotes[m.materia] = m.nota;
                }
                totalProgramHours += (m.horas || 0);

                if (m.nota !== null && !isNaN(m.nota)) {
                    noteSum += parseFloat(m.nota);
                    noteCount++;
                }

                // Sum up attendance hours across all their materias
                if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
                    const matAtt = allAttendance[m.usuarioDocente][m.materia];
                    Object.values(matAtt).forEach(dateAtt => {
                        const hrs = dateAtt[s.usuario];
                        if (hrs && !isNaN(hrs)) {
                            totalAssistedHours += parseFloat(hrs);
                        }
                    });
                }
            });
        }

        const promedioFinal = noteCount > 0 ? (noteSum / noteCount) : 0;
        const attendancePct = totalProgramHours > 0 ? (totalAssistedHours / totalProgramHours) * 100 : 0;

        let badgeCategory = 'Ninguna';
        if (totalProgramHours >= 90 && totalProgramHours <= 120) badgeCategory = 'Competencia';
        else if (totalProgramHours >= 25 && totalProgramHours <= 89) badgeCategory = 'Habilidad';
        else if (totalProgramHours >= 12 && totalProgramHours <= 24) badgeCategory = 'Asistencia';

        // The user mentioned <= 80% earlier but also explicitly clarified "nota <= 3.0" which was likely a typo for >= 3.0.
        // We will grant the badge if attendance >= 80% and nota >= 3.0.
        // "que diga: es insignia digital de acuerdo a cada categoria, ejemplo: habilidad"
        let insigniaStatus = 'No Cumple';
        if (attendancePct >= 80 && promedioFinal >= 3.0 && badgeCategory !== 'Ninguna') {
            insigniaStatus = `Insignia Digital: ${badgeCategory}`;
        }

        return {
            ...s,
            notas: studentNotes,
            insignia: insigniaStatus,
            promedio: promedioFinal.toFixed(1),
            asistenciaTotalVal: attendancePct.toFixed(0)
        };
    });

    res.json({ 
        nombre: teacher.nombre, 
        materias: teacher.materias,
        estudiantes: enrichedStudents,
        attendance,
        username 
    });
});

router.post('/teacher/attendance', requireAuth, requireRole('docente'), (req, res) => {
    const { studentUser, materia, date, status } = req.body;
    const teacherUser = req.session.user.username;
    if (!studentUser || !materia || !date || status === undefined) {
        return res.status(400).json({ error: 'Faltan datos (studentUser, materia, date, status/hours)' });
    }
    // We store the numeric hours directly 
    const hours = parseFloat(status);
    dataStore.setAttendance(teacherUser, materia, date, studentUser, isNaN(hours) ? status : hours);
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
    const questions = data.evaluationQuestions || [];

    const ratingQuestions = questions.filter(q => q.type !== 'text');
    const textQuestions = questions.filter(q => q.type === 'text');

    const sections = [...new Set(ratingQuestions.map(q => q.section || 'General'))];
    const sectionStats = sections.map(section => {
        const secQs = ratingQuestions.filter(q => q.section === section || (!q.section && section === 'General'));
        const qIds = secQs.map(q => q.id);
        
        let sectionAnswers = [];
        evaluations.forEach(e => {
            e.answers.forEach(a => {
                if (qIds.includes(a.questionId)) {
                    const val = parseFloat(a.value);
                    if (!isNaN(val)) sectionAnswers.push(val);
                }
            });
        });
        const sectionAvg = sectionAnswers.length ? (sectionAnswers.reduce((s, v) => s + v, 0) / sectionAnswers.length).toFixed(2) : 'N/A';
        return {
            section,
            avg: sectionAvg,
            count: sectionAnswers.length
        };
    });

    const comments = textQuestions.flatMap(q => {
        return evaluations.map(e => e.answers.find(a => a.questionId == q.id)?.value).filter(v => v);
    });

    const allRatingAnswers = evaluations.flatMap(e => 
        e.answers.filter(a => ratingQuestions.some(rq => rq.id == a.questionId))
                 .map(a => parseFloat(a.value))
    ).filter(v => !isNaN(v));
    const overallAvg = allRatingAnswers.length ? (allRatingAnswers.reduce((s, v) => s + v, 0) / allRatingAnswers.length).toFixed(2) : 'N/A';

    res.json({ 
        evaluations, 
        overallAvg,
        questionStats: sectionStats,
        comments
    });
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
        // Find evaluations by username
        const username = Object.keys(data.teachers).find(u => data.teachers[u].nombre === t.nombre);
        const evals = dataStore.getTeacherEvaluations(username || t.nombre.toLowerCase().replace(' ', ''));
        const questions = data.evaluationQuestions || [];
        const ratingQuestionIds = questions.filter(q => q.type !== 'text').map(q => q.id);
        
        const allAnswers = evals.flatMap(e => 
            e.answers
             .filter(a => ratingQuestionIds.includes(a.questionId))
             .map(a => parseFloat(a.value))
        ).filter(v => !isNaN(v));
        
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
    const allAttendance = dataStore.getAllAttendance();

    // Map students with their attendance stats
    const students = Object.entries(data.students).map(([username, s]) => {
        const studentAttendance = {};
        let totalAssistedHours = 0;
        let totalProgramHours = 0;
        let noteSum = 0;
        let noteCount = 0;

        s.materias.forEach(m => {
            totalProgramHours += (m.horas || 0);
            if (m.nota !== null && !isNaN(m.nota)) {
                noteSum += parseFloat(m.nota);
                noteCount++;
            }
            if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
                const matAtt = allAttendance[m.usuarioDocente][m.materia];
                Object.values(matAtt).forEach(dateAtt => {
                    const hrs = dateAtt[username];
                    if (hrs && !isNaN(hrs) && typeof hrs === 'number') {
                        totalAssistedHours += parseFloat(hrs);
                    } else if (hrs === 'presente') {
                        totalAssistedHours += 1;
                    }
                });
            }
        });

        const promedioFinal = noteCount > 0 ? parseFloat((noteSum / noteCount).toFixed(2)) : 0;
        const attendancePct = totalProgramHours > 0 ? Math.round((totalAssistedHours / totalProgramHours) * 100) : 0;

        let badgeCategory = 'Ninguna';
        if (totalProgramHours >= 90 && totalProgramHours <= 120) badgeCategory = 'Competencia';
        else if (totalProgramHours >= 25 && totalProgramHours <= 89) badgeCategory = 'Habilidad';
        else if (totalProgramHours >= 12 && totalProgramHours <= 24) badgeCategory = 'Asistencia';

        let insigniaStatus = 'No Cumple';
        if (attendancePct >= 80 && promedioFinal >= 3.0 && badgeCategory !== 'Ninguna') {
            insigniaStatus = `Insignia Digital: ${badgeCategory}`;
        }

        return {
            username,
            ...s,
            attendanceStats: {
                totalProgramHours,
                totalAssistedHours,
                attendancePct,
                promedioFinal,
                insigniaStatus,
                isForgiven: dataStore.getAttendanceOverride(username)
            }
        };
    });

    res.json({
        students,
        teachers: Object.entries(data.teachers).map(([username, t]) => ({ 
            username, 
            ...t,
            materias: t.materias ? t.materias.map(m => m.materia) : []
        }))
    });
});

router.post('/admin/override-attendance', requireAuth, requireRole('administrativo'), (req, res) => {
    const { studentUser, status } = req.body;
    if (!studentUser) return res.status(400).json({ error: 'Usuario requerido' });
    dataStore.setAttendanceOverride(studentUser, status);
    res.json({ success: true, message: `Estado de asistencia para ${studentUser} actualizado` });
});

router.get('/admin/teacher-evaluations/:teacherUser', requireAuth, requireRole('administrativo'), (req, res) => {
    const data = getData();
    const teacherUser = req.params.teacherUser;
    const teacher = data.teachers[teacherUser];
    if (!teacher) return res.status(404).json({ error: 'Docente no encontrado' });

    const evaluations = dataStore.getTeacherEvaluations(teacherUser);
    const questions = data.evaluationQuestions || [];

    // Segment questions
    const ratingQuestions = questions.filter(q => q.type !== 'text');
    const textQuestions = questions.filter(q => q.type === 'text');

    // Calculate averages per section
    const sections = [...new Set(ratingQuestions.map(q => q.section || 'General'))];
    const sectionStats = sections.map(section => {
        const secQs = ratingQuestions.filter(q => q.section === section || (!q.section && section === 'General'));
        const qIds = secQs.map(q => q.id);
        
        let sectionAnswers = [];
        evaluations.forEach(e => {
            e.answers.forEach(a => {
                if (qIds.includes(a.questionId)) {
                    const val = parseFloat(a.value);
                    if (!isNaN(val)) sectionAnswers.push(val);
                }
            });
        });
        const sectionAvg = sectionAnswers.length ? (sectionAnswers.reduce((s, v) => s + v, 0) / sectionAnswers.length).toFixed(2) : 'N/A';
        return {
            section,
            avg: sectionAvg,
            count: sectionAnswers.length
        };
    });

    const comments = textQuestions.flatMap(q => {
        return evaluations.map(e => e.answers.find(a => a.questionId == q.id)?.value).filter(v => v);
    });

    const allRatingAnswers = evaluations.flatMap(e => 
        e.answers.filter(a => ratingQuestions.some(rq => rq.id == a.questionId))
                 .map(a => parseFloat(a.value))
    ).filter(v => !isNaN(v));
    const overallAvg = allRatingAnswers.length ? (allRatingAnswers.reduce((s, v) => s + v, 0) / allRatingAnswers.length).toFixed(2) : 'N/A';

    res.json({
        teacherName: teacher.nombre,
        overallAvg,
        totalEvaluations: evaluations.length,
        questionStats: sectionStats, // rename kept for compatibility if needed, but it refers to sections now
        comments
    });
});

router.post('/admin/clear', requireAuth, requireRole('administrativo'), (req, res) => {
    const { type } = req.body;
    if (type === 'notes') dataStore.clearNotes();
    else if (type === 'evaluations') dataStore.clearEvaluations();
    else if (type === 'attendance') dataStore.clearAttendance();
    else if (type === 'all') dataStore.clearAll(); // clearAll also resets attendanceOverrides
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

router.post('/admin/override-grade', requireAuth, requireRole('administrativo'), (req, res) => {
    const { studentUser, materia, nota } = req.body;
    if (!studentUser || !materia || nota === undefined) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }
    dataStore.setNote(studentUser, materia, parseFloat(nota));
    res.json({ success: true, message: `Nota de ${materia} para ${studentUser} actualizada a ${nota}` });
});

router.get('/admin/export-excel', requireAuth, requireRole('administrativo'), (req, res) => {
    const data = getData();
    const XLSX = require('xlsx');

    const wb = XLSX.utils.book_new();

    // Students sheet
    const studentRows = [];
    const allAttendance = dataStore.getAllAttendance();

    Object.entries(data.students).forEach(([user, s]) => {
        let totalProgramHours = 0;
        let totalAssistedHours = 0;
        let noteSum = 0;
        let noteCount = 0;

        s.materias.forEach(m => {
            totalProgramHours += (m.horas || 0);
            if (m.nota !== null && !isNaN(m.nota)) {
                noteSum += parseFloat(m.nota);
                noteCount++;
            }
            if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
                const matAtt = allAttendance[m.usuarioDocente][m.materia];
                Object.values(matAtt).forEach(dateAtt => {
                    const hrs = dateAtt[user];
                    if (hrs && !isNaN(hrs) && typeof hrs === 'number') {
                        totalAssistedHours += parseFloat(hrs);
                    } else if (hrs === 'presente') {
                        totalAssistedHours += 1;
                    }
                });
            }
        });

        const promedioFinal = noteCount > 0 ? (noteSum / noteCount) : 0;
        const attendancePct = totalProgramHours > 0 ? Math.round((totalAssistedHours / totalProgramHours) * 100) : 0;

        let badgeCategory = 'Ninguna';
        if (totalProgramHours >= 90 && totalProgramHours <= 120) badgeCategory = 'Competencia';
        else if (totalProgramHours >= 25 && totalProgramHours <= 89) badgeCategory = 'Habilidad';
        else if (totalProgramHours >= 12 && totalProgramHours <= 24) badgeCategory = 'Asistencia';

        let insigniaStatus = 'No Cumple';
        if (attendancePct >= 80 && promedioFinal >= 3.0 && badgeCategory !== 'Ninguna') {
            insigniaStatus = `Insignia Digital: ${badgeCategory}`;
        }

        s.materias.forEach(m => {
            // materia specific attendance just for this row (optional, simplified to total if we prefer, but let's calculate per materia hrs)
            let materiaHrs = 0;
            if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
                Object.values(allAttendance[m.usuarioDocente][m.materia]).forEach(dateAtt => {
                    if (typeof dateAtt[user] === 'number') materiaHrs += dateAtt[user];
                    else if (dateAtt[user] === 'presente') materiaHrs += 1;
                });
            }

            studentRows.push({
                'Usuario': user,
                'Nombre': s.nombre,
                'Programa': s.programa,
                'Insignia Digital': insigniaStatus,
                'Materia': m.materia,
                'Docente': m.docente,
                'Nota': m.nota !== null ? parseFloat(m.nota) : 'Sin nota',
                'Horas Asistidas Materia': materiaHrs,
                'Total Horas Programa': totalProgramHours,
                'Asistencias Programa (Hrs)': totalAssistedHours,
                '% Asistencia': attendancePct + '%',
                'Promedio Final': parseFloat(promedioFinal.toFixed(1))
            });
        });
    });
    const wsStudents = XLSX.utils.json_to_sheet(studentRows);
    XLSX.utils.book_append_sheet(wb, wsStudents, "Notas Estudiantes");

    // Teacher sheet
    const teacherRows = Object.entries(data.teachers).map(([user, t]) => ({
        'Usuario': user,
        'Nombre': t.nombre,
        'Programas': t.programas.join(', '),
        'Total Estudiantes': t.estudiantes ? t.estudiantes.length : 0
    }));
    const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
    XLSX.utils.book_append_sheet(wb, wsTeachers, "Docentes");

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="consolidado-notas-propulsor.xlsx"');
    res.send(buffer);
});

// ── PDF endpoints ─────────────────────────────────────────────────────────────
router.get('/pdf/student', requireAuth, requireRole('estudiante'), async (req, res) => {
    try {
        const data = getData();
        const username = req.session.user.username;
        const student = data.students[username];
        if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
        const overrides = dataStore.getNoteOverrides(username);
        const allAttendance = dataStore.getAllAttendance();
        const materias = student.materias.map(m => {
            let horasAsistidas = 0;
            const totalHoras = m.horas || (m.fechas ? m.fechas.length : 0);
            if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
                const matAtt = allAttendance[m.usuarioDocente][m.materia];
                Object.keys(matAtt).forEach(date => {
                    const val = matAtt[date][username];
                    if (typeof val === 'number' && !isNaN(val)) horasAsistidas += val;
                    else if (val === 'presente') horasAsistidas += 1;
                });
            }
            return {
                ...m,
                nota: overrides[m.materia] !== undefined ? overrides[m.materia] : m.nota,
                fechas: Array(totalHoras).fill(null), // use horas as total slot count
                attendance: { present: horasAsistidas }
            };
        });
        const pdf = await pdfGen.generateStudentPDF({ ...student, materias });
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${username}.pdf"` });
        res.send(pdf);
    } catch (e) {
        console.error('PDF error (Student):', e);
        res.status(500).json({ error: 'Error generando PDF: ' + e.message });
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
        console.error('PDF error (Teacher):', e);
        res.status(500).json({ error: 'Error generando PDF: ' + e.message });
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
        console.error('PDF error (Admin):', e);
        res.status(500).json({ error: 'Error generando PDF: ' + e.message });
    }
});

// Admin can also get student/teacher PDFs for any user
router.get('/pdf/student/:username', requireAuth, requireRole('administrativo'), async (req, res) => {
    try {
        const data = getData();
        const username = req.params.username;
        const student = data.students[username];
        if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
        const overrides = dataStore.getNoteOverrides(username);
        const allAttendance = dataStore.getAllAttendance();
        const materias = student.materias.map(m => {
            let horasAsistidas = 0;
            const totalHoras = m.horas || (m.fechas ? m.fechas.length : 0);
            if (m.usuarioDocente && allAttendance[m.usuarioDocente] && allAttendance[m.usuarioDocente][m.materia]) {
                const matAtt = allAttendance[m.usuarioDocente][m.materia];
                Object.keys(matAtt).forEach(date => {
                    const val = matAtt[date][username];
                    if (typeof val === 'number' && !isNaN(val)) horasAsistidas += val;
                    else if (val === 'presente') horasAsistidas += 1;
                });
            }
            return {
                ...m,
                nota: overrides[m.materia] !== undefined ? overrides[m.materia] : m.nota,
                fechas: Array(totalHoras).fill(null), // use horas as total slot count
                attendance: { present: horasAsistidas }
            };
        });
        const pdf = await pdfGen.generateStudentPDF({ ...student, materias });
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${username}.pdf"` });
        res.send(pdf);
    } catch (e) {
        console.error('PDF error (Admin-Student):', e);
        res.status(500).json({ error: 'Error generando PDF: ' + e.message });
    }
});

module.exports = router;
