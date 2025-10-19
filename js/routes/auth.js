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
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('email', email.toLowerCase().trim())
            .query(`
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
            `);
        
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
        await pool.request()
            .input('id_usuario', user.id_usuario)
            .query(`
                UPDATE usuarios
                SET ultimo_acceso = GETDATE()
                WHERE id_usuario = @id_usuario
            `);
        
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

// GET /api/usuarios - Obtener lista de usuarios (para dropdowns)
router.get('/usuarios', requireAuth, async (req, res) => {
    try {
        const pool = await db.getConnection();
        const result = await pool.request().query(`
            SELECT 
                u.id_usuario AS user_id,
                u.nombre,
                u.email,
                r.nombre_rol AS rol,
                u.activo
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.activo = 1
            ORDER BY u.nombre, u.email
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// POST /api/usuarios - Crear nuevo usuario (solo admin)
router.post('/usuarios', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email, nombre, rol } = req.body;
        
        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'Email es requerido' });
        }
        
        // Verificar si el email ya existe
        const pool = await db.getConnection();
        const existingUser = await pool.request()
            .input('email', email.toLowerCase().trim())
            .query(`
                SELECT id_usuario FROM usuarios WHERE email = @email
            `);
        
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        
        // Obtener ID del rol
        const rolResult = await pool.request()
            .input('rol', rol || 'Usuario')
            .query(`
                SELECT id_rol FROM roles WHERE nombre_rol = @rol
            `);
        
        if (rolResult.recordset.length === 0) {
            return res.status(400).json({ error: 'Rol inválido' });
        }
        
        const id_rol = rolResult.recordset[0].id_rol;
        
        // Crear usuario con contraseña por defecto
        const defaultPassword = 'Admin123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        const result = await pool.request()
            .input('nombre', nombre || null)
            .input('email', email.toLowerCase().trim())
            .input('password_hash', passwordHash)
            .input('id_rol', id_rol)
            .query(`
                INSERT INTO usuarios (nombre, email, password_hash, id_rol, activo)
                OUTPUT INSERTED.id_usuario, INSERTED.nombre, INSERTED.email
                VALUES (@nombre, @email, @password_hash, @id_rol, 1)
            `);
        
        const newUser = result.recordset[0];
        
        res.status(201).json({
            user_id: newUser.id_usuario,
            nombre: newUser.nombre,
            email: newUser.email,
            rol: rol || 'Usuario',
            message: 'Usuario creado exitosamente'
        });
        
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// DELETE /api/usuarios/:id - Eliminar usuario (solo admin)
router.delete('/usuarios/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        
        // No permitir eliminar el usuario actual
        if (req.session.user.id_usuario === userId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        
        // Desactivar usuario en lugar de eliminar
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('id_usuario', userId)
            .query(`
                UPDATE usuarios 
                SET activo = 0, fecha_actualizacion = GETDATE()
                WHERE id_usuario = @id_usuario
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ success: true, message: 'Usuario desactivado exitosamente' });
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

router.requireAuth = requireAuth;
router.requireAdmin = requireAdmin;

module.exports = router;

