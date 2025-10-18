-- =====================================================
-- BASE DE DATOS COMPLETA - PLANIFICADOR DE MANTENIMIENTO
-- Sistema Integrado: Usuarios, Inspecciones, Tareas, Dashboard
-- Compatible con: SQL SERVER MANAGEMENT STUDIO 2016+
-- Fecha de creación: 2025-10-18
-- =====================================================
-- 
-- Este script incluye:
-- ✅ Sistema de autenticación con seguridad (login, reset password, lockout)
-- ✅ Sistema completo de inspecciones con wizard de 7 pasos
-- ✅ Gestión de tareas con estados y asignaciones
-- ✅ Almacenamiento de imágenes en base64
-- ✅ Historial y auditoría automática
-- ✅ Procedimientos almacenados optimizados
-- ✅ Vistas para dashboards y reportes
-- ✅ Datos de ejemplo funcionales
-- 
-- =====================================================

-- =====================================================
-- PASO 1: CREAR BASE DE DATOS
-- =====================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PlanificadorMantenimiento')
BEGIN
    CREATE DATABASE PlanificadorMantenimiento;
    PRINT '✅ Base de datos PlanificadorMantenimiento creada exitosamente';
END
ELSE
BEGIN
    PRINT '⚠️  Base de datos PlanificadorMantenimiento ya existe';
END
GO

USE PlanificadorMantenimiento;
GO

PRINT '📁 Usando base de datos: PlanificadorMantenimiento';
GO

-- =====================================================
-- PASO 2: TABLA DE USUARIOS (Sistema de Autenticación)
-- =====================================================

IF OBJECT_ID('usuarios', 'U') IS NOT NULL
    DROP TABLE usuarios;
GO

