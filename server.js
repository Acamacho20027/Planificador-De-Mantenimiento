// Servidor Node.js para Planificador de Mantenimiento
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

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración básica
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'dev-reset-secret-change-me';
const IS_PROD = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet());
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

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// ---- In-memory user store (ready to swap for SQL Server) ----
// Structure mirrors the future DB schema fields we need operationally
const users = new Map(); // key: email lowercased -> user object
const usersById = new Map();

// Demo bootstrap user
async function bootstrapDemoUser() {
    const email = 'demo@empresa.com';
    const password = 'Demo1234!';
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
        user_id: uuidv4(),
        email,
        password_hash: passwordHash,
        is_active: true,
        nombre: 'Usuario Demo',
        rol: 'admin',
        failed_login_count: 0,
        last_failed_at: null,
        lockout_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    users.set(email.toLowerCase(), user);
    usersById.set(user.user_id, user);
    console.log('👤 Usuario demo listo:', { email, password });
}
bootstrapDemoUser().catch(console.error);

// In-memory password reset tokens: key token_id -> record
const passwordResetTokens = new Map();

function nowUtc() {
    return new Date();
}

function hmacToken(raw) {
    return crypto.createHmac('sha256', RESET_TOKEN_SECRET).update(raw).digest('hex');
}

function isLocked(user) {
    if (!user.lockout_until) return false;
    const until = new Date(user.lockout_until);
    return until > nowUtc();
}

function registerFailure(user) {
    user.failed_login_count = (user.failed_login_count || 0) + 1;
    user.last_failed_at = nowUtc().toISOString();
    if (user.failed_login_count >= 5) {
        const lockMins = 15;
        user.lockout_until = new Date(nowUtc().getTime() + lockMins * 60 * 1000).toISOString();
    }
    user.updated_at = nowUtc().toISOString();
}

function registerSuccess(user) {
    user.failed_login_count = 0;
    user.lockout_until = null;
    user.updated_at = nowUtc().toISOString();
}

function requireAuth(req, res, next) {
    if (req.session && req.session.user) return next();
    res.status(401).json({ error: 'No autenticado' });
}

// CSRF token endpoint for clients to fetch a token and send in header 'x-csrf-token'
app.get('/auth/csrf', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Auth: login
app.post('/auth/login', loginLimiter, csrfProtection, async (req, res) => {
    const { email = '', password = '' } = req.body || {};
    const normalized = String(email).trim().toLowerCase();
    let user = users.get(normalized) || null;

    // Timing-safe behavior if user not found
    if (!user) {
        try { await bcrypt.compare(password, await bcrypt.hash('dummy', 10)); } catch (_) {}
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.is_active) {
        return res.status(403).json({ error: 'Cuenta inactiva' });
    }

    if (isLocked(user)) {
        return res.status(423).json({ error: 'Cuenta bloqueada temporalmente', lockout_until: user.lockout_until });
    }

    const ok = await bcrypt.compare(password, user.password_hash).catch(() => false);
    if (!ok) {
        registerFailure(user);
        return res.status(401).json({ error: 'Credenciales inválidas', failed_login_count: user.failed_login_count, lockout_until: user.lockout_until });
    }

    registerSuccess(user);
    req.session.user = { user_id: user.user_id, email: user.email };
    res.json({ success: true, user: { user_id: user.user_id, email: user.email } });
});

// Auth: logout
app.post('/auth/logout', csrfProtection, (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            res.json({ success: true });
        });
    } else {
        res.json({ success: true });
    }
});

// Me
app.get('/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }
    res.json({ authenticated: false });
});

// ---- Admin: Usuarios (in-memory) ----
// Listar usuarios (solo admin)
app.get('/api/usuarios', requireAuth, (req, res) => {
    // In a real app check role; here allow demo admin only
    const list = Array.from(usersById.values()).map(u => ({ user_id: u.user_id, email: u.email, nombre: u.nombre || '', rol: u.rol || 'usuario', is_active: u.is_active }));
    res.json(list);
});

