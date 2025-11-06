// Servidor Node.js para Planificador de Mantenimiento
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Importar configuración de base de datos
const db = require('../config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const inspectionsRoutes = require('./routes/inspections');
const instructionsRoutes = require('./routes/instructions');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración básica
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'dev-reset-secret-change-me';
const IS_PROD = process.env.NODE_ENV === 'production';

// Middleware
// Apply helmet in production. In development, enable a relaxed helmet config
// to avoid strict headers that interfere with local LAN testing (HSTS/COOP).
if (IS_PROD) {
    app.use(helmet());
} else {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false,
        hsts: false
    }));
}
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    name: 'pm.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: IS_PROD,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// CSRF protection for state-changing routes using session storage
const csrfProtection = csurf();

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10
});
const resetLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5
});

// Servir archivos estáticos (desde la raíz del proyecto)
app.use(express.static(path.join(__dirname, '..')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Vistas', 'index.html'));
});

// =====================================================
// RUTAS DE API
// =====================================================

// Status endpoint
app.get('/api/status', async (req, res) => {
    try {
        // Probar conexión a base de datos
        await db.getConnection();
        res.json({ 
            status: 'ok', 
            message: 'Servidor y base de datos funcionando correctamente',
            database: 'SQL Server conectado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error de conexión a base de datos',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// CSRF token endpoint (sin rate limit)
app.get('/auth/csrf', csrfProtection, (req, res) => {
    // Prevent caching of the CSRF token response
    res.set('Cache-Control', 'no-store');
    res.json({ csrfToken: req.csrfToken() });
});

// Usar rutas de autenticación (sin aplicar middlewares aquí, se aplican dentro)
app.use('/auth', authRoutes);

// Usar rutas de usuarios (protegidas)
app.use('/api', authRoutes);

// Usar rutas de inspecciones (protegidas)
app.use('/api/inspections', authRoutes.requireAuth, inspectionsRoutes);

// Usar rutas de tareas (protegidas)
app.use('/api/tasks', authRoutes.requireAuth, tasksRoutes);

// Usar rutas de instrucciones (protegidas)
app.use('/api/instructions', authRoutes.requireAuth, instructionsRoutes);

// Obtener estadísticas (endpoint especial fuera de tasks)
app.get('/api/stats', authRoutes.requireAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                estado,
                COUNT(*) AS count
            FROM tareas
            GROUP BY estado
        `);
        
        const stats = {
            'No Iniciado': 0,
            'En Proceso': 0,
            'Finalizado': 0
        };
        
        result.recordset.forEach(row => {
            if (stats.hasOwnProperty(row.estado)) {
                stats[row.estado] = row.count;
            }
        });
        
        const labels = ['Completadas', 'En progreso', 'No iniciadas'];
        const counts = [
            stats['Finalizado'],
            stats['En Proceso'],
            stats['No Iniciado']
        ];
        
        res.json({ labels, counts });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Endpoint para el formulario de contacto
app.post('/api/contact', (req, res) => {
    const { nombre, email, telefono, mensaje } = req.body;
    
    console.log('📧 Nuevo mensaje de contacto:');
    console.log(`   Nombre: ${nombre}`);
    console.log(`   Email: ${email}`);
    console.log(`   Teléfono: ${telefono}`);
    console.log(`   Mensaje: ${mensaje}`);
    
    res.json({ 
        success: true, 
        message: 'Mensaje recibido correctamente' 
    });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

async function startServer() {
    try {
        // Probar conexión a base de datos
        await db.getConnection();
        
    // Iniciar servidor HTTP. Bind to 0.0.0.0 so the app accepts LAN connections
    // (not only localhost). This is useful for testing from other devices on
    // the same network. In production you may still want to front with a TLS
    // reverse proxy.
    app.listen(PORT, '0.0.0.0', () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('  🚀 SERVIDOR INICIADO EXITOSAMENTE');
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
            console.log(`  📋 Planificador de Mantenimiento`);
            console.log(`  🌐 URL: http://localhost:${PORT}`);
            console.log(`  💾 Base de Datos: SQL Server conectado`);
            console.log(`  📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log('');
            console.log('  Credenciales de prueba:');
            console.log('  📧 Email: admin@empresa.com');
            console.log('  🔐 Password: Admin123');
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════');
        console.error('  ❌ ERROR AL INICIAR SERVIDOR');
        console.error('═══════════════════════════════════════════════════════');
        console.error('');
        console.error('  Error de conexión a base de datos:');
        console.error(`  ${error.message}`);
        console.error('');
        console.error('  Soluciones:');
        console.error('  1. Verifica que SQL Server esté corriendo');
        console.error('  2. Revisa las credenciales en el archivo .env');
        console.error('  3. Asegúrate de que la base de datos "PlanificadorMantenimiento" existe');
        console.error('  4. Ejecuta el script: BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql');
        console.error('');
        console.error('═══════════════════════════════════════════════════════');
        console.error('');
        process.exit(1);
    }
}

startServer();