CREATE TABLE usuarios (
    user_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    rol NVARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario', 'supervisor', 'tecnico')),
    is_active BIT DEFAULT 1,
    
    -- Seguridad y control de acceso
    failed_login_count INT DEFAULT 0,
    last_failed_at DATETIME2 NULL,
    lockout_until DATETIME2 NULL,
    ultimo_acceso DATETIME2 NULL,
    
    -- Auditoría
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX IX_usuarios_email ON usuarios(email);
CREATE INDEX IX_usuarios_rol ON usuarios(rol);
CREATE INDEX IX_usuarios_is_active ON usuarios(is_active);
GO

PRINT '✅ Tabla usuarios creada con índices';
GO

-- =====================================================
-- PASO 3: TABLA DE TOKENS DE RESET DE CONTRASEÑA
-- =====================================================

IF OBJECT_ID('password_reset_tokens', 'U') IS NOT NULL
    DROP TABLE password_reset_tokens;
GO

CREATE TABLE password_reset_tokens (
    token_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    token_hash NVARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_reset_tokens_user FOREIGN KEY (user_id) 
        REFERENCES usuarios(user_id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IX_reset_tokens_expires ON password_reset_tokens(expires_at);
GO

PRINT '✅ Tabla password_reset_tokens creada';
GO

-- =====================================================
-- PASO 4: TABLA DE ESTADOS DE TAREAS
-- =====================================================

IF OBJECT_ID('estados', 'U') IS NOT NULL
    DROP TABLE estados;
GO

CREATE TABLE estados (
    id_estado INT IDENTITY(1,1) PRIMARY KEY,
    codigo_estado NVARCHAR(20) NOT NULL UNIQUE, -- 'not_started', 'in_progress', 'done'
    nombre_estado NVARCHAR(50) NOT NULL,
    descripcion NVARCHAR(200),
    color_hex NVARCHAR(7) DEFAULT '#6B7280',
    orden_display INT DEFAULT 0,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);
GO

-- Insertar estados que mapean al sistema actual
INSERT INTO estados (codigo_estado, nombre_estado, descripcion, color_hex, orden_display) VALUES
('not_started', 'No Iniciado', 'Tarea creada pero no comenzada', '#6B7280', 1),
('in_progress', 'En Progreso', 'Tarea en ejecución actualmente', '#F59E0B', 2),
('done', 'Finalizado', 'Tarea completada exitosamente', '#10B981', 3),
('cancelled', 'Cancelado', 'Tarea cancelada o descartada', '#EF4444', 4);
GO

PRINT '✅ Tabla estados creada con datos iniciales';
GO

-- =====================================================
-- PASO 5: TABLA DE UBICACIONES
-- =====================================================

IF OBJECT_ID('ubicaciones', 'U') IS NOT NULL
    DROP TABLE ubicaciones;
GO

CREATE TABLE ubicaciones (
    id_ubicacion INT IDENTITY(1,1) PRIMARY KEY,
    edificio NVARCHAR(100) NOT NULL,
    piso NVARCHAR(20) NOT NULL,
    oficina_aula NVARCHAR(100),
    codigo_ubicacion NVARCHAR(50) UNIQUE,
    descripcion NVARCHAR(500),
    activa BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT UQ_ubicacion_completa UNIQUE (edificio, piso, oficina_aula)
);
GO

CREATE INDEX IX_ubicaciones_edificio ON ubicaciones(edificio);
CREATE INDEX IX_ubicaciones_piso ON ubicaciones(piso);
GO

PRINT '✅ Tabla ubicaciones creada';
GO

-- =====================================================
-- PASO 6: TABLA DE INSPECCIONES (Datos del Wizard)
-- =====================================================

IF OBJECT_ID('inspecciones', 'U') IS NOT NULL
    DROP TABLE inspecciones;
GO

CREATE TABLE inspecciones (
    id_inspeccion INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Información básica
    nombre_tarea NVARCHAR(200),
    edificio NVARCHAR(100),
    piso NVARCHAR(20),
    oficina_aula NVARCHAR(100),
    
    -- Prioridad
    prioridad NVARCHAR(20) CHECK (prioridad IN ('baja', 'media', 'alta')),
    
    -- Datos completos del wizard (JSON)
    -- Almacena todo el objeto sections del wizard
    datos_completos NVARCHAR(MAX), -- JSON con todas las secciones
    
    -- Metadatos
    timestamp_inspeccion DATETIME2 DEFAULT GETDATE(),
    creado_por UNIQUEIDENTIFIER,
    
    -- Auditoría
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_inspecciones_usuario FOREIGN KEY (creado_por) 
        REFERENCES usuarios(user_id) ON DELETE SET NULL,
        
    -- Validar que datos_completos sea JSON válido (SQL Server 2016+)
    CONSTRAINT CHK_datos_json CHECK (ISJSON(datos_completos) = 1)
);
GO

CREATE INDEX IX_inspecciones_prioridad ON inspecciones(prioridad);
CREATE INDEX IX_inspecciones_edificio ON inspecciones(edificio);
CREATE INDEX IX_inspecciones_fecha ON inspecciones(fecha_creacion);
GO

PRINT '✅ Tabla inspecciones creada con soporte JSON';
GO

-- =====================================================
-- PASO 7: TABLA DE TAREAS (Sistema Principal)
-- =====================================================

IF OBJECT_ID('tareas', 'U') IS NOT NULL
    DROP TABLE tareas;
GO

CREATE TABLE tareas (
    id_tarea INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Información básica
    titulo NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX),
    
    -- Estado y asignación
    id_estado INT NOT NULL DEFAULT 1,
    asignado_a NVARCHAR(100), -- Nombre visible
    asignado_user_id UNIQUEIDENTIFIER NULL, -- ID del usuario asignado
    
    -- Fechas
    fecha DATE NOT NULL,
    fecha_inicio DATETIME2 NULL,
    fecha_finalizacion DATETIME2 NULL,
    
    -- Relación con inspección (opcional)
    id_inspeccion INT NULL,
    
    -- Datos de inspección embebidos (JSON)
    -- Copia de los datos de inspección para acceso rápido
    inspeccion_data NVARCHAR(MAX), -- JSON completo de la inspección
    
    -- Tiempos y costos
    tiempo_estimado_minutos INT DEFAULT 0,
    tiempo_real_minutos INT DEFAULT 0,
    costo_estimado DECIMAL(10,2) DEFAULT 0.00,
    costo_real DECIMAL(10,2) DEFAULT 0.00,
    
    -- Control
    prioridad NVARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    
    -- Auditoría
    creado_por UNIQUEIDENTIFIER,
    actualizado_por NVARCHAR(100),
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_tareas_estado FOREIGN KEY (id_estado) 
        REFERENCES estados(id_estado) ON DELETE NO ACTION,
    CONSTRAINT FK_tareas_asignado FOREIGN KEY (asignado_user_id) 
        REFERENCES usuarios(user_id) ON DELETE SET NULL,
    CONSTRAINT FK_tareas_inspeccion FOREIGN KEY (id_inspeccion) 
        REFERENCES inspecciones(id_inspeccion) ON DELETE SET NULL,
    CONSTRAINT FK_tareas_creador FOREIGN KEY (creado_por) 
        REFERENCES usuarios(user_id) ON DELETE NO ACTION,
    CONSTRAINT CHK_inspeccion_json CHECK (inspeccion_data IS NULL OR ISJSON(inspeccion_data) = 1)
);
GO

CREATE INDEX IX_tareas_estado ON tareas(id_estado);
CREATE INDEX IX_tareas_asignado ON tareas(asignado_user_id);
CREATE INDEX IX_tareas_fecha ON tareas(fecha);
CREATE INDEX IX_tareas_prioridad ON tareas(prioridad);
CREATE INDEX IX_tareas_creacion ON tareas(fecha_creacion);
GO

PRINT '✅ Tabla tareas creada con soporte JSON para inspecciones';
GO

-- =====================================================
-- PASO 8: TABLA DE IMÁGENES
-- =====================================================

IF OBJECT_ID('imagenes', 'U') IS NOT NULL
    DROP TABLE imagenes;
GO

CREATE TABLE imagenes (
    id_imagen INT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    
    -- Información del archivo
    nombre_archivo NVARCHAR(255) NOT NULL,
    tipo_mime NVARCHAR(100) NOT NULL,
    
    -- Datos en base64 (data URL completo: data:image/jpeg;base64,...)
    data_base64 NVARCHAR(MAX) NOT NULL,
    
    -- Metadatos
    tamaño_bytes INT,
    tipo_imagen NVARCHAR(50) DEFAULT 'general' CHECK (tipo_imagen IN ('antes', 'durante', 'despues', 'problema', 'solucion', 'general')),
    descripcion NVARCHAR(500),
    
    -- Auditoría
    subido_por UNIQUEIDENTIFIER,
    fecha_subida DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_imagenes_tarea FOREIGN KEY (id_tarea) 
        REFERENCES tareas(id_tarea) ON DELETE CASCADE,
    CONSTRAINT FK_imagenes_usuario FOREIGN KEY (subido_por) 
        REFERENCES usuarios(user_id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_imagenes_tarea ON imagenes(id_tarea);
CREATE INDEX IX_imagenes_fecha ON imagenes(fecha_subida);
GO

PRINT '✅ Tabla imagenes creada con soporte base64';
GO

-- =====================================================
-- PASO 9: TABLA DE HISTORIAL DE ESTADOS
-- =====================================================

IF OBJECT_ID('historial_estados', 'U') IS NOT NULL
    DROP TABLE historial_estados;
GO

CREATE TABLE historial_estados (
    id_historial INT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    estado_anterior INT NULL,
    estado_nuevo INT NOT NULL,
    comentario NVARCHAR(500),
    cambiado_por UNIQUEIDENTIFIER,
    fecha_cambio DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_historial_tarea FOREIGN KEY (id_tarea) 
        REFERENCES tareas(id_tarea) ON DELETE CASCADE,
    CONSTRAINT FK_historial_estado_ant FOREIGN KEY (estado_anterior) 
        REFERENCES estados(id_estado) ON DELETE NO ACTION,
    CONSTRAINT FK_historial_estado_nue FOREIGN KEY (estado_nuevo) 
        REFERENCES estados(id_estado) ON DELETE NO ACTION,
    CONSTRAINT FK_historial_usuario FOREIGN KEY (cambiado_por) 
        REFERENCES usuarios(user_id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_historial_tarea ON historial_estados(id_tarea);
CREATE INDEX IX_historial_fecha ON historial_estados(fecha_cambio);
GO

PRINT '✅ Tabla historial_estados creada';
GO

-- =====================================================
-- PASO 10: TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger: Actualizar fecha de modificación en usuarios
IF OBJECT_ID('TR_usuarios_update', 'TR') IS NOT NULL
    DROP TRIGGER TR_usuarios_update;
GO

CREATE TRIGGER TR_usuarios_update
ON usuarios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE usuarios 
    SET updated_at = GETDATE()
    FROM usuarios u
    INNER JOIN inserted i ON u.user_id = i.user_id;
END
GO

PRINT '✅ Trigger TR_usuarios_update creado';
GO

-- Trigger: Actualizar fecha de modificación en tareas
IF OBJECT_ID('TR_tareas_update', 'TR') IS NOT NULL
    DROP TRIGGER TR_tareas_update;
GO

CREATE TRIGGER TR_tareas_update
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

PRINT '✅ Trigger TR_tareas_update creado';
GO

-- Trigger: Registrar cambios de estado automáticamente
IF OBJECT_ID('TR_tareas_cambio_estado', 'TR') IS NOT NULL
    DROP TRIGGER TR_tareas_cambio_estado;
GO

CREATE TRIGGER TR_tareas_cambio_estado
ON tareas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Solo registrar si el estado cambió
    INSERT INTO historial_estados (id_tarea, estado_anterior, estado_nuevo, comentario, cambiado_por)
    SELECT 
        i.id_tarea,
        d.id_estado,
        i.id_estado,
        'Cambio automático de estado: ' + ea.nombre_estado + ' → ' + en.nombre_estado,
        i.creado_por
    FROM inserted i
    INNER JOIN deleted d ON i.id_tarea = d.id_tarea
    LEFT JOIN estados ea ON d.id_estado = ea.id_estado
    LEFT JOIN estados en ON i.id_estado = en.id_estado
    WHERE i.id_estado != d.id_estado;
    
    -- Actualizar fechas según el estado
    UPDATE tareas
    SET 
        fecha_inicio = CASE 
            WHEN i.id_estado = 2 AND (t.fecha_inicio IS NULL) THEN GETDATE() -- En Progreso
            ELSE t.fecha_inicio 
        END,
        fecha_finalizacion = CASE 
            WHEN i.id_estado = 3 AND (t.fecha_finalizacion IS NULL) THEN GETDATE() -- Finalizado
            ELSE t.fecha_finalizacion 
        END
    FROM tareas t
    INNER JOIN inserted i ON t.id_tarea = i.id_tarea
    INNER JOIN deleted d ON i.id_tarea = d.id_tarea
    WHERE i.id_estado != d.id_estado;
END
GO

PRINT '✅ Trigger TR_tareas_cambio_estado creado';
GO

-- =====================================================
-- PASO 11: VISTAS ÚTILES
-- =====================================================

-- Vista: Tareas completas con información relacionada
IF OBJECT_ID('VW_tareas_completas', 'V') IS NOT NULL
    DROP VIEW VW_tareas_completas;
GO

CREATE VIEW VW_tareas_completas AS
SELECT 
    t.id_tarea,
    t.titulo,
    t.descripcion,
    
    -- Estado
    e.codigo_estado,
    e.nombre_estado,
    e.color_hex AS estado_color,
    
    -- Asignación
    t.asignado_a,
    u.nombre AS asignado_nombre_completo,
    u.email AS asignado_email,
    
    -- Fechas
    t.fecha,
    t.fecha_inicio,
    t.fecha_finalizacion,
    t.fecha_creacion,
    t.fecha_actualizacion,
    
    -- Inspección
    t.id_inspeccion,
    i.nombre_tarea AS inspeccion_nombre,
    i.edificio AS inspeccion_edificio,
    i.piso AS inspeccion_piso,
    i.oficina_aula AS inspeccion_oficina,
    i.prioridad AS inspeccion_prioridad,
    
    -- Tiempos y costos
    t.tiempo_estimado_minutos,
    t.tiempo_real_minutos,
    t.costo_estimado,
    t.costo_real,
    t.prioridad,
    
    -- Creador
    uc.nombre AS creador_nombre,
    uc.email AS creador_email,
    
    -- Conteo de imágenes
    (SELECT COUNT(*) FROM imagenes img WHERE img.id_tarea = t.id_tarea) AS total_imagenes
    
FROM tareas t
LEFT JOIN estados e ON t.id_estado = e.id_estado
LEFT JOIN usuarios u ON t.asignado_user_id = u.user_id
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
LEFT JOIN usuarios uc ON t.creado_por = uc.user_id;
GO

PRINT '✅ Vista VW_tareas_completas creada';
GO

-- Vista: Estadísticas por estado
IF OBJECT_ID('VW_estadisticas_estados', 'V') IS NOT NULL
    DROP VIEW VW_estadisticas_estados;
GO

CREATE VIEW VW_estadisticas_estados AS
SELECT 
    e.id_estado,
    e.codigo_estado,
    e.nombre_estado,
    e.color_hex,
    COUNT(t.id_tarea) AS total_tareas,
    ISNULL(AVG(CAST(t.tiempo_real_minutos AS FLOAT)), 0) AS tiempo_promedio_minutos,
    ISNULL(SUM(t.costo_real), 0) AS costo_total,
    SUM(CASE WHEN t.fecha_creacion >= DATEADD(DAY, -7, GETDATE()) THEN 1 ELSE 0 END) AS tareas_ultima_semana,
    SUM(CASE WHEN t.fecha_creacion >= DATEADD(MONTH, -1, GETDATE()) THEN 1 ELSE 0 END) AS tareas_ultimo_mes
FROM estados e
LEFT JOIN tareas t ON e.id_estado = t.id_estado
GROUP BY e.id_estado, e.codigo_estado, e.nombre_estado, e.color_hex, e.orden_display;
GO

PRINT '✅ Vista VW_estadisticas_estados creada';
GO

-- Vista: Dashboard principal (para el frontend)
IF OBJECT_ID('VW_dashboard_principal', 'V') IS NOT NULL
    DROP VIEW VW_dashboard_principal;
GO

CREATE VIEW VW_dashboard_principal AS
SELECT 
    (SELECT COUNT(*) FROM tareas WHERE id_estado = 1) AS total_no_iniciadas,
    (SELECT COUNT(*) FROM tareas WHERE id_estado = 2) AS total_en_progreso,
    (SELECT COUNT(*) FROM tareas WHERE id_estado = 3) AS total_finalizadas,
    (SELECT COUNT(*) FROM tareas WHERE id_estado = 4) AS total_canceladas,
    (SELECT COUNT(*) FROM tareas) AS total_tareas,
    (SELECT COUNT(*) FROM usuarios WHERE is_active = 1) AS total_usuarios_activos,
    (SELECT COUNT(*) FROM inspecciones) AS total_inspecciones,
    (SELECT COUNT(*) FROM imagenes) AS total_imagenes,
    (SELECT ISNULL(SUM(costo_real), 0) FROM tareas WHERE id_estado = 3) AS costo_total_finalizadas,
    (SELECT ISNULL(SUM(tiempo_real_minutos), 0) FROM tareas WHERE id_estado = 3) AS tiempo_total_finalizadas_min;
GO

PRINT '✅ Vista VW_dashboard_principal creada';
GO

-- =====================================================
-- PASO 12: PROCEDIMIENTOS ALMACENADOS
-- =====================================================

-- SP: Crear tarea desde inspección
IF OBJECT_ID('SP_crear_tarea_desde_inspeccion', 'P') IS NOT NULL
    DROP PROCEDURE SP_crear_tarea_desde_inspeccion;
GO

CREATE PROCEDURE SP_crear_tarea_desde_inspeccion
    @titulo NVARCHAR(200),
    @fecha DATE,
    @id_inspeccion INT,
    @asignado_a NVARCHAR(100) = NULL,
    @asignado_user_id UNIQUEIDENTIFIER = NULL,
    @creado_por UNIQUEIDENTIFIER = NULL,
    @inspeccion_data_json NVARCHAR(MAX) = NULL,
    @id_tarea_creada INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id_estado_inicial INT;
    SELECT @id_estado_inicial = id_estado FROM estados WHERE codigo_estado = 'not_started';
    
    INSERT INTO tareas (
        titulo, 
        id_estado, 
        fecha, 
        id_inspeccion, 
        asignado_a, 
        asignado_user_id, 
        creado_por,
        inspeccion_data
    )
    VALUES (
        @titulo,
        @id_estado_inicial,
        @fecha,
        @id_inspeccion,
        @asignado_a,
        @asignado_user_id,
        @creado_por,
        @inspeccion_data_json
    );
    
    SET @id_tarea_creada = SCOPE_IDENTITY();
    
    SELECT @id_tarea_creada AS id_tarea;
END
GO

PRINT '✅ Procedimiento SP_crear_tarea_desde_inspeccion creado';
GO

-- SP: Obtener estadísticas para dashboard
IF OBJECT_ID('SP_obtener_stats_dashboard', 'P') IS NOT NULL
    DROP PROCEDURE SP_obtener_stats_dashboard;
GO

CREATE PROCEDURE SP_obtener_stats_dashboard
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Retornar estadísticas en formato compatible con el endpoint /api/stats
    SELECT 
        e.codigo_estado,
        e.nombre_estado AS label,
        COUNT(t.id_tarea) AS count,
        e.color_hex AS color
    FROM estados e
    LEFT JOIN tareas t ON e.id_estado = t.id_estado
    WHERE e.codigo_estado IN ('not_started', 'in_progress', 'done')
    GROUP BY e.id_estado, e.codigo_estado, e.nombre_estado, e.color_hex, e.orden_display
    ORDER BY e.orden_display;
END
GO

PRINT '✅ Procedimiento SP_obtener_stats_dashboard creado';
GO

-- SP: Autenticar usuario
IF OBJECT_ID('SP_autenticar_usuario', 'P') IS NOT NULL
    DROP PROCEDURE SP_autenticar_usuario;
GO

CREATE PROCEDURE SP_autenticar_usuario
    @email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        user_id,
        email,
        password_hash,
        nombre,
        rol,
        is_active,
        failed_login_count,
        lockout_until
    FROM usuarios
    WHERE email = LOWER(@email);
    
    -- Actualizar último acceso
    UPDATE usuarios 
    SET ultimo_acceso = GETDATE()
    WHERE email = LOWER(@email);
END
GO

PRINT '✅ Procedimiento SP_autenticar_usuario creado';
GO

-- SP: Registrar intento fallido de login
IF OBJECT_ID('SP_registrar_login_fallido', 'P') IS NOT NULL
    DROP PROCEDURE SP_registrar_login_fallido;
GO

CREATE PROCEDURE SP_registrar_login_fallido
    @email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @failed_count INT;
    DECLARE @lockout_minutes INT = 15;
    
    UPDATE usuarios
    SET 
        failed_login_count = failed_login_count + 1,
        last_failed_at = GETDATE(),
        lockout_until = CASE 
            WHEN failed_login_count + 1 >= 5 THEN DATEADD(MINUTE, @lockout_minutes, GETDATE())
            ELSE lockout_until
        END,
        updated_at = GETDATE()
    WHERE email = LOWER(@email);
    
    SELECT 
        failed_login_count,
        lockout_until
    FROM usuarios
    WHERE email = LOWER(@email);
END
GO

PRINT '✅ Procedimiento SP_registrar_login_fallido creado';
GO

-- SP: Limpiar intentos fallidos tras login exitoso
IF OBJECT_ID('SP_limpiar_login_fallidos', 'P') IS NOT NULL
    DROP PROCEDURE SP_limpiar_login_fallidos;
GO

CREATE PROCEDURE SP_limpiar_login_fallidos
    @email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE usuarios
    SET 
        failed_login_count = 0,
        lockout_until = NULL,
        ultimo_acceso = GETDATE(),
        updated_at = GETDATE()
    WHERE email = LOWER(@email);
END
GO

PRINT '✅ Procedimiento SP_limpiar_login_fallidos creado';
GO

-- SP: Obtener todas las tareas (para /api/tasks)
IF OBJECT_ID('SP_obtener_todas_tareas', 'P') IS NOT NULL
    DROP PROCEDURE SP_obtener_todas_tareas;
GO

CREATE PROCEDURE SP_obtener_todas_tareas
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.id_tarea AS id,
        t.titulo AS title,
        e.codigo_estado AS status,
        t.asignado_a AS assignedTo,
        t.asignado_user_id AS assignedUserId,
        CONVERT(VARCHAR(10), t.fecha, 120) AS date,
        t.inspeccion_data AS inspection,
        t.fecha_actualizacion AS updatedAt,
        t.actualizado_por AS updatedBy
    FROM tareas t
    LEFT JOIN estados e ON t.id_estado = e.id_estado
    ORDER BY t.fecha_creacion DESC;
END
GO

PRINT '✅ Procedimiento SP_obtener_todas_tareas creado';
GO

-- SP: Actualizar tarea
IF OBJECT_ID('SP_actualizar_tarea', 'P') IS NOT NULL
    DROP PROCEDURE SP_actualizar_tarea;
GO

CREATE PROCEDURE SP_actualizar_tarea
    @id_tarea INT,
    @status NVARCHAR(20) = NULL,
    @assignedTo NVARCHAR(100) = NULL,
    @assignedUserId UNIQUEIDENTIFIER = NULL,
    @updatedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id_estado INT;
    
    IF @status IS NOT NULL
    BEGIN
        SELECT @id_estado = id_estado FROM estados WHERE codigo_estado = @status;
    END
    
    UPDATE tareas
    SET 
        id_estado = ISNULL(@id_estado, id_estado),
        asignado_a = ISNULL(@assignedTo, asignado_a),
        asignado_user_id = CASE WHEN @assignedUserId IS NOT NULL THEN @assignedUserId ELSE asignado_user_id END,
        actualizado_por = ISNULL(@updatedBy, actualizado_por),
        fecha_actualizacion = GETDATE()
    WHERE id_tarea = @id_tarea;
    
    -- Retornar tarea actualizada
    EXEC SP_obtener_tarea_por_id @id_tarea;
END
GO

PRINT '✅ Procedimiento SP_actualizar_tarea creado';
GO

-- SP: Obtener tarea por ID
IF OBJECT_ID('SP_obtener_tarea_por_id', 'P') IS NOT NULL
    DROP PROCEDURE SP_obtener_tarea_por_id;
GO

CREATE PROCEDURE SP_obtener_tarea_por_id
    @id_tarea INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.id_tarea AS id,
        t.titulo AS title,
        e.codigo_estado AS status,
        t.asignado_a AS assignedTo,
        t.asignado_user_id AS assignedUserId,
        CONVERT(VARCHAR(10), t.fecha, 120) AS date,
        t.inspeccion_data AS inspection,
        t.fecha_actualizacion AS updatedAt,
        t.actualizado_por AS updatedBy
    FROM tareas t
    LEFT JOIN estados e ON t.id_estado = e.id_estado
    WHERE t.id_tarea = @id_tarea;
    
    -- También retornar imágenes asociadas
    SELECT 
        id_imagen,
        nombre_archivo AS name,
        tipo_mime AS type,
        data_base64 AS data
    FROM imagenes
    WHERE id_tarea = @id_tarea;
END
GO

PRINT '✅ Procedimiento SP_obtener_tarea_por_id creado';
GO

-- =====================================================
-- PASO 13: DATOS DE EJEMPLO (COMPATIBLES CON EL SISTEMA)
-- =====================================================

PRINT '';
PRINT '📊 Insertando datos de ejemplo...';
GO

-- Usuario Demo (compatible con el código actual)
INSERT INTO usuarios (user_id, email, password_hash, nombre, rol, is_active)
VALUES (
    NEWID(),
    'demo@empresa.com',
    -- Hash de bcrypt para 'Demo1234!' (deberás usar el hash real del servidor)
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K',
    'Usuario Demo',
    'admin',
    1
);

-- Más usuarios de ejemplo
INSERT INTO usuarios (user_id, email, password_hash, nombre, rol, is_active) VALUES
(NEWID(), 'juan.perez@empresa.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 'Juan Pérez', 'tecnico', 1),
(NEWID(), 'maria.gonzalez@empresa.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 'María González', 'tecnico', 1),
(NEWID(), 'carlos.rodriguez@empresa.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 'Carlos Rodríguez', 'supervisor', 1),
(NEWID(), 'ana.martinez@empresa.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 'Ana Martínez', 'tecnico', 1),
(NEWID(), 'luis.fernandez@empresa.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 'Luis Fernández', 'usuario', 1);

PRINT '✅ Usuarios de ejemplo creados (password: Demo1234!)';
GO

-- Ubicaciones de ejemplo
INSERT INTO ubicaciones (edificio, piso, oficina_aula, codigo_ubicacion) VALUES
('Edificio A', 'PB', 'Oficina 101', 'A-PB-101'),
('Edificio A', '1', 'Oficina 201', 'A-1-201'),
('Edificio A', '2', 'Sala de Reuniones', 'A-2-SR'),
('Edificio B', 'PB', 'Recepción', 'B-PB-REC'),
('Edificio B', '1', 'Aula 301', 'B-1-301'),
('Edificio C', 'PB', 'Almacén', 'C-PB-ALM');

PRINT '✅ Ubicaciones de ejemplo creadas';
GO

-- Inspecciones de ejemplo
INSERT INTO inspecciones (nombre_tarea, edificio, piso, oficina_aula, prioridad, datos_completos, creado_por) VALUES
(
    'Inspección eléctrica completa',
    'Edificio A',
    'PB',
    'Oficina 101',
    'alta',
    '{"electricidad":{"iluminacion_ubicacion":"interna","iluminacion_bombillo":"LED","iluminacion_watts":12,"tomacorriente_tipo":"doble","tomacorriente_voltaje":"110v"},"prioridad":{"prioridad_tarea":"alta"}}',
    (SELECT TOP 1 user_id FROM usuarios WHERE email = 'demo@empresa.com')
),
(
    'Mantenimiento aire acondicionado',
    'Edificio B',
    '1',
    'Aula 301',
    'media',
    '{"aire_acondicionado":{"ac_tipo":"mini split","ac_btu":12000,"ac_gas":"R410A","ac_filtros_limpios":"no"},"prioridad":{"prioridad_tarea":"media"}}',
    (SELECT TOP 1 user_id FROM usuarios WHERE email = 'demo@empresa.com')
);

PRINT '✅ Inspecciones de ejemplo creadas';
GO

-- Tareas de ejemplo (compatibles con el sistema actual)
DECLARE @estado_done INT, @estado_progress INT, @estado_not_started INT;
DECLARE @user_juan UNIQUEIDENTIFIER, @user_maria UNIQUEIDENTIFIER, @user_carlos UNIQUEIDENTIFIER;

SELECT @estado_done = id_estado FROM estados WHERE codigo_estado = 'done';
SELECT @estado_progress = id_estado FROM estados WHERE codigo_estado = 'in_progress';
SELECT @estado_not_started = id_estado FROM estados WHERE codigo_estado = 'not_started';

SELECT @user_juan = user_id FROM usuarios WHERE email = 'juan.perez@empresa.com';
SELECT @user_maria = user_id FROM usuarios WHERE email = 'maria.gonzalez@empresa.com';
SELECT @user_carlos = user_id FROM usuarios WHERE email = 'carlos.rodriguez@empresa.com';

INSERT INTO tareas (titulo, id_estado, asignado_a, asignado_user_id, fecha, prioridad, creado_por) VALUES
('Revisar filtro A', @estado_done, 'Juan', @user_juan, '2025-10-01', 'media', (SELECT TOP 1 user_id FROM usuarios WHERE email = 'demo@empresa.com')),
('Lubricar motor B', @estado_progress, 'María', @user_maria, '2025-10-03', 'alta', (SELECT TOP 1 user_id FROM usuarios WHERE email = 'demo@empresa.com')),
('Inspección generador', @estado_not_started, 'Luis', NULL, '2025-10-06', 'media', (SELECT TOP 1 user_id FROM usuarios WHERE email = 'demo@empresa.com')),
('Reemplazar correa', @estado_done, 'Ana', NULL, '2025-10-07', 'baja', (SELECT TOP 1 user_id FROM usuarios WHERE email = 'demo@empresa.com')),
('Verificar sistema eléctrico', @estado_progress, 'Carlos', @user_carlos, '2025-10-08', 'alta', (SELECT TOP 1 user_id FROM usuarios WHERE email = 'demo@empresa.com'));

PRINT '✅ Tareas de ejemplo creadas';
GO

-- =====================================================
-- PASO 14: FUNCIONES AUXILIARES
-- =====================================================

-- Función: Obtener tareas por usuario
IF OBJECT_ID('FN_tareas_por_usuario', 'IF') IS NOT NULL
    DROP FUNCTION FN_tareas_por_usuario;
GO

CREATE FUNCTION FN_tareas_por_usuario(@user_id UNIQUEIDENTIFIER)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        t.id_tarea,
        t.titulo,
        e.nombre_estado,
        t.fecha,
        t.prioridad
    FROM tareas t
    LEFT JOIN estados e ON t.id_estado = e.id_estado
    WHERE t.asignado_user_id = @user_id
);
GO

PRINT '✅ Función FN_tareas_por_usuario creada';
GO

-- =====================================================
-- PASO 15: VERIFICACIÓN Y REPORTE FINAL
-- =====================================================

PRINT '';
PRINT '========================================';
PRINT '✅ BASE DE DATOS CREADA EXITOSAMENTE';
PRINT '========================================';
PRINT '';

-- Contar objetos creados
DECLARE @total_tables INT, @total_views INT, @total_procs INT, @total_triggers INT;

SELECT @total_tables = COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
SELECT @total_views = COUNT(*) FROM INFORMATION_SCHEMA.VIEWS;
SELECT @total_procs = COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE';
SELECT @total_triggers = COUNT(*) FROM sys.triggers WHERE parent_class = 1;

PRINT '📊 RESUMEN:';
PRINT '  - Tablas creadas: ' + CAST(@total_tables AS NVARCHAR(10));
PRINT '  - Vistas creadas: ' + CAST(@total_views AS NVARCHAR(10));
PRINT '  - Procedimientos almacenados: ' + CAST(@total_procs AS NVARCHAR(10));
PRINT '  - Triggers: ' + CAST(@total_triggers AS NVARCHAR(10));
PRINT '';

-- Datos de ejemplo
SELECT @total_tables = COUNT(*) FROM usuarios;
PRINT '  - Usuarios: ' + CAST(@total_tables AS NVARCHAR(10));

SELECT @total_tables = COUNT(*) FROM tareas;
PRINT '  - Tareas: ' + CAST(@total_tables AS NVARCHAR(10));

SELECT @total_tables = COUNT(*) FROM inspecciones;
PRINT '  - Inspecciones: ' + CAST(@total_tables AS NVARCHAR(10));

SELECT @total_tables = COUNT(*) FROM ubicaciones;
PRINT '  - Ubicaciones: ' + CAST(@total_tables AS NVARCHAR(10));

PRINT '';
PRINT '🔐 CREDENCIALES DE ACCESO:';
PRINT '  Email: demo@empresa.com';
PRINT '  Password: Demo1234!';
PRINT '';
PRINT '📝 PRÓXIMOS PASOS:';
PRINT '  1. Instalar el driver de SQL Server para Node.js:';
PRINT '     npm install mssql';
PRINT '  2. Configurar la conexión en tu archivo server.js';
PRINT '  3. Importar y usar los procedimientos almacenados';
PRINT '';
PRINT '========================================';
GO

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

