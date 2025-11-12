// =====================================================
// RUTAS DE INSPECCIONES - Conectado a SQL Server
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// POST /api/inspections - Crear nueva inspección completa
router.post('/', async (req, res) => {
    try {
        const { title, inspection, assignedTo, date } = req.body;
        
        if (!inspection || !inspection.sections) {
            return res.status(400).json({ error: 'Datos de inspección incompletos' });
        }
        
        // Obtener datos de las secciones
        const sections = inspection.sections;
        const ubicacion = sections.ubicacion || {};
        
        // Preparar datos para insertar
        const inspectionData = {
            nombre_inspeccion: title || ubicacion.task_name || 'Inspección',
            tipo_inspeccion: determinarTipoInspeccion(sections),
            edificio: ubicacion.edificio || null,
            piso: ubicacion.piso || null,
            ubicacion: ubicacion.oficina || null,
            
            // Cubierta de techos - Lámina
            lamina_tipo: sections.cubierta_techos?.lamina_tipo || null,
            lamina_color: sections.cubierta_techos?.lamina_color || null,
            lamina_medida: sections.cubierta_techos?.lamina_medida || null,
            
            // Hojalatería - Cumbrera
            cumbrera_descripcion_lamina: sections.cubierta_techos?.hojalateria_cumbrera_descripcion || null,
            cumbrera_medida_ml: sections.cubierta_techos?.hojalateria_cumbrera_ml || null,
            
            // Tornillería
            tornilleria_tipo: sections.cubierta_techos?.tornilleria_tipo || null,
            tornilleria_medida: sections.cubierta_techos?.tornilleria_medida || null,
            
            // Electricidad - Iluminación
            iluminacion_ubicacion: sections.electricidad?.iluminacion_ubicacion || null,
            iluminacion_bombillo: sections.electricidad?.iluminacion_bombillo || null,
            iluminacion_tipo_luz: sections.electricidad?.iluminacion_tipo_luz || null,
            iluminacion_watts: sections.electricidad?.iluminacion_watts || null,
            
            // Electricidad - Tomacorriente
            tomacorriente_tipo: sections.electricidad?.tomacorriente_tipo || null,
            tomacorriente_voltaje: sections.electricidad?.tomacorriente_voltaje || null,
            
            // Centros de carga
            centro_carga_marca: sections.electricidad?.centros_carga_marca || null,
            centro_carga_cantidad_circuitos: sections.electricidad?.centros_carga_circuitos || null,
            
            // Puertas
            puerta_tipo: sections.puertas?.puerta_tipo || null,
            puerta_tipo_bisagra: sections.puertas?.bisagra_tipo || null,
            
            // Pisos
            piso_tipo_material: sections.pisos?.piso_material || null,
            piso_enchapes: sections.pisos?.enchapes_tipo || null,
            
            // Pintura
            pintura_paredes: sections.paredes_pintura?.paredes_material || null,
            pintura_tipo: sections.paredes_pintura?.pintura_tipo || null,
            
            // Aire Acondicionado
            ac_tipo: sections.aire_acondicionado?.ac_tipo || null,
            ac_capacidad_btu: sections.aire_acondicionado?.ac_btu || null,
            ac_gas_refrigerante: sections.aire_acondicionado?.ac_gas || null,
            ac_limpieza_filtros: sections.aire_acondicionado?.ac_filtros_limpios === 'si' ? 1 : 0,
            
            // Ventanas
            ventana_tipo: sections.ventanas?.ventana_tipo || null,
            ventana_material: sections.ventanas?.ventana_material || null,
            
            // Estructuras de metal
            estructura_tipo: sections.estructuras_metal?.estructura_tipo || null,
            estructura_material: sections.estructuras_metal?.estructura_material || null,
            estructura_medida_m: sections.estructuras_metal?.estructura_medida_m || null,
            estructura_oxidacion: sections.estructuras_metal?.estructura_corrosion === 'si' ? 1 : 0,
            
            // Datos
            datos_tipo_red: sections.datos_red?.datos_tipo_red || null,
            
            // Telefonía
            telefonia_tipo_linea: sections.datos_red?.telefonia_tipo_linea || null,
            
            // Cámaras
            camara_tipo: sections.camaras?.camaras_tipo || null,
            camara_resolucion_mp: sections.camaras?.camaras_resolucion || null,
            camara_conectividad: sections.camaras?.camaras_conectividad || null,
            
            // Observaciones generales
            observaciones: sections.observaciones?.observaciones_generales || null,
            
            // Usuario que creó (obtener del session si está disponible)
            creado_por: req.session?.user?.id_usuario || null
        };
        
        // Construir query dinámicamente solo con campos no nulos
        const fields = [];
        const params = [];
        const paramNames = [];
        
        for (const [key, value] of Object.entries(inspectionData)) {
            if (value !== null && value !== undefined) {
                fields.push(key);
                paramNames.push(`@${key}`);
                params.push({ name: key, value: value });
            }
        }
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay datos para guardar' });
        }
        
        // Crear inspección
        let query = `
            INSERT INTO inspecciones (${fields.join(', ')})
            OUTPUT INSERTED.id_inspeccion
            VALUES (${paramNames.join(', ')})
        `;
        
        const pool = await db.getConnection();
        const request = pool.request();
        
        // Agregar parámetros
        params.forEach(p => {
            request.input(p.name, p.value);
        });
        
        const result = await request.query(query);
        const id_inspeccion = result.recordset[0].id_inspeccion;
        
        // Crear tarea asociada
        const tareaResult = await pool.request()
            .input('titulo', title || 'Inspección sin título')
            .input('estado', 'No Iniciado')
            .input('asignado_a', assignedTo || null)
            .input('fecha', date || new Date().toISOString().split('T')[0])
            .input('prioridad', 'Media')
            .input('id_inspeccion', id_inspeccion)
            .input('creado_por', req.session?.user?.id_usuario || null)
            .query(`
                INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, id_inspeccion, creado_por)
                OUTPUT INSERTED.id_tarea
                VALUES (@titulo, @estado, @asignado_a, @fecha, @prioridad, @id_inspeccion, @creado_por)
            `);
        
        const id_tarea = tareaResult.recordset[0].id_tarea;
        
        // Guardar imágenes si hay
        if (inspection.images_base64 && Array.isArray(inspection.images_base64)) {
            for (const img of inspection.images_base64) {
                // Calcular tamaño
                const base64Data = img.data.split(',')[1] || img.data;
                const tamaño_bytes = Buffer.from(base64Data, 'base64').length;
                
                // Use explicit SQL parameter types to avoid driver-side truncation for large payloads
                await pool.request()
                    .input('id_inspeccion', id_inspeccion)
                    .input('nombre_archivo', img.name)
                    .input('tipo_mime', img.type)
                    .input('data_base64', db.sql.NVarChar(db.sql.MAX), img.data)
                    .input('tamaño_bytes', db.sql.Int, tamaño_bytes)
                    .input('subido_por', req.session?.user?.id_usuario || null)
                    .query(`
                        INSERT INTO imagenes_inspeccion 
                        (id_inspeccion, nombre_archivo, tipo_mime, data_base64, tamaño_bytes, subido_por)
                        VALUES (@id_inspeccion, @nombre_archivo, @tipo_mime, @data_base64, @tamaño_bytes, @subido_por)
                    `);
            }
        }
        
        res.status(201).json({
            success: true,
            id_inspeccion,
            id_tarea,
            message: 'Inspección y tarea creadas exitosamente'
        });
        
    } catch (error) {
        console.error('Error creando inspección:', error);
        res.status(500).json({ 
            error: 'Error al crear inspección',
            details: error.message 
        });
    }
});

