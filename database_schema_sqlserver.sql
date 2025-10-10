-- =====================================================
-- SCRIPT DE BASE DE DATOS - PLANIFICADOR DE MANTENIMIENTO
-- COMPATIBLE CON SQL SERVER MANAGEMENT STUDIO
-- =====================================================

-- Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'planificador_mantenimiento')
BEGIN
    CREATE DATABASE planificador_mantenimiento;
END
GO

USE planificador_mantenimiento;
GO

-- =====================================================
-- TABLA: ESTADOS
-- =====================================================
CREATE TABLE estados (
    id_estado INT IDENTITY(1,1) PRIMARY KEY,
    nombre_estado NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(MAX),
    color_codigo NVARCHAR(7) DEFAULT '#6B7280',
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);
GO

-- Insertar estados predeterminados
INSERT INTO estados (nombre_estado, descripcion, color_codigo) VALUES
('Sin Iniciar', 'Tarea creada pero no comenzada', '#6B7280'),
('En Proceso', 'Tarea en ejecución', '#F59E0B'),
('Finalizado', 'Tarea completada exitosamente', '#10B981'),
('Cotizar', 'Tarea pendiente de cotización', '#8B5CF6'),
('Cancelado', 'Tarea cancelada', '#EF4444');
GO

-- =====================================================
-- TABLA: INSPECCIONES (Tipos de Mantenimiento)
-- =====================================================
CREATE TABLE inspecciones (
    id_inspeccion INT IDENTITY(1,1) PRIMARY KEY,
    nombre_inspeccion NVARCHAR(100) NOT NULL UNIQUE,
    descripcion NVARCHAR(MAX),
    categoria NVARCHAR(20) DEFAULT 'Preventivo' CHECK (categoria IN ('Preventivo', 'Correctivo', 'Predictivo', 'Otros')),
    frecuencia_sugerida NVARCHAR(50),
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);
GO

-- Insertar tipos de inspecciones
INSERT INTO inspecciones (nombre_inspeccion, descripcion, categoria, frecuencia_sugerida) VALUES
('Cubierta de Techos', 'Mantenimiento de techos y cubiertas', 'Preventivo', 'Mensual'),
('Electricidad', 'Sistemas eléctricos generales', 'Preventivo', 'Mensual'),
('Puertas', 'Mantenimiento de puertas y cerraduras', 'Preventivo', 'Trimestral'),
('Pisos', 'Mantenimiento de pisos y superficies', 'Preventivo', 'Mensual'),
('Pintura', 'Pintura y acabados', 'Preventivo', 'Anual'),
('Bombas de Agua', 'Sistemas de bombeo de agua', 'Preventivo', 'Mensual'),
('Aire Acondicionado', 'Sistemas de climatización', 'Preventivo', 'Mensual'),
('Ventanas', 'Mantenimiento de ventanas y vidrios', 'Preventivo', 'Trimestral'),
('Barandas', 'Barandas y elementos de seguridad', 'Preventivo', 'Mensual'),
('Hidrolavados', 'Limpieza con hidrolavadora', 'Preventivo', 'Semanal'),
('Telefonía', 'Sistemas de telefonía', 'Preventivo', 'Trimestral'),
('Datos', 'Infraestructura de datos y red', 'Preventivo', 'Mensual'),
('Estructuras de Metal', 'Estructuras metálicas', 'Preventivo', 'Semestral'),
('Sistemas Contra Incendios', 'Sistemas de seguridad contra incendios', 'Preventivo', 'Mensual'),
('Planta Eléctrica', 'Generadores y plantas eléctricas', 'Preventivo', 'Mensual'),
('Motores de Portones', 'Motores y automatización de portones', 'Preventivo', 'Trimestral'),
('Aceras', 'Mantenimiento de aceras y caminos', 'Preventivo', 'Mensual'),
('Cordón + Caño', 'Sistemas de drenaje', 'Preventivo', 'Mensual'),
('Cámaras de Seguridad', 'Sistemas de videovigilancia', 'Preventivo', 'Mensual');
GO

