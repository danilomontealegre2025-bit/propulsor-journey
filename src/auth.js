const { getData } = require('./excelParser');

function authenticate(username, password) {
    const data = getData();
    const user = data.users[username.toLowerCase()];
    if (!user) return null;
    if (String(user.password) === String(password)) {
        return { ...user };
    }
    return null;
}

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'No autenticado' });
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const userRole = req.session.user.role;
        // Admin has access to everything
        if (userRole === 'administrativo' || roles.includes(userRole)) {
            return next();
        }
        res.status(403).json({ error: 'Acceso denegado' });
    };
}

module.exports = { authenticate, requireAuth, requireRole };
