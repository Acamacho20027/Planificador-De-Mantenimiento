-- =====================================================
-- DATOS DE EJEMPLO - PLANIFICADOR DE MANTENIMIENTO
-- COMPATIBLE CON SQL SERVER MANAGEMENT STUDIO
-- =====================================================

USE planificador_mantenimiento;
GO

-- =====================================================
-- INSERTAR TAREAS DE EJEMPLO
-- =====================================================
INSERT INTO tareas (
    titulo_tarea, 
    descripcion, 
    id_inspeccion, 
    id_ubicacion, 
    id_estado, 
    fecha_creacion,
    fecha_inicio,
    fecha_finalizacion,
    tiempo_estimado,
    tiempo_usado,
    costo_estimado,
    costo_real,
    asignado_a,
    creado_por,
    prioridad,
    trabajo_especial,
    comentarios
) VALUES
-- Tareas completadas
(
    'Cubierta de Techos - Fachada Principal',
    'Inspección y limpieza de la cubierta de la fachada principal. Verificar sellos y drenajes.',
    1, -- Cubierta de Techos
    1, -- Fachada Principal
    3, -- Finalizado
    '2024-01-10 08:00:00',
    '2024-01-10 09:00:00',
    '2024-01-10 12:00:00',
    180, -- 3 horas estimadas
    180, -- 3 horas usadas
    150.00,
    150.00,
    'Juan Pérez',
    'Admin',
    'Media',
    0, -- FALSE
    'Trabajo completado sin inconvenientes. Se encontraron algunas grietas menores que fueron selladas.'
),

-- Tareas en proceso
(
    'Electricidad - Planta Baja',
    'Reparación de tomas eléctricas en aula 101. Algunas tomas no funcionan correctamente.',
    2, -- Electricidad
    5, -- Planta Baja
    2, -- En Proceso
    '2024-01-15 10:00:00',
    '2024-01-15 14:00:00',
    NULL,
    120, -- 2 horas estimadas
    60,  -- 1 hora usada
    80.00,
    40.00,
    'Carlos Rodríguez',
    'Supervisor',
    'Alta',
    0, -- FALSE
    'En progreso. Se identificó el problema en el panel principal.'
),

-- Tareas sin iniciar
(
    'Ventanas - Segundo Piso',
    'Limpieza profunda de todas las ventanas del segundo piso.',
    8, -- Ventanas
    7, -- Segundo Piso
    1, -- Sin Iniciar
    '2024-01-18 08:00:00',
    NULL,
    NULL,
    240, -- 4 horas estimadas
    0,
    100.00,
    0.00,
    'María González',
    'Admin',
    'Baja',
    0, -- FALSE
    'Pendiente de asignación de personal.'
),

(
    'Aire Acondicionado - Aula 201',
    'Mantenimiento preventivo del sistema de aire acondicionado del aula 201.',
    7, -- Aire Acondicionado
    11, -- Aula 201
    1, -- Sin Iniciar
    '2024-01-12 09:00:00',
    NULL,
    NULL,
    90, -- 1.5 horas estimadas
    0,
    120.00,
    0.00,
    'Luis Martínez',
    'Admin',
    'Media',
    0, -- FALSE
    'Programado para próxima semana.'
),

-- Tareas de trabajo especial
(
    'Cámaras de Seguridad - Exterior',
    'Instalación de nuevo sistema de cámaras de seguridad en área exterior.',
    19, -- Cámaras de Seguridad
    13, -- Patio Principal
    1, -- Sin Iniciar
    '2024-01-20 08:00:00',
    NULL,
    NULL,
    480, -- 8 horas estimadas
    0,
    1500.00,
    0.00,
    'Empresa Externa',
    'Admin',
    'Crítica',
    1, -- TRUE
    'Trabajo especial que requiere empresa externa especializada.'
),