-- =====================================================
-- TABLA: UBICACIONES (Fachada, Piso, Aula)
-- =====================================================
CREATE TABLE ubicaciones (
    id_ubicacion INT IDENTITY(1,1) PRIMARY KEY,
    tipo_ubicacion NVARCHAR(20) NOT NULL CHECK (tipo_ubicacion IN ('Fachada', 'Piso', 'Aula', 'Exterior', 'Sótano', 'Azotea')),
    nombre_ubicacion NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(MAX),
    codigo_ubicacion NVARCHAR(20) UNIQUE,
    activa BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT UQ_tipo_nombre UNIQUE (tipo_ubicacion, nombre_ubicacion)
);
GO

-- Insertar ubicaciones de ejemplo
INSERT INTO ubicaciones (tipo_ubicacion, nombre_ubicacion, descripcion, codigo_ubicacion) VALUES
('Fachada', 'Fachada Principal', 'Fachada frontal del edificio', 'FACH-001'),
('Fachada', 'Fachada Lateral Izquierda', 'Fachada lateral izquierda', 'FACH-002'),
('Fachada', 'Fachada Lateral Derecha', 'Fachada lateral derecha', 'FACH-003'),
('Fachada', 'Fachada Posterior', 'Fachada trasera del edificio', 'FACH-004'),
('Piso', 'Planta Baja', 'Planta baja del edificio', 'PB-001'),
('Piso', 'Primer Piso', 'Primer piso del edificio', 'P1-001'),
('Piso', 'Segundo Piso', 'Segundo piso del edificio', 'P2-001'),
('Piso', 'Tercer Piso', 'Tercer piso del edificio', 'P3-001'),
('Aula', 'Aula 101', 'Aula principal planta baja', 'A101'),
('Aula', 'Aula 102', 'Aula secundaria planta baja', 'A102'),
('Aula', 'Aula 201', 'Aula primer piso', 'A201'),
('Aula', 'Aula 202', 'Aula primer piso', 'A202'),
('Exterior', 'Patio Principal', 'Patio exterior principal', 'EXT-001'),
('Exterior', 'Estacionamiento', 'Área de estacionamiento', 'EXT-002'),
('Azotea', 'Azotea', 'Azotea del edificio', 'AZT-001');
GO


-- =====================================================
-- TABLA: TAREAS
-- =====================================================
CREATE TABLE tareas (
    id_tarea INT IDENTITY(1,1) PRIMARY KEY,
    titulo_tarea NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX),
    id_inspeccion INT NOT NULL,
    id_ubicacion INT NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_inicio DATETIME2 NULL,
    fecha_finalizacion DATETIME2 NULL,
    tiempo_estimado INT DEFAULT 0, -- en minutos
    tiempo_usado INT DEFAULT 0, -- en minutos
    costo_estimado DECIMAL(10,2) DEFAULT 0.00,
    costo_real DECIMAL(10,2) DEFAULT 0.00,
    asignado_a NVARCHAR(100),
    creado_por NVARCHAR(100),
    prioridad NVARCHAR(20) DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Crítica')),
    trabajo_especial BIT DEFAULT 0,
    comentarios NVARCHAR(MAX),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_tareas_inspeccion FOREIGN KEY (id_inspeccion) 
        REFERENCES inspecciones(id_inspeccion) ON DELETE NO ACTION,
    CONSTRAINT FK_tareas_ubicacion FOREIGN KEY (id_ubicacion) 
        REFERENCES ubicaciones(id_ubicacion) ON DELETE NO ACTION,
    CONSTRAINT FK_tareas_estado FOREIGN KEY (id_estado) 
        REFERENCES estados(id_estado) ON DELETE NO ACTION
);
GO

-- =====================================================
-- TABLA: IMÁGENES DE TAREAS
-- =====================================================
CREATE TABLE imagenes_tareas (
    id_imagen INT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    nombre_archivo NVARCHAR(255) NOT NULL,
    ruta_archivo NVARCHAR(500) NOT NULL,
    tipo_imagen NVARCHAR(20) DEFAULT 'Durante' CHECK (tipo_imagen IN ('Antes', 'Durante', 'Después', 'Problema', 'Solución')),
    descripcion_imagen NVARCHAR(MAX),
    tamaño_archivo INT,
    fecha_subida DATETIME2 DEFAULT GETDATE(),
    subido_por NVARCHAR(100),
    
    CONSTRAINT FK_imagenes_tarea FOREIGN KEY (id_tarea) 
        REFERENCES tareas(id_tarea) ON DELETE CASCADE
);
GO

