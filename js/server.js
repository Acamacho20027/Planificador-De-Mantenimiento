// Servidor Node.js para Planificador de Mantenimiento
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
/* eslint-disable-next-line no-unused-vars */
const bcrypt = require('bcryptjs');
/* eslint-disable-next-line no-unused-vars */
const crypto = require('crypto');
/* eslint-disable-next-line no-unused-vars */
const { v4: uuidv4 } = require('uuid');

// Importar configuración de base de datos
const db = require('../config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const inspectionsRoutes = require('./routes/inspections');
const instructionsRoutes = require('./routes/instructions');
const bitacoraRoutes = require('./routes/bitacora');
const dashboardMetricsRoutes = require('./routes/dashboard-metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración básica
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';
/* eslint-disable-next-line no-unused-vars */
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'dev-reset-secret-change-me';
const IS_PROD = process.env.NODE_ENV === 'production';

// Debug secret (useful for temporary debug endpoints). Change in .env or keep default for local testing.
const DEBUG_SECRET = process.env.DEBUG_SECRET || 'dev-debug-secret';

// Middleware
// Apply helmet in production. In development, enable a relaxed helmet config
// to avoid strict headers that interfere with local LAN testing (HSTS/COOP).
const helmetCommonOptions = {
    originAgentCluster: false
};

if (IS_PROD) {
    app.use(helmet(helmetCommonOptions));
} else {
    app.use(helmet({
        ...helmetCommonOptions,
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
// parse cookies so we can read XSRF-TOKEN from requests
app.use(cookieParser());
// Increase JSON / urlencoded body size limits to allow larger base64 image uploads
// Default body-parser limit is small (~100kb). Adjust via env var BODY_LIMIT (e.g. "50mb").
// Default to 200mb to allow large base64 image uploads from mobile devices.
// Can be overridden with the BODY_LIMIT env var (e.g. BODY_LIMIT=400mb).
const BODY_LIMIT = process.env.BODY_LIMIT || '200mb';
console.log(`⚙️ body-parser limit set to ${BODY_LIMIT}`);
app.use(bodyParser.json({ limit: BODY_LIMIT }));
app.use(bodyParser.urlencoded({ limit: BODY_LIMIT, extended: true }));
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
// Allow token to be read from headers, body or the XSRF-TOKEN cookie (helps WebViews/iOS)
const csrfProtection = csurf({
    value: (req) => {
        return req.headers['x-csrf-token'] || req.headers['csrf-token'] || (req.cookies && req.cookies['XSRF-TOKEN']) || (req.body && (req.body._csrf || req.body.csrf || req.body['csrf-token'])) || null;
    }
});

// Rate limiters
/* eslint-disable-next-line no-unused-vars */
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10
});
/* eslint-disable-next-line no-unused-vars */
const resetLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5
});

// Servir archivos estáticos (desde la raíz del proyecto)
app.use(express.static(path.join(__dirname, '..')));

// Static serve for uploads. If UPLOAD_DIR env var points to an external drive (e.g. B:\uploads),
// expose it under the /uploads path so uploaded files are reachable by URLs like /uploads/tasks/:id/...
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
console.log(`⚙️ Serving uploads from: ${UPLOAD_DIR}`);

// Background quota enforcement: delete oldest files when total size exceeds UPLOAD_QUOTA_BYTES
const UPLOAD_QUOTA_BYTES = parseInt(process.env.UPLOAD_QUOTA_BYTES, 10) || (10 * 1024 * 1024 * 1024); // 10GB default
const QUOTA_CHECK_INTERVAL_MS = parseInt(process.env.QUOTA_CHECK_INTERVAL_MS, 10) || (24 * 60 * 60 * 1000); // daily

async function getAllFiles(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            const sub = await getAllFiles(full);
            files.push(...sub);
        } else if (ent.isFile()) {
            const stat = await fs.promises.stat(full);
            files.push({ path: full, mtime: stat.mtimeMs, size: stat.size });
        }
    }
    return files;
}

async function enforceUploadQuota() {
    try {
        const base = UPLOAD_DIR;
        if (!fs.existsSync(base)) return;
        const files = await getAllFiles(base);
        let total = files.reduce((s, f) => s + (f.size || 0), 0);
        if (total <= UPLOAD_QUOTA_BYTES) return;
        // Soft-delete: move oldest files to .trash directory instead of permanent deletion
        files.sort((a, b) => a.mtime - b.mtime);
        const trashDir = path.join(UPLOAD_DIR, '.trash');
        await fs.promises.mkdir(trashDir, { recursive: true });
        console.log(`⚠️ Upload quota exceeded: ${total} bytes used, limit ${UPLOAD_QUOTA_BYTES}. Moving oldest files to .trash...`);
        for (const f of files) {
            try {
                const rel = path.relative(UPLOAD_DIR, f.path);
                // create a mirror path inside .trash with timestamp prefix to avoid collisions
                const destName = `${Date.now()}-${rel.replace(/[\\/]/g, '_')}`;
                const dest = path.join(trashDir, destName);
                await fs.promises.rename(f.path, dest);
                total -= f.size;
                console.log(`Moved ${f.path} -> ${dest} (${f.size} bytes). New total: ${total}`);
                if (total <= UPLOAD_QUOTA_BYTES) break;
            } catch (e) {
                console.warn('Failed moving file during quota enforcement:', f.path, e && e.message);
            }
        }
    } catch (err) {
        console.error('Error during upload quota enforcement:', err && err.message);
    }
}

// Purge trash older than retention days (permanently delete). Retention configurable via UPLOAD_TRASH_RETENTION_DAYS
const UPLOAD_TRASH_RETENTION_DAYS = parseInt(process.env.UPLOAD_TRASH_RETENTION_DAYS, 10) || 30;

