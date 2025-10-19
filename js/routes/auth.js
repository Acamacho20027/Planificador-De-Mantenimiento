// =====================================================
// RUTAS DE AUTENTICACIÓN - Conectado a SQL Server
// =====================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const csurf = require('csurf');
const rateLimit = require('express-rate-limit');

// CSRF protection
const csrfProtection = csurf();

// Rate limiter para login
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10
});

// POST /auth/login - Iniciar sesión
router.post('/login', loginLimiter, csrfProtection, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }
        
        // Buscar usuario en la base de datos
        const result = await db.query(`
            SELECT 
                u.id_usuario,
                u.nombre,
                u.email,
                u.password_hash,
                u.activo,
                r.nombre_rol AS rol
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.email = @email
        `, {
            email: email.toLowerCase().trim()
        });
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const user = result.recordset[0];
        
        // Verificar si el usuario está activo
        if (!user.activo) {
            return res.status(403).json({ error: 'Cuenta inactiva' });
        }
        
        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        // Actualizar último acceso
        await db.query(`
            UPDATE usuarios
            SET ultimo_acceso = GETDATE()
            WHERE id_usuario = @id_usuario
        `, {
            id_usuario: user.id_usuario
        });
        
        // Crear sesión
        req.session.user = {
            id_usuario: user.id_usuario,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol
        };
        
        res.json({
            success: true,
            user: {
                id_usuario: user.id_usuario,
                email: user.email,
                nombre: user.nombre,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// POST /auth/logout - Cerrar sesión
router.post('/logout', csrfProtection, (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al cerrar sesión' });
            }
            res.json({ success: true, message: 'Sesión cerrada correctamente' });
        });
    } else {
        res.json({ success: true });
    }
});

// GET /auth/me - Obtener usuario actual
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            authenticated: true,
            user: req.session.user
        });
    }
    res.json({ authenticated: false });
});

// Middleware para proteger rutas (exportado para usar en server.js)
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'No autenticado' });
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.rol === 'Administrador') {
        return next();
    }
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
};

router.requireAuth = requireAuth;
router.requireAdmin = requireAdmin;

module.exports = router;