-- Tareas en cotización
(
    'Estructuras de Metal - Azotea',
    'Reparación de estructura metálica corroída en azotea del edificio.',
    13, -- Estructuras de Metal
    15, -- Azotea
    4, -- Cotizar
    '2024-01-22 10:00:00',
    NULL,
    NULL,
    360, -- 6 horas estimadas
    0,
    800.00,
    0.00,
    'Pendiente',
    'Supervisor',
    'Alta',
    1, -- TRUE
    'Requiere cotización de empresa especializada en estructuras metálicas.'
),

-- Más tareas de ejemplo
(
    'Bombas de Agua - Planta Baja',
    'Revisión y mantenimiento de sistema de bombeo de agua.',
    6, -- Bombas de Agua
    5, -- Planta Baja
    2, -- En Proceso
    '2024-01-14 08:00:00',
    '2024-01-14 10:00:00',
    NULL,
    150,
    75,
    200.00,
    100.00,
    'Juan Pérez',
    'Admin',
    'Alta',
    0,
    'Detectado ruido anormal en bomba principal.'
),

(
    'Hidrolavados - Patio Principal',
    'Hidrolavado completo del patio principal y áreas exteriores.',
    10, -- Hidrolavados
    13, -- Patio Principal
    1, -- Sin Iniciar
    '2024-01-21 07:00:00',
    NULL,
    NULL,
    120,
    0,
    80.00,
    0.00,
    'María González',
    'Supervisor',
    'Baja',
    0,
    'Limpieza programada semanal.'
),

(
    'Sistemas Contra Incendios - Todos los Pisos',
    'Inspección mensual de extintores y sistemas contra incendios.',
    14, -- Sistemas Contra Incendios
    5, -- Planta Baja
    3, -- Finalizado
    '2024-01-08 09:00:00',
    '2024-01-08 10:00:00',
    '2024-01-08 12:00:00',
    120,
    115,
    100.00,
    95.00,
    'Carlos Rodríguez',
    'Admin',
    'Crítica',
    0,
    'Todos los extintores en buen estado. Certificación actualizada.'
),

(
    'Pintura - Aula 102',
    'Repintar paredes del aula 102 por manchas de humedad.',
    5, -- Pintura
    10, -- Aula 102
    4, -- Cotizar
    '2024-01-23 08:00:00',
    NULL,
    NULL,
    480,
    0,
    350.00,
    0.00,
    'Pendiente',
    'Supervisor',
    'Media',
    0,
    'Requiere cotización de pintor profesional.'
);
GO

-- =====================================================
-- INSERTAR IMÁGENES DE EJEMPLO
-- =====================================================
INSERT INTO imagenes_tareas (id_tarea, nombre_archivo, ruta_archivo, tipo_imagen, descripcion_imagen, subido_por) VALUES
-- Imágenes para la tarea 1 (Cubierta de Techos - Finalizada)
(1, 'techo_antes_001.jpg', '/uploads/tareas/1/techo_antes_001.jpg', 'Antes', 'Estado inicial de la cubierta antes del mantenimiento', 'Juan Pérez'),
(1, 'techo_durante_001.jpg', '/uploads/tareas/1/techo_durante_001.jpg', 'Durante', 'Proceso de limpieza y sellado', 'Juan Pérez'),
(1, 'techo_despues_001.jpg', '/uploads/tareas/1/techo_despues_001.jpg', 'Después', 'Estado final después del mantenimiento', 'Juan Pérez'),

-- Imágenes para la tarea 2 (Reparación Eléctrica - En Proceso)
(2, 'panel_electrico_001.jpg', '/uploads/tareas/2/panel_electrico_001.jpg', 'Problema', 'Panel eléctrico con problemas identificados', 'Carlos Rodríguez'),
(2, 'toma_danada_001.jpg', '/uploads/tareas/2/toma_danada_001.jpg', 'Problema', 'Toma eléctrica dañada que requiere reparación', 'Carlos Rodríguez'),