async function purgeTrash() {
    try {
        const trashDir = path.join(UPLOAD_DIR, '.trash');
        if (!fs.existsSync(trashDir)) return;
        const entries = await fs.promises.readdir(trashDir);
        const now = Date.now();
        for (const e of entries) {
            const full = path.join(trashDir, e);
            try {
                const st = await fs.promises.stat(full);
                const ageDays = (now - st.mtimeMs) / (1000 * 60 * 60 * 24);
                if (ageDays >= UPLOAD_TRASH_RETENTION_DAYS) {
                    if (st.isDirectory()) {
                        await fs.promises.rm(full, { recursive: true, force: true });
                    } else {
                        await fs.promises.unlink(full);
                    }
                    console.log(`Purged trash item: ${full}`);
                }
            } catch (inner) {
                console.warn('Failed to purge trash item:', full, inner && inner.message);
            }
        }
    } catch (err) {
        console.error('Error during trash purge:', err && err.message);
    }
}

// Run once at server start and schedule periodic checks
enforceUploadQuota().catch(() => {});
purgeTrash().catch(() => {});
setInterval(() => enforceUploadQuota().catch(() => {}), QUOTA_CHECK_INTERVAL_MS);
setInterval(() => purgeTrash().catch(() => {}), QUOTA_CHECK_INTERVAL_MS);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Vistas', 'index.html'));
});

// Temporary debug endpoint to show what headers/cookies the client sends.
// Only enabled when DEBUG_SECRET is provided and not in production unless explicitly allowed.
app.get('/debug/request-info', (req, res) => {
    const secret = req.query.secret || req.headers['x-debug-secret'];
    if (!secret || secret !== DEBUG_SECRET) {return res.status(403).json({ error: 'forbidden' });}
    // Avoid exposing in production unless DEBUG_SECRET explicitly set to something non-default
    if (IS_PROD && process.env.DEBUG_SECRET !== DEBUG_SECRET) {return res.status(403).json({ error: 'disabled in production' });}

    const info = {
        ip: req.ip,
        path: req.originalUrl,
        headers: req.headers,
        cookies: req.cookies || null,
        session: req.session && req.session.user ? { user: req.session.user } : null,
        body: req.body || null
    };

    console.log('🔎 Debug request-info called:', { ip: info.ip, path: info.path });
    console.log('    cookies:', info.cookies);
    console.log('    headers.x-csrf-token:', req.get('x-csrf-token'));
    console.log('    headers.csrf-token:', req.get('csrf-token'));

    res.json(info);
});

// =====================================================
// RUTAS DE API
// =====================================================

// Status endpoint
app.get('/api/status', async (req, res) => {
    try {
        // Probar conexión a base de datos
        await db.getConnection();
        // Verify upload directory is writable (fail fast if not)
        try {
            await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
            const testFile = path.join(UPLOAD_DIR, `.perm_check_${Date.now()}`);
            await fs.promises.writeFile(testFile, 'ok');
            await fs.promises.unlink(testFile);
            console.log(`✅ Upload directory is writable: ${UPLOAD_DIR}`);
        } catch (uplErr) {
            console.error(`❌ UPLOAD_DIR not writable: ${UPLOAD_DIR}`);
            console.error(uplErr && uplErr.message ? uplErr.message : uplErr);
            process.exit(1);
        }
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
    // Also expose token in a non-HttpOnly cookie (useful for SPA clients)
    // so clients that read cookies (or frameworks expecting XSRF-TOKEN) can pick it up.
    try {
        const token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token, { httpOnly: false, sameSite: 'lax', secure: IS_PROD });
        res.json({ csrfToken: token });
    } catch (err) {
        console.error('Error generando CSRF token:', err);
        res.status(500).json({ error: 'No se pudo generar CSRF token' });
    }
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

// Rutas de bitácoras (protegidas; procesar/descargar requieren admin dentro del router)
app.use('/api/bitacora', authRoutes.requireAuth, bitacoraRoutes);

// Rutas de métricas del dashboard (datos reales para gráficos)
app.use('/api/dashboard', authRoutes.requireAuth, dashboardMetricsRoutes);

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
            if (Object.prototype.hasOwnProperty.call(stats, row.estado)) {
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

// Error handler to surface CSRF failures with extra debug info
app.use((err, req, res, next) => {
    if (!err) {return next();}
    // Friendly JSON response for oversized payloads (body-parser / raw-body)
    if (err.type === 'entity.too.large' || err.status === 413) {
        console.warn('⚠️ Payload too large:', { url: req.originalUrl, ip: req.ip, limit: BODY_LIMIT });
        return res.status(413).json({ error: 'PayloadTooLarge', message: `Request exceeds server limit (${BODY_LIMIT})` });
    }
    try {
        if (err.code === 'EBADCSRFTOKEN') {
            console.warn('⚠️ EBADCSRFTOKEN detected');
            console.warn('  Path:', req.originalUrl);
            console.warn('  IP:', req.ip);
            console.warn('  Cookies header:', req.headers.cookie || '<none>');
            console.warn('  x-csrf-token header:', req.get('x-csrf-token') || '<none>');
            console.warn('  csrf-token header:', req.get('csrf-token') || '<none>');
            console.warn('  body._csrf:', (req.body && (req.body._csrf || req.body.csrf || req.body['csrf-token'])) || '<none>');
            // return a structured JSON so client sees a clear message
            return res.status(403).json({ error: 'invalid csrf token' });
        }
    } catch (logErr) {
        console.error('Error while logging CSRF failure:', logErr);
    }
    // otherwise pass to default error handler
    next(err);
});

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

