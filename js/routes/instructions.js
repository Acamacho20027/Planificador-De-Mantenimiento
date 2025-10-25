// =====================================================
// RUTAS DE INSTRUCCIONES - Conectado a SQL Server
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// GET /api/instructions - Obtener todas las instrucciones
router.get('/', async (req, res) => {
    try {
        const { category, active } = req.query;
        
        let query = `
            SELECT 
                i.id_instruccion AS id,
                i.titulo AS title,
                i.descripcion AS description,
                i.categoria AS category,
                i.fecha_creacion AS createdAt,
                i.fecha_actualizacion AS updatedAt,
                u.nombre AS createdBy
            FROM instrucciones i
            LEFT JOIN usuarios u ON i.creado_por = u.id_usuario
            WHERE 1=1
        `;
        
        const params = {};
        
        if (category) {
            query += ' AND i.categoria = @category';
            params.category = category;
        }
        
        if (active !== undefined) {
            query += ' AND i.activo = @activo';
            params.activo = active === 'true' ? 1 : 0;
        } else {
            query += ' AND i.activo = 1'; // Por defecto solo activas
        }
        
        query += ' ORDER BY i.categoria, i.titulo';
        
        const pool = await db.getConnection();
        const request = pool.request();
        
        // Agregar parámetros
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        const result = await request.query(query);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error obteniendo instrucciones:', error);
        res.status(500).json({ error: 'Error al obtener instrucciones' });
    }
});

// GET /api/instructions/:id - Obtener instrucción específica
router.get('/:id', async (req, res) => {
    try {
        const instructionId = parseInt(req.params.id);
        
        if (isNaN(instructionId)) {
            return res.status(400).json({ error: 'ID de instrucción inválido' });
        }
        
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('id_instruccion', instructionId)
            .query(`
                SELECT 
                    i.id_instruccion AS id,
                    i.titulo AS title,
                    i.descripcion AS description,
                    i.categoria AS category,
                    i.fecha_creacion AS createdAt,
                    i.fecha_actualizacion AS updatedAt,
                    u.nombre AS createdBy
                FROM instrucciones i
                LEFT JOIN usuarios u ON i.creado_por = u.id_usuario
                WHERE i.id_instruccion = @id_instruccion AND i.activo = 1
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Instrucción no encontrada' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error obteniendo instrucción:', error);
        res.status(500).json({ error: 'Error al obtener instrucción' });
    }
});

// POST /api/instructions - Crear nueva instrucción
router.post('/', async (req, res) => {
    try {
        const { 
            title, 
            description, 
            category
        } = req.body;
        
        // Validaciones
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'El título es requerido' });
        }
        
        if (!description || !description.trim()) {
            return res.status(400).json({ error: 'La descripción es requerida' });
        }
        
        if (!category || !category.trim()) {
            return res.status(400).json({ error: 'La categoría es requerida' });
        }
        
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('titulo', title.trim())
            .input('descripcion', description.trim())
            .input('categoria', category.trim())
            .query(`
                INSERT INTO instrucciones (
                    titulo, descripcion, categoria
                )
                OUTPUT INSERTED.id_instruccion, INSERTED.titulo, INSERTED.descripcion, 
                       INSERTED.categoria
                VALUES (
                    @titulo, @descripcion, @categoria
                )
            `);
        
        const newInstruction = result.recordset[0];
        
        res.status(201).json({
            id: newInstruction.id_instruccion,
            title: newInstruction.titulo,
            description: newInstruction.descripcion,
            category: newInstruction.categoria
        });
    } catch (error) {
        console.error('Error creando instrucción:', error);
        res.status(500).json({ error: 'Error al crear instrucción' });
    }
});

// PUT /api/instructions/:id - Actualizar instrucción
router.put('/:id', async (req, res) => {
    try {
        const instructionId = parseInt(req.params.id);
        const { 
            title, 
            description, 
            category
        } = req.body;
        
        if (isNaN(instructionId)) {
            return res.status(400).json({ error: 'ID de instrucción inválido' });
        }
        
        // Construir query dinámicamente según qué campos se enviaron
        const updates = [];
        const params = { id_instruccion: instructionId };
        
        if (title !== undefined) {
            updates.push('titulo = @titulo');
            params.titulo = title.trim();
        }
        if (description !== undefined) {
            updates.push('descripcion = @descripcion');
            params.descripcion = description.trim();
        }
        if (category !== undefined) {
            updates.push('categoria = @categoria');
            params.categoria = category.trim();
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }
        
        updates.push('fecha_actualizacion = GETDATE()');
        
        const pool = await db.getConnection();
        const request = pool.request();
        
        // Agregar parámetros
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        const updateQuery = `
            UPDATE instrucciones
            SET ${updates.join(', ')}
            WHERE id_instruccion = @id_instruccion
        `;
        
        const updateResult = await request.query(updateQuery);
        
        if (updateResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Instrucción no encontrada' });
        }
        
        // Obtener la instrucción actualizada
        const getResult = await pool.request()
            .input('id_instruccion', instructionId)
            .query(`
                SELECT 
                    id_instruccion AS id,
                    titulo AS title,
                    descripcion AS description,
                    categoria AS category
                FROM instrucciones
                WHERE id_instruccion = @id_instruccion
            `);
        
        const updatedInstruction = getResult.recordset[0];
        
        res.json(updatedInstruction);
    } catch (error) {
        console.error('Error actualizando instrucción:', error);
        res.status(500).json({ error: 'Error al actualizar instrucción' });
    }
});

// DELETE /api/instructions/:id - Eliminar instrucción (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const instructionId = parseInt(req.params.id);
        
        if (isNaN(instructionId)) {
            return res.status(400).json({ error: 'ID de instrucción inválido' });
        }
        
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('id_instruccion', instructionId)
            .query(`
                UPDATE instrucciones
                SET activo = 0, fecha_actualizacion = GETDATE()
                WHERE id_instruccion = @id_instruccion
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Instrucción no encontrada' });
        }
        
        res.json({ success: true, message: 'Instrucción eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando instrucción:', error);
        res.status(500).json({ error: 'Error al eliminar instrucción' });
    }
});

// GET /api/instructions/categories - Obtener categorías disponibles
router.get('/categories/list', async (req, res) => {
    try {
        const pool = await db.getConnection();
        const result = await pool.request().query(`
            SELECT DISTINCT categoria AS category
            FROM instrucciones
            WHERE activo = 1
            ORDER BY categoria
        `);
        
        const categories = result.recordset.map(row => row.category);
        res.json(categories);
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

module.exports = router;
