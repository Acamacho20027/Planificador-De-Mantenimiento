// =====================================================
// RUTAS DE TAREAS - Conectado a SQL Server
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// GET /api/tasks - Obtener todas las tareas
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.id_tarea AS id,
                t.titulo AS title,
                t.estado AS status,
                t.asignado_a AS assignedTo,
                CONVERT(VARCHAR(10), t.fecha, 120) AS date,
                t.prioridad AS priority,
                t.descripcion AS description,
                t.fecha_creacion AS createdAt,
                t.fecha_actualizacion AS updatedAt
            FROM tareas t
            ORDER BY t.fecha_creacion DESC
        `);
        
        res.json(result.recordset);
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
        const taskStatus = status || 'No Iniciado';
        const taskAssignedTo = assignedTo || null;
        const taskDate = date || new Date().toISOString().split('T')[0];
        const taskPriority = priority || 'Media';
        const taskDescription = description || null;
        
        // Insertar tarea
        const result = await db.query(`
            INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, descripcion)
            OUTPUT INSERTED.id_tarea, INSERTED.titulo, INSERTED.estado, INSERTED.asignado_a, 
                   CONVERT(VARCHAR(10), INSERTED.fecha, 120) AS fecha, INSERTED.prioridad
            VALUES (@titulo, @estado, @asignado_a, @fecha, @prioridad, @descripcion)
        `, {
            titulo: taskTitle,
            estado: taskStatus,
            asignado_a: taskAssignedTo,
            fecha: taskDate,
            prioridad: taskPriority,
            descripcion: taskDescription
        });
        
        const newTask = result.recordset[0];
        
        res.status(201).json({
            id: newTask.id_tarea,
            title: newTask.titulo,
            status: newTask.estado,
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
            params.estado = status;
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
        
        const result = await db.query(`
            UPDATE tareas
            SET ${updates.join(', ')}
            OUTPUT INSERTED.id_tarea, INSERTED.titulo, INSERTED.estado, INSERTED.asignado_a,
                   CONVERT(VARCHAR(10), INSERTED.fecha, 120) AS fecha, INSERTED.prioridad
            WHERE id_tarea = @id_tarea
        `, params);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        const updatedTask = result.recordset[0];
        
        res.json({
            id: updatedTask.id_tarea,
            title: updatedTask.titulo,
            status: updatedTask.estado,
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
        
        const result = await db.query(`
            DELETE FROM tareas
            WHERE id_tarea = @id_tarea
        `, {
            id_tarea: taskId
        });
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json({ success: true, message: 'Tarea eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando tarea:', error);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

// GET /api/stats - Estadísticas de tareas
router.get('/stats', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                estado,
                COUNT(*) AS count
            FROM tareas
            GROUP BY estado
        `);
        
        // Mapear a formato del frontend
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
        
        // Formato para el frontend
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

module.exports = router;

