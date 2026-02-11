// =====================================================
// RUTAS DE BITACORAS (proxy hacia microservicio FastAPI)
// =====================================================

const express = require('express');
const router = express.Router();
const auth = require('./auth');

const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

const SERVICE_URL = (process.env.BITACORA_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const SERVICE_TIMEOUT_MS = parseInt(process.env.BITACORA_SERVICE_TIMEOUT_MS, 10) || 15000;

function validatePeriod(period) {
    return /^\d{4}-\d{2}$/.test(period);
}

async function callService(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);
    try {
        const res = await fetchFn(`${SERVICE_URL}${path}`, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

router.get('/health', async (req, res) => {
    try {
        const upstream = await callService('/health');
        const payload = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            return res.status(upstream.status).json(payload);
        }
        return res.json(payload);
    } catch (err) {
        return res.status(502).json({ status: 'error', error: 'Microservicio no disponible' });
    }
});

router.post('/procesar', auth.requireAdmin, async (req, res) => {
    try {
        const { cliente = null, period = null } = req.body || {};
        if (period && !validatePeriod(period)) {
            return res.status(400).json({ error: 'Formato de periodo invalido. Use YYYY-MM.' });
        }
        const upstream = await callService('/bitacora/procesar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente, period })
        });

        const payload = await upstream.json().catch(() => ({ error: 'Respuesta no valida del microservicio' }));
        if (!upstream.ok) {
            return res.status(upstream.status).json({ error: payload.detail || payload.error || 'No se pudo procesar la bitacora' });
        }
        return res.json(payload);
    } catch (err) {
        console.error('Error en /api/bitacora/procesar:', err && err.message);
        return res.status(502).json({ error: 'Microservicio no disponible' });
    }
});

router.get('/metricas', async (req, res) => {
    try {
        const upstream = await callService('/bitacora/metricas');
        const payload = await upstream.json().catch(() => ({ error: 'Respuesta no valida del microservicio' }));
        if (!upstream.ok) {
            return res.status(upstream.status).json({ error: payload.detail || payload.error || 'No se pudieron obtener metricas' });
        }
        return res.json(payload);
    } catch (err) {
        console.error('Error en /api/bitacora/metricas:', err && err.message);
        return res.status(502).json({ error: 'Microservicio no disponible' });
    }
});

router.get('/excel', auth.requireAdmin, async (req, res) => {
    try {
        let cliente = req.query.cliente;
        if (Array.isArray(cliente)) cliente = cliente[0];
        cliente = (cliente && String(cliente).trim()) || 'Cliente Principal';
        const query = new URLSearchParams({ cliente });
        const upstream = await callService(`/bitacora/excel?${query.toString()}`);
        if (!upstream.ok) {
            const payload = await upstream.json().catch(() => ({}));
            return res.status(upstream.status).json({ error: payload.detail || payload.error || 'No se encontro el archivo solicitado' });
        }

        const disposition = upstream.headers.get('content-disposition') || `attachment; filename="bitacora_${cliente}.xlsx"`;
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', disposition);

        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.send(buffer);
    } catch (err) {
        console.error('Error en /api/bitacora/excel:', err && err.message);
        return res.status(502).json({ error: 'Microservicio no disponible' });
    }
});

router.get('/clientes', async (req, res) => {
    try {
        const upstream = await callService('/bitacora/clientes');
        const payload = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            return res.status(upstream.status).json(payload);
        }
        return res.json(payload);
    } catch (err) {
        console.error('Error en /api/bitacora/clientes:', err && err.message);
        return res.status(502).json({ error: 'Microservicio no disponible' });
    }
});

router.post('/clientes', auth.requireAdmin, async (req, res) => {
    try {
        const upstream = await callService('/bitacora/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body || {})
        });
        const payload = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            return res.status(upstream.status).json(payload);
        }
        return res.json(payload);
    } catch (err) {
        console.error('Error en /api/bitacora/clientes POST:', err && err.message);
        return res.status(502).json({ error: 'Microservicio no disponible' });
    }
});

module.exports = router;