// Crear usuario (in-memory) - contraseña por defecto temporal
app.post('/api/usuarios', requireAuth, async (req, res) => {
    const { email = '', nombre = '', rol = 'usuario', password = '' } = req.body || {};
    const normalized = String(email).trim().toLowerCase();
    if(!normalized) return res.status(400).json({ error: 'Email requerido' });
    if(users.has(normalized)) return res.status(400).json({ error: 'Email ya existe' });
    const pwd = password && String(password).length >= 8 ? String(password) : 'Cambio1234!';
    const password_hash = await bcrypt.hash(pwd, 12);
    const user = { user_id: uuidv4(), email: normalized, nombre: nombre || normalized, rol, is_active: true, password_hash, failed_login_count:0, last_failed_at:null, lockout_until:null, created_at: nowUtc().toISOString(), updated_at: nowUtc().toISOString() };
    users.set(normalized, user);
    usersById.set(user.user_id, user);
    res.status(201).json({ user_id: user.user_id, email: user.email, nombre: user.nombre, rol: user.rol, temp_password: pwd });
});

// Eliminar usuario (in-memory)
app.delete('/api/usuarios/:id', requireAuth, (req, res) => {
    const id = String(req.params.id);
    const user = usersById.get(id);
    if(!user) return res.status(404).json({ error: 'No encontrado' });
    usersById.delete(id);
    users.delete(user.email.toLowerCase());
    res.json({ success: true });
});

// Request password reset
app.post('/auth/request-password-reset', resetLimiter, csrfProtection, (req, res) => {
    const { email = '' } = req.body || {};
    const normalized = String(email).trim().toLowerCase();
    const user = users.get(normalized) || null;

    if (user && user.is_active) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hmacToken(rawToken);
        const tokenId = uuidv4();
        const expiresAt = new Date(nowUtc().getTime() + 30 * 60 * 1000).toISOString();
        passwordResetTokens.set(tokenId, {
            token_id: tokenId,
            user_id: user.user_id,
            token_hash: tokenHash,
            expires_at: expiresAt,
            used_at: null,
            created_at: nowUtc().toISOString()
        });
        // In production, send email. For dev, log the link.
        const link = `${req.protocol}://${req.get('host')}/reset.html?token=${rawToken}&email=${encodeURIComponent(user.email)}&id=${tokenId}`;
        console.log('🔐 Enlace de restablecimiento (dev):', link);
    }

    // Always 200 to avoid user enumeration
    res.json({ success: true });
});

// Reset password
app.post('/auth/reset-password', csrfProtection, async (req, res) => {
    const { email = '', token = '', id = '', new_password = '' } = req.body || {};
    const normalized = String(email).trim().toLowerCase();
    const user = users.get(normalized) || null;
    if (!user) return res.status(400).json({ error: 'Solicitud inválida' });

    const rec = passwordResetTokens.get(String(id));
    if (!rec) return res.status(400).json({ error: 'Token inválido' });
    if (rec.used_at) return res.status(400).json({ error: 'Token ya utilizado' });
    if (new Date(rec.expires_at) < nowUtc()) return res.status(400).json({ error: 'Token expirado' });
    if (rec.user_id !== user.user_id) return res.status(400).json({ error: 'Token inválido' });

    const tokenHash = hmacToken(String(token));
    if (!crypto.timingSafeEqual(Buffer.from(tokenHash, 'hex'), Buffer.from(rec.token_hash, 'hex'))) {
        return res.status(400).json({ error: 'Token inválido' });
    }

    if (typeof new_password !== 'string' || new_password.length < 8) {
        return res.status(400).json({ error: 'Contraseña demasiado corta' });
    }

    user.password_hash = await bcrypt.hash(new_password, 12);
    user.updated_at = nowUtc().toISOString();
    rec.used_at = nowUtc().toISOString();

    // Invalidate session if the user is logged in
    if (req.session && req.session.user && req.session.user.user_id === user.user_id) {
        req.session.destroy(() => {});
    }

    res.json({ success: true });
});

