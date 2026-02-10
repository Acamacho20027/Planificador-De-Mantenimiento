// =====================================================
// RUTAS DE TAREAS - Conectado a SQL Server
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for multipart/form-data uploads (files written to disk)
// Default per-file upload limit when using multipart uploads. Can be overridden via
// environment variable FILE_SIZE_LIMIT_BYTES (value in bytes).
const FILE_SIZE_LIMIT = parseInt(process.env.FILE_SIZE_LIMIT_BYTES, 10) || (200 * 1024 * 1024); // 200MB default
// Base directory where uploaded files are stored. Can be set to an external drive, e.g. UPLOAD_DIR='B:\uploads'
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
console.log(`⚙️ Upload base directory: ${BASE_UPLOAD_DIR}`);
// Multer will first store uploads in a temp folder; the route handler will move files
// to their final location after persisting metadata. This reduces the chance of
// orphan files when DB inserts fail and allows atomic move/rollback logic.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const tmpDir = path.join(BASE_UPLOAD_DIR, 'tmp');
            fs.mkdirSync(tmpDir, { recursive: true });
            cb(null, tmpDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    }
});
const upload = multer({ storage, limits: { fileSize: FILE_SIZE_LIMIT } });

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
            -- Order by most recently updated (so assignment/updates bubble to top); fall back to creation date
            ORDER BY COALESCE(t.fecha_actualizacion, t.fecha_creacion) DESC
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
    const { title, status, assignedTo, date, priority, description, instructionId } = req.body;
        
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
        
        // Validación server-side: si se intenta marcar como Finalizado, verificar que exista al menos
        // una imagen subida para la tarea (carpeta uploads/tasks/:id con archivos)
        try {
            if (params.estado && params.estado === 'Finalizado') {
                const uploadDir = path.join(BASE_UPLOAD_DIR, 'tasks', String(taskId));
                if (!fs.existsSync(uploadDir)) {
                    return res.status(400).json({ error: 'Para marcar Finalizado se requiere al menos una foto subida para la tarea' });
                }
                const files = fs.readdirSync(uploadDir).filter(f => f && !f.startsWith('.'));
                if (!files || files.length === 0) {
                    return res.status(400).json({ error: 'Para marcar Finalizado se requiere al menos una foto subida para la tarea' });
                }
            }
        } catch (fsErr) {
            console.error('Error revisando imágenes de tarea:', fsErr);
            return res.status(500).json({ error: 'Error al verificar fotos de la tarea' });
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

// POST /api/tasks/:id/images - subir imágenes asociadas a una tarea
// Accepts either JSON with base64 images (legacy) or multipart/form-data file upload (field name: 'images')
router.post('/:id/images', upload.array('images'), async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);

        if (isNaN(taskId)) { return res.status(400).json({ error: 'ID de tarea inválido' }); }

        // Ensure upload directory exists
    const uploadDir = path.join(BASE_UPLOAD_DIR, 'tasks', String(taskId));
    fs.mkdirSync(uploadDir, { recursive: true });

        const saved = [];
        let pool = null;
        try { pool = await db.getConnection(); } catch (e) { pool = null; }

        // Case A: multipart/form-data handled by multer -> req.files is populated
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const f of req.files) {
                // f.path is in the tmp folder
                const tmpPath = f.path;
                const filename = f.filename || path.basename(tmpPath);
                const finalDir = path.join(BASE_UPLOAD_DIR, 'tasks', String(taskId));
                await fs.promises.mkdir(finalDir, { recursive: true });
                const finalPath = path.join(finalDir, filename);

                // Move file from tmp to final location. Use rename which is atomic on same FS.
                try {
                    await fs.promises.rename(tmpPath, finalPath);
                } catch (moveErr) {
                    console.warn('Failed to move uploaded file to final folder, attempting copy:', moveErr && moveErr.message);
                    // fallback to copy and unlink
                    try {
                        const data = await fs.promises.readFile(tmpPath);
                        await fs.promises.writeFile(finalPath, data);
                        await fs.promises.unlink(tmpPath);
                    } catch (copyErr) {
                        console.error('Failed to copy uploaded file to final location:', copyErr && copyErr.message);
                        // leave file in tmp and continue to next file, record error
                        continue;
                    }
                }

                const urlPath = `/uploads/tasks/${taskId}/${filename}`;
                const fileMeta = { name: filename, url: urlPath, size: f.size, type: f.mimetype || null };

                let keepFile = true;
                if (pool) {
                    try {
                        const uploadedByRaw = (req.session && req.session.userId) ? req.session.userId : null;
                        const uploadedBy = uploadedByRaw !== null ? (Number.isInteger(uploadedByRaw) ? uploadedByRaw : parseInt(uploadedByRaw, 10) || null) : null;
                        await pool.request()
                            .input('id_tarea', taskId)
                            .input('nombre_archivo', filename)
                            .input('url_path', urlPath)
                            .input('tipo_mime', f.mimetype || null)
                            .input('tamano_bytes', f.size)
                            .input('uploaded_by', uploadedBy)
                            .query(`
                                INSERT INTO imagenes_tarea (id_tarea, nombre_archivo, url_path, tipo_mime, tamano_bytes, uploaded_by, fecha_subida)
                                VALUES (@id_tarea, @nombre_archivo, @url_path, @tipo_mime, @tamano_bytes, @uploaded_by, GETDATE())
                            `);
                    } catch (metaErr) {
                        const metaMsg = metaErr && metaErr.message ? metaErr.message : String(metaErr);
                        const missingTable = /Invalid object name 'imagenes_tarea'/i.test(metaMsg);
                        if (missingTable) {
                            console.warn('Tabla imagenes_tarea no encontrada; se conservará el archivo sin metadatos en BD. Mensaje:', metaMsg);
                        } else {
                            keepFile = false;
                            console.warn('DB insert failed for uploaded file, attempting rollback:', metaMsg);
                            try {
                                const tmpDir = path.join(BASE_UPLOAD_DIR, 'tmp');
                                await fs.promises.mkdir(tmpDir, { recursive: true });
                                const rollbackPath = path.join(tmpDir, filename);
                                await fs.promises.rename(finalPath, rollbackPath);
                                console.log(`Rolled back file to tmp: ${rollbackPath}`);
                            } catch (rbErr) {
                                keepFile = false;
                                console.error('Rollback failed, file may be orphaned at:', finalPath, rbErr && rbErr.message);
                            }
                        }
                    }
                }

                if (keepFile) {
                    saved.push(fileMeta);
                }
            }

            return res.json({ success: true, files: saved });
        }

        // Case B: legacy JSON upload with base64 images in req.body.images
        const { images } = req.body; // esperar [{ name, type, data }]
        if (!images || !Array.isArray(images) || images.length === 0) { return res.status(400).json({ error: 'No se proporcionaron imágenes' }); }

        for (const img of images) {
            // img.data puede venir como dataURL o base64 puro
            let base64 = img.data;
            const match = /^data:(.+);base64,(.+)$/.exec(base64);
            if (match) { base64 = match[2]; }

            const buffer = Buffer.from(base64, 'base64');
            const filename = `${Date.now()}-${img.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, buffer);

            const urlPath = `/uploads/tasks/${taskId}/${filename}`;
            const fileMeta = { name: filename, url: urlPath, size: buffer.length, type: img.type || null };
            saved.push(fileMeta);

            // Persist metadata in DB table `imagenes_tarea` if available.
            try {
                if (pool) {
                    const uploadedByRaw = (req.session && req.session.userId) ? req.session.userId : null;
                    const uploadedBy = uploadedByRaw !== null ? (Number.isInteger(uploadedByRaw) ? uploadedByRaw : parseInt(uploadedByRaw, 10) || null) : null;
                    await pool.request()
                        .input('id_tarea', taskId)
                        .input('nombre_archivo', filename)
                        .input('url_path', urlPath)
                        .input('tipo_mime', img.type || null)
                        .input('tamano_bytes', buffer.length)
                        .input('uploaded_by', uploadedBy)
                        .query(`
                            INSERT INTO imagenes_tarea (id_tarea, nombre_archivo, url_path, tipo_mime, tamano_bytes, uploaded_by, fecha_subida)
                            VALUES (@id_tarea, @nombre_archivo, @url_path, @tipo_mime, @tamano_bytes, @uploaded_by, GETDATE())
                        `);
                }
            } catch (metaErr) {
                console.warn('No se pudo insertar metadata de imagen en DB:', metaErr && metaErr.message ? metaErr.message : metaErr);
            }
        }

        res.json({ success: true, files: saved });
    } catch (error) {
        console.error('Error subiendo imágenes de tarea:', error);
        res.status(500).json({ error: 'Error al subir imágenes' });
    }
});

// GET /api/tasks/:id/images - List uploaded images for a task (served from uploads/tasks/:id)
router.get('/:id/images', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        if (isNaN(taskId)) {return res.status(400).json({ error: 'ID de tarea inválido' });}
        // First try to read metadata from DB table imagenes_tarea (if present)
        try {
            const pool = await db.getConnection();
            const result = await pool.request()
                .input('id_tarea', taskId)
                .query(`
                    SELECT nombre_archivo AS name, url_path AS url, tipo_mime AS type, tamano_bytes AS size, uploaded_by, fecha_subida
                    FROM imagenes_tarea
                    WHERE id_tarea = @id_tarea
                    ORDER BY fecha_subida DESC
                `);

            const filesInfo = (result && result.recordset) ? result.recordset.map(r => ({
                name: r.name,
                url: r.url,
                type: r.type,
                size: r.size,
                uploadedBy: r.uploaded_by !== undefined && r.uploaded_by !== null ? (Number.isInteger(r.uploaded_by) ? r.uploaded_by : parseInt(r.uploaded_by, 10) || null) : null,
                uploadedAt: r.fecha_subida || null
            })) : [];

            // If DB returned rows, prefer those. If empty, fall back to filesystem listing.
            if (filesInfo.length > 0) {return res.json({ files: filesInfo });}
        } catch (dbErr) {
            // Table may not exist or DB error; fall back to filesystem
            // console.warn('No se pudo leer metadata de imagenes_tarea, usando sistema de archivos:', dbErr.message || dbErr);
        }

    const uploadDir = path.join(BASE_UPLOAD_DIR, 'tasks', String(taskId));
        if (!fs.existsSync(uploadDir)) {return res.json({ files: [] });}

        const files = fs.readdirSync(uploadDir).filter(f => f && !f.startsWith('.'));
        const filesInfo = files.map(f => ({ name: f, url: `/uploads/tasks/${taskId}/${f}` }));
        res.json({ files: filesInfo });
    } catch (error) {
        console.error('Error obteniendo imágenes de tarea:', error);
        res.status(500).json({ error: 'Error al obtener imágenes de la tarea' });
    }
});

module.exports = router;

