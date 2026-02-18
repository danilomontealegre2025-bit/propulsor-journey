// In-memory data store for attendance, evaluations, and runtime data
const store = {
    attendance: {},      // { teacherUser: { studentUser: 'presente'|'ausente' } }
    evaluations: {},     // { studentUser: { teacherUser: { answers: [], submittedAt: Date } } }
    notes: {},           // { studentUser: { materia: nota } } - overrides from Excel
    excelPath: null      // path to currently loaded Excel
};

// ── Attendance ────────────────────────────────────────────────────────────────
function setAttendance(teacherUser, studentUser, status) {
    if (!store.attendance[teacherUser]) store.attendance[teacherUser] = {};
    store.attendance[teacherUser][studentUser] = status;
}

function getAttendance(teacherUser) {
    return store.attendance[teacherUser] || {};
}

// ── Evaluations ───────────────────────────────────────────────────────────────
function saveEvaluation(studentUser, teacherUser, answers) {
    if (!store.evaluations[studentUser]) store.evaluations[studentUser] = {};
    store.evaluations[studentUser][teacherUser] = {
        answers,
        submittedAt: new Date().toISOString()
    };
}

function hasEvaluated(studentUser, teacherUser) {
    return !!(store.evaluations[studentUser] && store.evaluations[studentUser][teacherUser]);
}

function getTeacherEvaluations(teacherUser) {
    const results = [];
    Object.keys(store.evaluations).forEach(studentUser => {
        if (store.evaluations[studentUser][teacherUser]) {
            results.push({
                studentUser,
                ...store.evaluations[studentUser][teacherUser]
            });
        }
    });
    return results;
}

function getAllEvaluations() {
    return store.evaluations;
}

// ── Notes override ────────────────────────────────────────────────────────────
function setNote(studentUser, materia, nota) {
    if (!store.notes[studentUser]) store.notes[studentUser] = {};
    store.notes[studentUser][materia] = nota;
}

function getNoteOverrides(studentUser) {
    return store.notes[studentUser] || {};
}

// ── Clear operations ──────────────────────────────────────────────────────────
function clearNotes() {
    store.notes = {};
}

function clearEvaluations() {
    store.evaluations = {};
}

function clearAttendance() {
    store.attendance = {};
}

function clearAll() {
    store.attendance = {};
    store.evaluations = {};
    store.notes = {};
}

function setExcelPath(p) {
    store.excelPath = p;
}

function getExcelPath() {
    return store.excelPath;
}

module.exports = {
    setAttendance, getAttendance,
    saveEvaluation, hasEvaluated, getTeacherEvaluations, getAllEvaluations,
    setNote, getNoteOverrides,
    clearNotes, clearEvaluations, clearAttendance, clearAll,
    setExcelPath, getExcelPath
};