-- Imágenes para la tarea 6 (Estructura Metálica - Cotizar)
(6, 'corrosion_001.jpg', '/uploads/tareas/6/corrosion_001.jpg', 'Problema', 'Área de corrosión en estructura metálica', 'Supervisor'),
(6, 'corrosion_002.jpg', '/uploads/tareas/6/corrosion_002.jpg', 'Problema', 'Detalle de la corrosión que requiere atención', 'Supervisor'),

-- Imágenes para la tarea 7 (Bombas de Agua - En Proceso)
(7, 'bomba_agua_001.jpg', '/uploads/tareas/7/bomba_agua_001.jpg', 'Problema', 'Bomba de agua con ruido anormal', 'Juan Pérez'),

-- Imágenes para la tarea 9 (Sistemas Contra Incendios - Finalizada)
(9, 'extintor_001.jpg', '/uploads/tareas/9/extintor_001.jpg', 'Después', 'Extintores verificados y certificados', 'Carlos Rodríguez');
GO

-- =====================================================
-- INSERTAR HISTORIAL DE CAMBIOS DE ESTADO
-- =====================================================
INSERT INTO historial_estados (id_tarea, estado_anterior, estado_nuevo, comentario_cambio, cambiado_por) VALUES
-- Historial para tarea 1 (Cubierta de Techos)
(1, 1, 2, 'Tarea iniciada por el técnico asignado', 'Juan Pérez'),
(1, 2, 3, 'Tarea completada exitosamente', 'Juan Pérez'),

-- Historial para tarea 2 (Reparación Eléctrica)
(2, 1, 2, 'Inicio de reparación eléctrica', 'Carlos Rodríguez'),

-- Historial para tarea 6 (Estructura Metálica)
(6, 1, 4, 'Cambio a cotización por requerir empresa externa', 'Supervisor'),

-- Historial para tarea 7 (Bombas de Agua)
(7, 1, 2, 'Iniciado mantenimiento de bombas', 'Juan Pérez'),

-- Historial para tarea 9 (Sistemas Contra Incendios)
(9, 1, 2, 'Inicio de inspección mensual', 'Carlos Rodríguez'),
(9, 2, 3, 'Inspección completada - Todo en orden', 'Carlos Rodríguez'),

-- Historial para tarea 10 (Pintura)
(10, 1, 4, 'Requiere cotización de pintor profesional', 'Supervisor');
GO

-- =====================================================
-- INSERTAR USUARIOS ADICIONALES
-- =====================================================
INSERT INTO usuarios (nombre_usuario, email, password_hash, nombre_completo, rol) VALUES
('jperez', 'juan.perez@empresa.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan Pérez', 'Técnico'),
('crodriguez', 'carlos.rodriguez@empresa.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos Rodríguez', 'Técnico'),
('mgonzalez', 'maria.gonzalez@empresa.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María González', 'Supervisor'),
('lmartinez', 'luis.martinez@empresa.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Luis Martínez', 'Técnico'),
('supervisor', 'supervisor@empresa.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Supervisor Principal', 'Supervisor');
GO

-- =====================================================
-- CONSULTAS DE PRUEBA
-- =====================================================

PRINT 'Ejecutando consultas de prueba...';
GO

-- Consulta 1: Mostrar todas las tareas con información completa
SELECT 
    t.id_tarea,
    t.titulo_tarea,
    i.nombre_inspeccion as 'Tipo Inspección',
    u.nombre_ubicacion as 'Ubicación',
    e.nombre_estado as 'Estado',
    t.asignado_a as 'Asignado a',
    t.prioridad,
    t.fecha_creacion as 'Fecha Creación',
    t.tiempo_usado as 'Tiempo Usado (min)',
    t.costo_real as 'Costo Real'
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
LEFT JOIN ubicaciones u ON t.id_ubicacion = u.id_ubicacion
LEFT JOIN estados e ON t.id_estado = e.id_estado
ORDER BY t.fecha_creacion DESC;
GO

