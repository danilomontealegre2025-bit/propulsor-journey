const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

// In-memory data store for attendance, evaluations, and runtime data
let store = {
    attendance: {},      // { teacherUser: { studentUser: 'presente'|'ausente' } }
    attendanceOverrides: {}, // { studentUser: true } - if true, failures are forgiven
    evaluations: {},     // { studentUser: { teacherUser: { answers: [], submittedAt: Date } } }
    notes: {},           // { studentUser: { materia: nota } } - overrides from Excel
    excelPath: null      // path to currently loaded Excel
};

// ── Persistence Logic ──────────────────────────────────────────────────────────
function loadDB() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            const parsed = JSON.parse(data);
            store = { ...store, ...parsed };
        }
    } catch (e) {
        console.error('Error loading database:', e);
    }
}

function saveDB() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
    } catch (e) {
        console.error('Error saving database:', e);
    }
}

// Initial load
loadDB();

// ── Attendance ────────────────────────────────────────────────────────────────
function setAttendance(teacherUser, studentUser, status) {
    if (!store.attendance[teacherUser]) store.attendance[teacherUser] = {};
    store.attendance[teacherUser][studentUser] = status;
    saveDB();
}

function getAttendance(teacherUser) {
    return store.attendance[teacherUser] || {};
}

function getAllAttendance() {
    return store.attendance;
}

function setAttendanceOverride(studentUser, status) {
    store.attendanceOverrides[studentUser] = status;
    saveDB();
}

function getAttendanceOverride(studentUser) {
    return !!store.attendanceOverrides[studentUser];
}

// ── Evaluations ───────────────────────────────────────────────────────────────
function saveEvaluation(studentUser, teacherUser, answers) {
    if (!store.evaluations[studentUser]) store.evaluations[studentUser] = {};
    store.evaluations[studentUser][teacherUser] = {
        answers,
        submittedAt: new Date().toISOString()
    };
    saveDB();
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
    saveDB();
}

function getNoteOverrides(studentUser) {
    return store.notes[studentUser] || {};
}

// ── Clear operations ──────────────────────────────────────────────────────────
function clearNotes() {
    store.notes = {};
    saveDB();
}

function clearEvaluations() {
    store.evaluations = {};
    saveDB();
}

function clearAttendance() {
    store.attendance = {};
    saveDB();
}

function clearAll() {
    store.attendance = {};
    store.evaluations = {};
    store.notes = {};
    saveDB();
}

function setExcelPath(p) {
    store.excelPath = p;
    saveDB();
}

function getExcelPath() {
    return store.excelPath;
}

module.exports = {
    setAttendance, getAttendance, getAllAttendance, setAttendanceOverride, getAttendanceOverride,
    saveEvaluation, hasEvaluated, getTeacherEvaluations, getAllEvaluations,
    setNote, getNoteOverrides,
    clearNotes, clearEvaluations, clearAttendance, clearAll,
    setExcelPath, getExcelPath
};