// Endpoint para el formulario de contacto
app.post('/api/contact', (req, res) => {
    const { nombre, email, telefono, mensaje } = req.body;
    
    console.log('Nuevo mensaje de contacto:');
    console.log(`Nombre: ${nombre}`);
    console.log(`Email: ${email}`);
    console.log(`Teléfono: ${telefono}`);
    console.log(`Mensaje: ${mensaje}`);
    
    res.json({ 
        success: true, 
        message: 'Mensaje recibido correctamente' 
    });
});

// --- In-memory tasks store (demo) ---
let tasks = [
    { id: 1, title: 'Revisar filtro A', status: 'done', assignedTo: 'Juan', assignedUserId: null, date: '2025-10-01' },
    { id: 2, title: 'Lubricar motor B', status: 'in_progress', assignedTo: 'María', assignedUserId: null, date: '2025-10-03' },
    { id: 3, title: 'Inspección generador', status: 'not_started', assignedTo: 'Luis', assignedUserId: null, date: '2025-10-06' },
    { id: 4, title: 'Reemplazar correa', status: 'done', assignedTo: 'Ana', assignedUserId: null, date: '2025-10-07' },
    { id: 5, title: 'Verificar sistema eléctrico', status: 'in_progress', assignedTo: 'Carlos', assignedUserId: null, date: '2025-10-08' }
];

// Return list of tasks
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// Create a new task (simple)
app.post('/api/tasks', (req, res) => {
    // Support two shapes:
    // 1) simple: { title, status, assignedTo, date }
    // 2) inspection: full object from inspeccion.js -> we map it into a task and keep inspection payload
    const body = req.body || {};
    let title = body.title || '';
    let status = body.status || 'not_started';
    let assignedTo = body.assignedTo || '';
    let date = body.date || '';

    if (body.inspection) {
        // build a meaningful title from inspection data if possible
        const oficina = (body.inspection.location && body.inspection.location.oficina) ? body.inspection.location.oficina : '';
        const edificio = (body.inspection.location && body.inspection.location.edificio) ? body.inspection.location.edificio : '';
        title = title || `Inspección - ${edificio}${oficina ? ' / ' + oficina : ''}`;
        // map prioridad -> status (simple heuristic)
        const pr = body.inspection.priority || body.inspection.sections?.prioridad?.prioridad_tarea || '';
        if (pr) {
            if (pr.toLowerCase() === 'alta') status = 'in_progress';
            else if (pr.toLowerCase() === 'media') status = 'in_progress';
            else status = 'not_started';
        }
        // use current timestamp if no date
        date = date || new Date().toISOString().split('T')[0];
    }

    const id = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    const task = { id, title, status, assignedTo, date };
    // preserve full inspection payload if present
    if (body.inspection) task.inspection = body.inspection;
    // If client included base64 images attach them to the task for future DB storage
    if (body.inspection && body.inspection.images_base64 && Array.isArray(body.inspection.images_base64)){
        // Keep only name, type and data (base64 data URL)
        task.images = body.inspection.images_base64.map(img => ({ name: img.name, type: img.type, data: img.data }));
    }

    tasks.push(task);
    res.status(201).json(task);
});

// Simple stats endpoint for charts
app.get('/api/stats', (req, res) => {
    // Compute simple aggregate counts (single value per status) so frontend can decide how to render charts
    const labels = ['Completadas','En progreso','No iniciadas'];
    const counts = tasks.reduce((acc, t) => {
        if (t.status === 'done') acc[0] += 1;
        else if (t.status === 'in_progress') acc[1] += 1;
        else acc[2] += 1;
        return acc;
    }, [0,0,0]);

    res.json({ labels, counts });
});

// Update task (status changes, assignedTo) - simple in-memory update
app.put('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const body = req.body || {};
    const idx = tasks.findIndex(t => t.id === id);
    if(idx === -1) return res.status(404).json({ error: 'Not found' });

    const task = tasks[idx];
    if(body.status) task.status = body.status;
    if(body.assignedTo !== undefined) task.assignedTo = body.assignedTo;
    if(body.assignedUserId !== undefined) task.assignedUserId = body.assignedUserId;
    task.updatedAt = new Date().toISOString();
    task.updatedBy = body.updatedBy || 'system';

    tasks[idx] = task;
    res.json(task);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📋 Planificador de Mantenimiento`);
});

