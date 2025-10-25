-- =====================================================
-- TABLA: INSTRUCCIONES
-- Sistema de instrucciones específicas para tareas
-- =====================================================

USE PlanificadorMantenimiento;
GO

-- Crear tabla de instrucciones
IF OBJECT_ID('instrucciones', 'U') IS NOT NULL
    DROP TABLE instrucciones;
GO

CREATE TABLE instrucciones (
    id_instruccion INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    categoria NVARCHAR(100) NOT NULL, -- Electricidad, Plomería, Pintura, etc.
    
    -- Auditoría
    creado_por INT,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    activo BIT DEFAULT 1,
    
    CONSTRAINT FK_instrucciones_usuario FOREIGN KEY (creado_por) 
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
GO

-- Crear índices para optimizar búsquedas
CREATE INDEX IX_instrucciones_categoria ON instrucciones(categoria);
CREATE INDEX IX_instrucciones_activo ON instrucciones(activo);
GO

PRINT '✅ Tabla instrucciones creada';
GO

-- =====================================================
-- MODIFICAR TABLA TAREAS PARA AGREGAR INSTRUCCIONES
-- =====================================================

-- Agregar campo de instrucción a la tabla tareas
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tareas') AND name = 'id_instruccion')
BEGIN
    ALTER TABLE tareas 
    ADD id_instruccion INT NULL;
    
    PRINT '✅ Campo id_instruccion agregado a tabla tareas';
END
ELSE
BEGIN
    PRINT '⚠️  Campo id_instruccion ya existe en tabla tareas';
END
GO

-- Agregar foreign key constraint
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_tareas_instruccion')
BEGIN
    ALTER TABLE tareas
    ADD CONSTRAINT FK_tareas_instruccion 
    FOREIGN KEY (id_instruccion) REFERENCES instrucciones(id_instruccion) ON DELETE SET NULL;
    
    PRINT '✅ Foreign key FK_tareas_instruccion agregada';
END
ELSE
BEGIN
    PRINT '⚠️  Foreign key FK_tareas_instruccion ya existe';
END
GO

-- =====================================================
-- ACTUALIZAR VISTA DE TAREAS COMPLETAS
-- =====================================================

-- Eliminar vista existente
IF OBJECT_ID('VW_tareas_completas', 'V') IS NOT NULL
    DROP VIEW VW_tareas_completas;
GO

-- Recrear vista con información de instrucciones
CREATE VIEW VW_tareas_completas AS
SELECT 
    t.id_tarea,
    t.titulo,
    t.estado,
    t.asignado_a,
    t.fecha,
    t.prioridad,
    t.descripcion,
    
    -- Información de inspección (si existe)
    i.nombre_inspeccion,
    i.tipo_inspeccion,
    i.edificio,
    i.piso,
    i.ubicacion,
    
    -- Información de instrucción (si existe)
    inst.id_instruccion,
    inst.titulo AS instruccion_titulo,
    inst.descripcion AS instruccion_descripcion,
    inst.categoria AS instruccion_categoria,
    
    -- Auditoría
    u.nombre AS creado_por_nombre,
    u.email AS creado_por_email,
    t.fecha_creacion,
    t.fecha_actualizacion,
    
    -- Conteo de imágenes de la inspección
    (SELECT COUNT(*) FROM imagenes_inspeccion img WHERE img.id_inspeccion = t.id_inspeccion) AS total_imagenes
    
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
LEFT JOIN instrucciones inst ON t.id_instruccion = inst.id_instruccion
LEFT JOIN usuarios u ON t.creado_por = u.id_usuario;
GO

PRINT '✅ Vista VW_tareas_completas actualizada con instrucciones';
GO

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS PARA INSTRUCCIONES
-- =====================================================

-- SP: Crear instrucción
IF OBJECT_ID('SP_crear_instruccion', 'P') IS NOT NULL
    DROP PROCEDURE SP_crear_instruccion;
GO

CREATE PROCEDURE SP_crear_instruccion
    @titulo NVARCHAR(200),
    @descripcion NVARCHAR(MAX),
    @categoria NVARCHAR(100),
    @creado_por INT = NULL,
    @id_instruccion_nueva INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO instrucciones (
        titulo, descripcion, categoria, creado_por
    )
    VALUES (
        @titulo, @descripcion, @categoria, @creado_por
    );
    
    SET @id_instruccion_nueva = SCOPE_IDENTITY();
    
    SELECT @id_instruccion_nueva AS id_instruccion;
END
GO

PRINT '✅ Procedimiento SP_crear_instruccion creado';
GO

-- SP: Obtener todas las instrucciones
IF OBJECT_ID('SP_obtener_instrucciones', 'P') IS NOT NULL
    DROP PROCEDURE SP_obtener_instrucciones;
GO

CREATE PROCEDURE SP_obtener_instrucciones
    @categoria NVARCHAR(100) = NULL,
    @activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        i.*,
        u.nombre AS creado_por_nombre
    FROM instrucciones i
    LEFT JOIN usuarios u ON i.creado_por = u.id_usuario
    WHERE 
        (@categoria IS NULL OR i.categoria = @categoria)
        AND i.activo = @activo
    ORDER BY i.categoria, i.titulo;
END
GO

PRINT '✅ Procedimiento SP_obtener_instrucciones creado';
GO

-- SP: Actualizar tarea con instrucción
IF OBJECT_ID('SP_asignar_instruccion_tarea', 'P') IS NOT NULL
    DROP PROCEDURE SP_asignar_instruccion_tarea;
GO

CREATE PROCEDURE SP_asignar_instruccion_tarea
    @id_tarea INT,
    @id_instruccion INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE tareas
    SET 
        id_instruccion = @id_instruccion,
        fecha_actualizacion = GETDATE()
    WHERE id_tarea = @id_tarea;
    
    -- Retornar tarea actualizada con instrucción
    SELECT * FROM VW_tareas_completas WHERE id_tarea = @id_tarea;
END
GO

PRINT '✅ Procedimiento SP_asignar_instruccion_tarea creado';
GO

-- =====================================================
-- DATOS DE EJEMPLO PARA INSTRUCCIONES
-- =====================================================

PRINT '';
PRINT '📊 Insertando instrucciones de ejemplo...';
GO

-- Obtener ID del usuario administrador
DECLARE @usuario_admin INT;
SELECT @usuario_admin = id_usuario FROM usuarios WHERE email = 'admin@empresa.com';

-- Instrucciones de ejemplo
INSERT INTO instrucciones (
    titulo, descripcion, categoria, creado_por
) VALUES
(
    'Revisión de Sistema Eléctrico Principal',
    'Procedimiento completo para revisar y mantener el sistema eléctrico principal del edificio. Incluye verificación de breakers, conexiones y funcionamiento general.',
    'Electricidad',
    @usuario_admin
),
(
    'Limpieza de Filtros de Aire Acondicionado',
    'Mantenimiento preventivo de filtros de aire acondicionado para optimizar rendimiento. Proceso de limpieza y reinstalación de filtros.',
    'Aire Acondicionado',
    @usuario_admin
),
(
    'Pintura de Fachada Exterior',
    'Procedimiento para pintar fachada exterior con acabado profesional. Incluye preparación de superficie, aplicación de primer y pintura.',
    'Pintura',
    @usuario_admin
),
(
    'Reparación de Puerta de Emergencia',
    'Cambio de bisagras y cerradura en puerta de emergencia. Proceso completo de desmontaje, instalación y prueba de funcionamiento.',
    'Carpintería',
    @usuario_admin
),
(
    'Mantenimiento de Bomba de Agua',
    'Revisión completa del sistema de bombeo de agua. Incluye verificación de nivel de aceite, sellos, presión y limpieza de filtros.',
    'Plomería',
    @usuario_admin
);

PRINT '✅ Instrucciones de ejemplo creadas';
GO

-- =====================================================
-- ACTUALIZAR PROCEDIMIENTO DE CREAR TAREA
-- =====================================================

-- Actualizar SP_crear_tarea para incluir instrucciones
IF OBJECT_ID('SP_crear_tarea', 'P') IS NOT NULL
    DROP PROCEDURE SP_crear_tarea;
GO

CREATE PROCEDURE SP_crear_tarea
    @titulo NVARCHAR(200),
    @estado NVARCHAR(20),
    @asignado_a NVARCHAR(100),
    @fecha DATE,
    @prioridad NVARCHAR(20),
    @descripcion NVARCHAR(MAX) = NULL,
    @id_inspeccion INT = NULL,
    @id_instruccion INT = NULL,
    @creado_por INT = NULL,
    @id_tarea_nueva INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, descripcion, id_inspeccion, id_instruccion, creado_por)
    VALUES (@titulo, @estado, @asignado_a, @fecha, @prioridad, @descripcion, @id_inspeccion, @id_instruccion, @creado_por);
    
    SET @id_tarea_nueva = SCOPE_IDENTITY();
    
    SELECT @id_tarea_nueva AS id_tarea;
END
GO

PRINT '✅ Procedimiento SP_crear_tarea actualizado con instrucciones';
GO

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

PRINT '';
PRINT '========================================';
PRINT '✅ SISTEMA DE INSTRUCCIONES IMPLEMENTADO';
PRINT '========================================';
PRINT '';

DECLARE @total_instrucciones INT;
SELECT @total_instrucciones = COUNT(*) FROM instrucciones;

PRINT '📊 RESUMEN:';
PRINT '  - Instrucciones creadas: ' + CAST(@total_instrucciones AS NVARCHAR(10));
PRINT '  - Tabla instrucciones: ✓';
PRINT '  - Campo id_instruccion en tareas: ✓';
PRINT '  - Vista VW_tareas_completas actualizada: ✓';
PRINT '  - Procedimientos almacenados: ✓';
PRINT '';

PRINT '📋 CATEGORÍAS DE INSTRUCCIONES:';
SELECT DISTINCT categoria FROM instrucciones ORDER BY categoria;

PRINT '';
PRINT '========================================';
GO