-- =====================================================
-- TABLA: HISTORIAL DE CAMBIOS DE ESTADO
-- =====================================================
CREATE TABLE historial_estados (
    id_historial INT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    estado_anterior INT NULL,
    estado_nuevo INT NOT NULL,
    fecha_cambio DATETIME2 DEFAULT GETDATE(),
    comentario_cambio NVARCHAR(MAX),
    cambiado_por NVARCHAR(100),
    
    CONSTRAINT FK_historial_tarea FOREIGN KEY (id_tarea) 
        REFERENCES tareas(id_tarea) ON DELETE CASCADE,
    CONSTRAINT FK_historial_estado_anterior FOREIGN KEY (estado_anterior) 
        REFERENCES estados(id_estado) ON DELETE SET NULL,
    CONSTRAINT FK_historial_estado_nuevo FOREIGN KEY (estado_nuevo) 
        REFERENCES estados(id_estado) ON DELETE NO ACTION
);
GO

-- =====================================================
-- TABLA: USUARIOS (Para autenticación)
-- =====================================================
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre_usuario NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    nombre_completo NVARCHAR(100) NOT NULL,
    rol NVARCHAR(20) DEFAULT 'Usuario' CHECK (rol IN ('Admin', 'Técnico', 'Supervisor', 'Usuario')),
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    ultimo_acceso DATETIME2 NULL
);
GO

-- Insertar usuario admin por defecto
INSERT INTO usuarios (nombre_usuario, email, password_hash, nombre_completo, rol) VALUES
('admin', 'admin@mantenimiento.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador del Sistema', 'Admin');
GO


-- =====================================================
-- TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Trigger para actualizar fecha_actualizacion en tareas
CREATE TRIGGER TR_tareas_fecha_actualizacion
ON tareas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tareas 
    SET fecha_actualizacion = GETDATE()
    FROM tareas t
    INNER JOIN inserted i ON t.id_tarea = i.id_tarea;
END
GO

-- Trigger para registrar cambios de estado automáticamente
CREATE TRIGGER TR_cambio_estado_tarea
ON tareas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO historial_estados (id_tarea, estado_anterior, estado_nuevo, comentario_cambio, cambiado_por)
    SELECT 
        i.id_tarea, 
        d.id_estado, 
        i.id_estado, 
        'Cambio automático de estado', 
        'Sistema'
    FROM inserted i
    INNER JOIN deleted d ON i.id_tarea = d.id_tarea
    WHERE i.id_estado != d.id_estado;
END
GO

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

