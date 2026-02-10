// Dashboard metrics (real data for charts)
const express = require('express');
const router = express.Router();
const db = require('../../config/database');

const STATUS_LABELS = ['Finalizado', 'En Proceso', 'No Iniciado'];

async function buildSummary(pool) {
    // Conteo por estado
    const statusResult = await pool.request().query(`
        SELECT estado, COUNT(*) AS total
        FROM tareas
        GROUP BY estado
    `);
    const counts = {
        'Finalizado': 0,
        'En Proceso': 0,
        'No Iniciado': 0
    };
    statusResult.recordset.forEach(row => {
        if (Object.prototype.hasOwnProperty.call(counts, row.estado)) {
            counts[row.estado] = row.total;
        }
    });

    // Evolución por fecha (usa fecha de tarea o fecha_creacion como respaldo)
    const timelineResult = await pool.request().query(`
        SELECT
            CONVERT(VARCHAR(10), COALESCE(fecha, CAST(fecha_creacion AS DATE), CAST(GETDATE() AS DATE)), 23) AS fecha,
            COUNT(*) AS total
        FROM tareas
        GROUP BY CONVERT(VARCHAR(10), COALESCE(fecha, CAST(fecha_creacion AS DATE), CAST(GETDATE() AS DATE)), 23)
        ORDER BY fecha
    `);

    // Por técnico
    const techResult = await pool.request().query(`
        SELECT ISNULL(asignado_a, 'Sin asignar') AS tecnico, COUNT(*) AS total
        FROM tareas
        GROUP BY ISNULL(asignado_a, 'Sin asignar')
        ORDER BY total DESC
    `);

    const total = counts['Finalizado'] + counts['En Proceso'] + counts['No Iniciado'];

    return {
        total,
        estados: {
            completadas: counts['Finalizado'],
            en_progreso: counts['En Proceso'],
            no_iniciadas: counts['No Iniciado']
        },
        por_fecha: timelineResult.recordset.map(r => ({ fecha: r.fecha, total: r.total })),
        por_tecnico: techResult.recordset.map(r => ({ tecnico: r.tecnico, total: r.total })),
        generatedAt: new Date().toISOString()
    };
}

// Resumen completo para el dashboard
router.get('/resumen', async (_req, res) => {
    try {
        const pool = await db.getConnection();
        const summary = await buildSummary(pool);
        res.json(summary);
    } catch (err) {
        console.error('Error building dashboard resumen:', err);
        res.status(500).json({ error: 'Error al obtener resumen del dashboard' });
    }
});

// Serie temporal agrupada por fecha
router.get('/por-fecha', async (_req, res) => {
    try {
        const pool = await db.getConnection();
        const summary = await buildSummary(pool);
        res.json(summary.por_fecha);
    } catch (err) {
        console.error('Error getting dashboard timeline:', err);
        res.status(500).json({ error: 'Error al obtener métricas por fecha' });
    }
});

// Distribución por técnico
router.get('/por-tecnico', async (_req, res) => {
    try {
        const pool = await db.getConnection();
        const summary = await buildSummary(pool);
        res.json(summary.por_tecnico);
    } catch (err) {
        console.error('Error getting dashboard technicians:', err);
        res.status(500).json({ error: 'Error al obtener métricas por técnico' });
    }
});

// Endpoint actual usado por el frontend (mantener compatibilidad)
router.get('/insights', async (_req, res) => {
    try {
        const pool = await db.getConnection();
        const summary = await buildSummary(pool);

        res.json({
            statusDistribution: {
                labels: STATUS_LABELS,
                values: [summary.estados.completadas, summary.estados.en_progreso, summary.estados.no_iniciadas]
            },
            timeline: {
                labels: summary.por_fecha.map(r => r.fecha),
                values: summary.por_fecha.map(r => r.total)
            },
            technicians: {
                labels: summary.por_tecnico.map(r => r.tecnico),
                values: summary.por_tecnico.map(r => r.total)
            },
            totals: {
                totalTasks: summary.total,
                done: summary.estados.completadas,
                inProgress: summary.estados.en_progreso,
                notStarted: summary.estados.no_iniciadas
            },
            generatedAt: summary.generatedAt
        });
    } catch (err) {
        console.error('Error building dashboard insights:', err);
        res.status(500).json({ error: 'Error al obtener métricas del dashboard' });
    }
});

module.exports = router;