// GET /api/inspections/:id - Obtener inspección por ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        
        const pool = await db.getConnection();
        const result = await pool.request()
            .input('id', id)
            .query(`
                SELECT * FROM inspecciones WHERE id_inspeccion = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Inspección no encontrada' });
        }
        
        // Obtener imágenes asociadas
        const imagenes = await pool.request()
            .input('id', id)
            .query(`
                SELECT 
                    id_imagen,
                    nombre_archivo,
                    tipo_mime,
                    data_base64,
                    tamaño_bytes,
                    fecha_subida
                FROM imagenes_inspeccion
                WHERE id_inspeccion = @id
            `);
        
        const inspeccion = result.recordset[0];
        inspeccion.imagenes = imagenes.recordset;
        
        res.json(inspeccion);
        
    } catch (error) {
        console.error('Error obteniendo inspección:', error);
        res.status(500).json({ error: 'Error al obtener inspección' });
    }
});

// Función auxiliar para determinar el tipo de inspección basado en los campos llenados
function determinarTipoInspeccion(sections) {
    if (sections.cubierta_techos && hasFilledFields(sections.cubierta_techos)) {
        return 'Cubierta de Techos';
    }
    if (sections.electricidad && hasFilledFields(sections.electricidad)) {
        return 'Electricidad';
    }
    if (sections.aire_acondicionado && hasFilledFields(sections.aire_acondicionado)) {
        return 'Aire Acondicionado';
    }
    if (sections.puertas && hasFilledFields(sections.puertas)) {
        return 'Puertas';
    }
    if (sections.pisos && hasFilledFields(sections.pisos)) {
        return 'Pisos';
    }
    if (sections.paredes_pintura && hasFilledFields(sections.paredes_pintura)) {
        return 'Pintura';
    }
    if (sections.ventanas && hasFilledFields(sections.ventanas)) {
        return 'Ventanas';
    }
    if (sections.estructuras_metal && hasFilledFields(sections.estructuras_metal)) {
        return 'Estructuras de Metal';
    }
    if (sections.camaras && hasFilledFields(sections.camaras)) {
        return 'Cámaras de Seguridad';
    }
    if (sections.datos_red && hasFilledFields(sections.datos_red)) {
        return 'Datos y Telefonía';
    }
    
    return 'Inspección General';
}

// Función auxiliar para verificar si un objeto tiene campos llenados
function hasFilledFields(obj) {
    return obj && Object.values(obj).some(val => val !== null && val !== undefined && val !== '');
}

module.exports = router;

