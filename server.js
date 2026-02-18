const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
fs.mkdirSync(path.join(__dirname, 'data/uploads'), { recursive: true });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'propulsor-journey-externado-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// API routes
app.use('/api', apiRouter);

// SPA fallback for dashboard routes
app.get('/dashboard-student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard-student.html'));
});
app.get('/dashboard-teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard-teacher.html'));
});
app.get('/dashboard-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard-admin.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🎓 Propulsor Journey - Universidad Externado de Colombia`);
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`\n📋 Credenciales de prueba:`);
    console.log(`   Estudiante: est01 / 789`);
    console.log(`   Docente:    doc01 / 123`);
    console.log(`   Admin:      admin / admin2024\n`);
});
