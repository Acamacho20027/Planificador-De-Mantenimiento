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
                t.fecha_actualizacion AS updatedAt,
                -- Información de instrucción
                t.id_instruccion,
                inst.titulo AS instruccion_titulo,
                inst.descripcion AS instruccion_descripcion,
                inst.categoria AS instruccion_categoria
            FROM tareas t
            LEFT JOIN instrucciones inst ON t.id_instruccion = inst.id_instruccion
            ORDER BY t.fecha_creacion DESC
        `);
        
        // Mapear estados de español a inglés y estructurar instrucciones
        const tasks = result.recordset.map(task => ({
            id: task.id,
            title: task.title,
            status: estadoToStatus[task.estado] || 'not_started',
            assignedTo: task.assignedTo,
            date: task.date,
            priority: task.priority,
            description: task.description,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            instruction: task.id_instruccion ? {
                id: task.id_instruccion,
                title: task.instruccion_titulo,
                description: task.instruccion_descripcion,
                category: task.instruccion_categoria
            } : null
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
        const { title, status, assignedTo, date, priority, description, inspection, instructionId } = req.body;
        
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
        const taskInstructionId = instructionId || null;
        
        // Insertar tarea
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('titulo', taskTitle)
            .input('estado', taskStatus)
            .input('asignado_a', taskAssignedTo)
            .input('fecha', taskDate)
            .input('prioridad', taskPriority)
            .input('descripcion', taskDescription)
            .input('id_instruccion', taskInstructionId)
            .query(`
                INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, descripcion, id_instruccion)
                OUTPUT INSERTED.id_tarea, INSERTED.titulo, INSERTED.estado, INSERTED.asignado_a, 
                       CONVERT(VARCHAR(10), INSERTED.fecha, 120) AS fecha, INSERTED.prioridad, INSERTED.id_instruccion
                VALUES (@titulo, @estado, @asignado_a, @fecha, @prioridad, @descripcion, @id_instruccion)
            `);
        
        const newTask = result.recordset[0];
        
        res.status(201).json({
            id: newTask.id_tarea,
            title: newTask.titulo,
            status: estadoToStatus[newTask.estado] || 'not_started',
            assignedTo: newTask.asignado_a,
            date: newTask.fecha,
            priority: newTask.prioridad,
            instructionId: newTask.id_instruccion
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

// PUT /api/tasks/:id/instruction - Asignar instrucción a tarea
router.put('/:id/instruction', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { instructionId } = req.body;
        
        if (isNaN(taskId)) {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }
        
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('id_tarea', taskId)
            .input('id_instruccion', instructionId)
            .query(`
                UPDATE tareas
                SET id_instruccion = @id_instruccion, fecha_actualizacion = GETDATE()
                WHERE id_tarea = @id_tarea
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        // Obtener la tarea actualizada con la instrucción
        const getResult = await pool.request()
            .input('id_tarea', taskId)
            .query(`
                SELECT 
                    t.id_tarea,
                    t.titulo,
                    t.estado,
                    t.asignado_a,
                    CONVERT(VARCHAR(10), t.fecha, 120) AS fecha,
                    t.prioridad,
                    t.descripcion,
                    t.id_instruccion,
                    inst.titulo AS instruccion_titulo,
                    inst.descripcion AS instruccion_descripcion,
                    inst.categoria AS instruccion_categoria
                FROM tareas t
                LEFT JOIN instrucciones inst ON t.id_instruccion = inst.id_instruccion
                WHERE t.id_tarea = @id_tarea
            `);
        
        const updatedTask = getResult.recordset[0];
        
        res.json({
            id: updatedTask.id_tarea,
            title: updatedTask.titulo,
            status: estadoToStatus[updatedTask.estado] || 'not_started',
            assignedTo: updatedTask.asignado_a,
            date: updatedTask.fecha,
            priority: updatedTask.prioridad,
            description: updatedTask.descripcion,
            instruction: updatedTask.id_instruccion ? {
                id: updatedTask.id_instruccion,
                title: updatedTask.instruccion_titulo,
                description: updatedTask.instruccion_descripcion,
                category: updatedTask.instruccion_categoria
            } : null
        });
    } catch (error) {
        console.error('Error asignando instrucción:', error);
        res.status(500).json({ error: 'Error al asignar instrucción' });
    }
});

// GET /api/tasks/:id/inspection - Obtener información de inspección de una tarea específica
router.get('/:id/inspection', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        
        if (isNaN(taskId)) {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }
        
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('id_tarea', taskId)
            .query(`
                SELECT 
                    t.id_tarea,
                    t.titulo AS task_title,
                    t.descripcion AS task_description,
                    i.id_inspeccion,
                    i.nombre_inspeccion,
                    i.tipo_inspeccion,
                    i.edificio,
                    i.piso,
                    i.ubicacion,
                    i.observaciones,
                    i.recomendaciones,
                    i.fecha_creacion AS inspection_date
                FROM tareas t
                LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
                WHERE t.id_tarea = @id_tarea
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        const taskInspection = result.recordset[0];
        
        res.json({
            task: {
                id: taskInspection.id_tarea,
                title: taskInspection.task_title,
                description: taskInspection.task_description
            },
            inspection: taskInspection.id_inspeccion ? {
                id: taskInspection.id_inspeccion,
                name: taskInspection.nombre_inspeccion,
                type: taskInspection.tipo_inspeccion,
                building: taskInspection.edificio,
                floor: taskInspection.piso,
                location: taskInspection.ubicacion,
                observations: taskInspection.observaciones,
                recommendations: taskInspection.recomendaciones,
                date: taskInspection.inspection_date
            } : null
        });
    } catch (error) {
        console.error('Error obteniendo inspección de tarea:', error);
        res.status(500).json({ error: 'Error al obtener información de inspección' });
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