-- Procedimiento para crear tareas desde inspección
CREATE PROCEDURE SP_crear_tareas_inspeccion
    @id_inspeccion INT,
    @ubicacion_ids NVARCHAR(MAX),
    @creado_por NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @sql NVARCHAR(MAX);
    
    -- Crear tabla temporal para los IDs de ubicaciones
    CREATE TABLE #temp_ubicaciones (id INT);
    
    -- Insertar IDs en tabla temporal
    SET @sql = 'INSERT INTO #temp_ubicaciones SELECT value FROM STRING_SPLIT(''' + @ubicacion_ids + ''', '','')';
    EXEC sp_executesql @sql;
    
    -- Crear tareas
    INSERT INTO tareas (titulo_tarea, id_inspeccion, id_ubicacion, creado_por)
    SELECT 
        CONCAT(i.nombre_inspeccion, ' - ', u.nombre_ubicacion),
        @id_inspeccion,
        tu.id,
        @creado_por
    FROM #temp_ubicaciones tu
    INNER JOIN inspecciones i ON i.id_inspeccion = @id_inspeccion
    INNER JOIN ubicaciones u ON tu.id = u.id_ubicacion;
    
    -- Limpiar tabla temporal
    DROP TABLE #temp_ubicaciones;
END
GO

-- Procedimiento para obtener estadísticas de tareas
CREATE PROCEDURE SP_obtener_estadisticas_tareas
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estadísticas por estado
    SELECT 
        e.nombre_estado,
        e.color_codigo,
        COUNT(t.id_tarea) as cantidad_tareas,
        ISNULL(AVG(CAST(t.tiempo_usado AS FLOAT)), 0) as tiempo_promedio,
        ISNULL(SUM(t.costo_real), 0) as costo_total
    FROM estados e
    LEFT JOIN tareas t ON e.id_estado = t.id_estado
    GROUP BY e.id_estado, e.nombre_estado, e.color_codigo
    ORDER BY cantidad_tareas DESC;
END
GO

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Tareas con información completa
CREATE VIEW VW_tareas_completa AS
SELECT 
    t.id_tarea,
    t.titulo_tarea,
    t.descripcion,
    i.nombre_inspeccion,
    i.categoria,
    i.frecuencia_sugerida,
    u.tipo_ubicacion,
    u.nombre_ubicacion,
    u.codigo_ubicacion,
    e.nombre_estado,
    e.color_codigo,
    t.fecha_creacion,
    t.fecha_inicio,
    t.fecha_finalizacion,
    t.tiempo_estimado,
    t.tiempo_usado,
    t.costo_estimado,
    t.costo_real,
    t.asignado_a,
    t.prioridad,
    t.trabajo_especial,
    t.comentarios
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
LEFT JOIN ubicaciones u ON t.id_ubicacion = u.id_ubicacion
LEFT JOIN estados e ON t.id_estado = e.id_estado;
GO

-- Vista: Estadísticas de tareas por estado
CREATE VIEW VW_estadisticas_estados AS
SELECT 
    e.nombre_estado,
    e.color_codigo,
    COUNT(t.id_tarea) as cantidad_tareas,
    ISNULL(AVG(CAST(t.tiempo_usado AS FLOAT)), 0) as tiempo_promedio,
    ISNULL(SUM(t.costo_real), 0) as costo_total
FROM estados e
LEFT JOIN tareas t ON e.id_estado = t.id_estado
GROUP BY e.id_estado, e.nombre_estado, e.color_codigo;
GO

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX IX_tareas_estado ON tareas(id_estado);
CREATE INDEX IX_tareas_fecha_creacion ON tareas(fecha_creacion);
CREATE INDEX IX_tareas_asignado_a ON tareas(asignado_a);
CREATE INDEX IX_tareas_prioridad ON tareas(prioridad);
CREATE INDEX IX_tareas_inspeccion ON tareas(id_inspeccion);
CREATE INDEX IX_tareas_ubicacion ON tareas(id_ubicacion);
CREATE INDEX IX_imagenes_tarea ON imagenes_tareas(id_tarea);
GO

-- =====================================================
-- CONSULTAS DE EJEMPLO
-- =====================================================

-- Ejemplo: Obtener todas las tareas pendientes
/*
SELECT * FROM VW_tareas_completa 
WHERE nombre_estado IN ('Sin Iniciar', 'En Proceso')
ORDER BY 
    CASE prioridad 
        WHEN 'Crítica' THEN 1 
        WHEN 'Alta' THEN 2 
        WHEN 'Media' THEN 3 
        WHEN 'Baja' THEN 4 
    END,
    fecha_creacion ASC;
*/

-- Ejemplo: Obtener estadísticas por tipo de inspección
/*
SELECT 
    i.nombre_inspeccion,
    i.categoria,
    COUNT(t.id_tarea) as total_tareas,
    AVG(CAST(t.tiempo_usado AS FLOAT)) as tiempo_promedio_minutos,
    SUM(t.costo_real) as costo_total
FROM inspecciones i
LEFT JOIN tareas t ON i.id_inspeccion = t.id_inspeccion
GROUP BY i.id_inspeccion, i.nombre_inspeccion, i.categoria
ORDER BY total_tareas DESC;
*/

-- Ejemplo: Obtener tareas por ubicación
/*
SELECT 
    u.tipo_ubicacion,
    u.nombre_ubicacion,
    COUNT(t.id_tarea) as tareas_pendientes
FROM ubicaciones u
LEFT JOIN tareas t ON u.id_ubicacion = t.id_ubicacion 
    AND t.id_estado IN (1, 2) -- Sin Iniciar, En Proceso
GROUP BY u.id_ubicacion, u.tipo_ubicacion, u.nombre_ubicacion
ORDER BY tareas_pendientes DESC;
*/

PRINT 'Base de datos creada exitosamente para SQL Server';
PRINT 'Tablas: ' + CAST((SELECT COUNT(*) FROM sys.tables) AS NVARCHAR(10));
PRINT 'Procedimientos: ' + CAST((SELECT COUNT(*) FROM sys.procedures) AS NVARCHAR(10));
PRINT 'Vistas: ' + CAST((SELECT COUNT(*) FROM sys.views) AS NVARCHAR(10));
GO