-- Consulta 2: Estadísticas por estado
SELECT 
    e.nombre_estado as 'Estado',
    COUNT(t.id_tarea) as 'Cantidad Tareas',
    ROUND(AVG(CAST(t.tiempo_usado AS FLOAT)), 2) as 'Tiempo Promedio (min)',
    SUM(t.costo_real) as 'Costo Total'
FROM estados e
LEFT JOIN tareas t ON e.id_estado = t.id_estado
GROUP BY e.id_estado, e.nombre_estado
ORDER BY COUNT(t.id_tarea) DESC;
GO

-- Consulta 3: Tareas por tipo de inspección
SELECT 
    i.nombre_inspeccion as 'Tipo de Inspección',
    i.categoria,
    COUNT(t.id_tarea) as 'Total Tareas',
    SUM(CASE WHEN t.id_estado = 3 THEN 1 ELSE 0 END) as 'Completadas',
    SUM(CASE WHEN t.id_estado IN (1,2) THEN 1 ELSE 0 END) as 'Pendientes',
    ROUND(AVG(CAST(t.tiempo_usado AS FLOAT)), 2) as 'Tiempo Promedio (min)'
FROM inspecciones i
LEFT JOIN tareas t ON i.id_inspeccion = t.id_inspeccion
GROUP BY i.id_inspeccion, i.nombre_inspeccion, i.categoria
HAVING COUNT(t.id_tarea) > 0
ORDER BY COUNT(t.id_tarea) DESC;
GO

-- Consulta 4: Tareas por ubicación
SELECT 
    u.tipo_ubicacion as 'Tipo',
    u.nombre_ubicacion as 'Ubicación',
    COUNT(t.id_tarea) as 'Total Tareas',
    SUM(CASE WHEN t.id_estado IN (1,2) THEN 1 ELSE 0 END) as 'Tareas Pendientes'
FROM ubicaciones u
LEFT JOIN tareas t ON u.id_ubicacion = t.id_ubicacion
GROUP BY u.id_ubicacion, u.tipo_ubicacion, u.nombre_ubicacion
HAVING COUNT(t.id_tarea) > 0
ORDER BY COUNT(t.id_tarea) DESC;
GO

-- Consulta 5: Trabajos especiales pendientes
SELECT 
    t.titulo_tarea,
    i.nombre_inspeccion as 'Tipo',
    u.nombre_ubicacion as 'Ubicación',
    t.costo_estimado,
    t.asignado_a,
    t.prioridad
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
LEFT JOIN ubicaciones u ON t.id_ubicacion = u.id_ubicacion
WHERE t.trabajo_especial = 1
AND t.id_estado IN (1, 2, 4) -- Sin Iniciar, En Proceso, Cotizar
ORDER BY 
    CASE t.prioridad 
        WHEN 'Crítica' THEN 1 
        WHEN 'Alta' THEN 2 
        WHEN 'Media' THEN 3 
        WHEN 'Baja' THEN 4 
    END,
    t.fecha_creacion ASC;
GO

-- Consulta 6: Usar vista para obtener tareas completas
SELECT TOP 10 * FROM VW_tareas_completa ORDER BY fecha_creacion DESC;
GO

-- Consulta 7: Usar vista de estadísticas
SELECT * FROM VW_estadisticas_estados ORDER BY cantidad_tareas DESC;
GO

-- Consulta 8: Ejecutar procedimiento almacenado de estadísticas
EXEC SP_obtener_estadisticas_tareas;
GO

PRINT 'Datos de ejemplo insertados correctamente';
PRINT 'Total tareas: ' + CAST((SELECT COUNT(*) FROM tareas) AS NVARCHAR(10));
PRINT 'Total usuarios: ' + CAST((SELECT COUNT(*) FROM usuarios) AS NVARCHAR(10));
PRINT 'Total inspecciones (tipos): ' + CAST((SELECT COUNT(*) FROM inspecciones) AS NVARCHAR(10));
PRINT 'Total imágenes: ' + CAST((SELECT COUNT(*) FROM imagenes_tareas) AS NVARCHAR(10));
GO