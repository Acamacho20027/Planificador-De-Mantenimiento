// =====================================================
// RUTAS DE TAREAS - Conectado a SQL Server
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Mapeo de estados: BD (español) <-> Frontend (inglés)
const estadoToStatus = {
    'No Iniciado': 'not_started',
    'En Proceso': 'in_progress',
    'Finalizado': 'done'
};

const statusToEstado = {
    'not_started': 'No Iniciado',
    'in_progress': 'En Proceso',
    'done': 'Finalizado'
};

// GET /api/tasks - Obtener todas las tareas
router.get('/', async (req, res) => {
    try {
        const pool = await db.getConnection();
        const result = await pool.request().query(`
            SELECT 
                t.id_tarea AS id,
                t.titulo AS title,
                t.estado,
                t.asignado_a AS assignedTo,
                CONVERT(VARCHAR(10), t.fecha, 120) AS date,
                t.prioridad AS priority,
                t.descripcion AS description,
                t.fecha_creacion AS createdAt,
                t.fecha_actualizacion AS updatedAt
            FROM tareas t
            ORDER BY t.fecha_creacion DESC
        `);
        
        // Mapear estados de español a inglés
        const tasks = result.recordset.map(task => ({
            ...task,
            status: estadoToStatus[task.estado] || 'not_started'
        }));
        
        res.json(tasks);
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

// POST /api/tasks - Crear nueva tarea
router.post('/', async (req, res) => {
    try {
        const { title, status, assignedTo, date, priority, description, inspection } = req.body;
        
        // Validaciones
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'El título es requerido' });
        }
        
        const taskTitle = title.trim();
        // Convertir status de inglés a español
        const taskStatus = statusToEstado[status] || 'No Iniciado';
        const taskAssignedTo = assignedTo || null;
        const taskDate = date || new Date().toISOString().split('T')[0];
        const taskPriority = priority || 'Media';
        const taskDescription = description || null;
        
        // Insertar tarea
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('titulo', taskTitle)
            .input('estado', taskStatus)
            .input('asignado_a', taskAssignedTo)
            .input('fecha', taskDate)
            .input('prioridad', taskPriority)
            .input('descripcion', taskDescription)
            .query(`
                INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, descripcion)
                OUTPUT INSERTED.id_tarea, INSERTED.titulo, INSERTED.estado, INSERTED.asignado_a, 
                       CONVERT(VARCHAR(10), INSERTED.fecha, 120) AS fecha, INSERTED.prioridad
                VALUES (@titulo, @estado, @asignado_a, @fecha, @prioridad, @descripcion)
            `);
        
        const newTask = result.recordset[0];
        
        res.status(201).json({
            id: newTask.id_tarea,
            title: newTask.titulo,
            status: estadoToStatus[newTask.estado] || 'not_started',
            assignedTo: newTask.asignado_a,
            date: newTask.fecha,
            priority: newTask.prioridad
        });
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error al crear tarea' });
    }
});

// PUT /api/tasks/:id - Actualizar tarea
router.put('/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { status, assignedTo, title, date, priority, description } = req.body;
        
        if (isNaN(taskId)) {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }
        
        // Construir query dinámicamente según qué campos se enviaron
        const updates = [];
        const params = { id_tarea: taskId };
        
        if (status !== undefined) {
            updates.push('estado = @estado');
            // Convertir status de inglés a español
            params.estado = statusToEstado[status] || status;
        }
        if (assignedTo !== undefined) {
            updates.push('asignado_a = @asignado_a');
            params.asignado_a = assignedTo;
        }
        if (title !== undefined) {
            updates.push('titulo = @titulo');
            params.titulo = title;
        }
        if (date !== undefined) {
            updates.push('fecha = @fecha');
            params.fecha = date;
        }
        if (priority !== undefined) {
            updates.push('prioridad = @prioridad');
            params.prioridad = priority;
        }
        if (description !== undefined) {
            updates.push('descripcion = @descripcion');
            params.descripcion = description;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }
        
        updates.push('fecha_actualizacion = GETDATE()');
        
        // Usar la función query correctamente
        const pool = await db.getConnection();
        const request = pool.request();
        
        // Agregar parámetros
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        // Ejecutar UPDATE simple
        const updateQuery = `
            UPDATE tareas
            SET ${updates.join(', ')}
            WHERE id_tarea = @id_tarea
        `;
        
        console.log('🔍 Query UPDATE:', updateQuery);
        console.log('🔍 Parámetros:', params);
        
        const updateResult = await request.query(updateQuery);
        
        if (updateResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        // Obtener la tarea actualizada
        const getResult = await pool.request()
            .input('id_tarea', taskId)
            .query(`
                SELECT 
                    id_tarea,
                    titulo,
                    estado,
                    asignado_a,
                    CONVERT(VARCHAR(10), fecha, 120) AS fecha,
                    prioridad
                FROM tareas
                WHERE id_tarea = @id_tarea
            `);
        
        const updatedTask = getResult.recordset[0];
        
        res.json({
            id: updatedTask.id_tarea,
            title: updatedTask.titulo,
            status: estadoToStatus[updatedTask.estado] || 'not_started',
            assignedTo: updatedTask.asignado_a,
            date: updatedTask.fecha,
            priority: updatedTask.prioridad
        });
    } catch (error) {
        console.error('Error actualizando tarea:', error);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

// DELETE /api/tasks/:id - Eliminar tarea
router.delete('/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        
        if (isNaN(taskId)) {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }
        
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('id_tarea', taskId)
            .query(`
                DELETE FROM tareas
                WHERE id_tarea = @id_tarea
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json({ success: true, message: 'Tarea eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando tarea:', error);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

module.exports = router;

