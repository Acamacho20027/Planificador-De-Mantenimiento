-- =====================================================
-- PLANIFICADOR DE MANTENIMIENTO - BASE DE DATOS COMPLETA
-- Compatible con SQL SERVER MANAGEMENT STUDIO
-- Versión: 2.0 - Estructura Corregida
-- =====================================================

-- =====================================================
-- CREAR BASE DE DATOS
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

-- =====================================================
-- TABLA: ROLES
-- =====================================================
IF OBJECT_ID('roles', 'U') IS NOT NULL
    DROP TABLE roles;
GO

CREATE TABLE roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(200),
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);
GO

-- Insertar roles predefinidos
INSERT INTO roles (nombre_rol, descripcion) VALUES
('Administrador', 'Usuario con acceso completo al sistema'),
('Usuario', 'Usuario estándar con permisos limitados');
GO

PRINT '✅ Tabla roles creada con datos iniciales';
GO

-- =====================================================
-- TABLA: USUARIOS
-- =====================================================
IF OBJECT_ID('usuarios', 'U') IS NOT NULL
    DROP TABLE usuarios;
GO

CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    numero_telefono NVARCHAR(20),
    password_hash NVARCHAR(255) NOT NULL,
    id_rol INT NOT NULL DEFAULT 2, -- Por defecto: Usuario
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    ultimo_acceso DATETIME2 NULL,
    
    CONSTRAINT FK_usuarios_rol FOREIGN KEY (id_rol) 
        REFERENCES roles(id_rol) ON DELETE NO ACTION
);
GO

CREATE INDEX IX_usuarios_email ON usuarios(email);
CREATE INDEX IX_usuarios_rol ON usuarios(id_rol);
GO

PRINT '✅ Tabla usuarios creada';
GO

-- =====================================================
-- TABLA: INSPECCIONES
-- =====================================================
IF OBJECT_ID('inspecciones', 'U') IS NOT NULL
    DROP TABLE inspecciones;
GO

CREATE TABLE inspecciones (
    id_inspeccion INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Información básica
    nombre_inspeccion NVARCHAR(200) NOT NULL,
    tipo_inspeccion NVARCHAR(100) NOT NULL,
    edificio NVARCHAR(100),
    piso NVARCHAR(50),
    ubicacion NVARCHAR(200),
    
    -- ==========================================
    -- CUBIERTA DE TECHOS - LÁMINA
    -- ==========================================
    lamina_tipo NVARCHAR(50), -- ondulada/rectangular
    lamina_color NVARCHAR(50),
    lamina_medida NVARCHAR(20), -- 3,66/2,84/1,83
    
    -- ==========================================
    -- HOJALATERÍA - CUMBRERA
    -- ==========================================
    cumbrera_descripcion_lamina NVARCHAR(50), -- galvanizada/esmaltada
    cumbrera_medida_ml DECIMAL(10,2),
    cumbrera_desarrollo_pulgadas DECIMAL(10,2),
    cumbrera_color NVARCHAR(50), -- galvanizado, blanco, rojo oxido, rojo teja, verde, azul
    cumbrera_tipo_tornillo NVARCHAR(50), -- punta fina/punta broca
    cumbrera_descripcion_tornillo NVARCHAR(100),
    cumbrera_medida_tornillo NVARCHAR(20), -- 1 pulgada
    cumbrera_color_tornillo NVARCHAR(50),
    
    -- ==========================================
    -- HOJALATERÍA - BOTA AGUAS
    -- ==========================================
    bota_aguas_descripcion_lamina NVARCHAR(50), -- galvanizada/esmaltada
    bota_aguas_color NVARCHAR(50),
    bota_aguas_calibre NVARCHAR(20),
    bota_aguas_estilo NVARCHAR(50), -- pared+techo / techo+pared
    bota_aguas_medida_ml DECIMAL(10,2),
    bota_aguas_desarrollo_pulgadas DECIMAL(10,2),
    bota_aguas_tipo_tornillo NVARCHAR(50),
    bota_aguas_descripcion_tornillo NVARCHAR(100),
    bota_aguas_medida_tornillo NVARCHAR(20),
    
    -- ==========================================
    -- TORNILLERÍA
    -- ==========================================
    tornilleria_tipo NVARCHAR(50), -- punta broca, punta fina
    tornilleria_descripcion NVARCHAR(100),
    tornilleria_medida NVARCHAR(20), -- 1, 2, 3 pulgadas
    
    -- ==========================================
    -- CANOAS
    -- ==========================================
    canoas_tipo NVARCHAR(50), -- pecho de paloma, Pachuca, otro
    canoas_tipo_otro NVARCHAR(100),
    canoas_descripcion NVARCHAR(100),
    canoas_cantidad_arizos INT,
    canoas_boquilla_diametro NVARCHAR(20),
    canoas_boquilla_cantidad INT,
    canoas_boquilla_descripcion NVARCHAR(100),
    
    -- ==========================================
    -- BAJANTE
    -- ==========================================
    bajante_tipo NVARCHAR(50), -- rectangular, cuadrado, redondo
    bajante_material NVARCHAR(100),
    bajante_medida_ml DECIMAL(10,2),
    
    -- ==========================================
    -- ELECTRICIDAD - ILUMINACIÓN
    -- ==========================================
    iluminacion_ubicacion NVARCHAR(50), -- interna/externa
    iluminacion_bombillo NVARCHAR(50), -- LED/fluorescente
    iluminacion_tipo_luz NVARCHAR(50), -- luz blanca/luz cálida
    iluminacion_watts INT,
    iluminacion_apagador_marca NVARCHAR(50),
    iluminacion_apagador_tipo NVARCHAR(50), -- sencillo/doble/triple
    
    -- ==========================================
    -- ELECTRICIDAD - TOMACORRIENTE
    -- ==========================================
    tomacorriente_tipo NVARCHAR(50), -- sencillo/doble
    tomacorriente_voltaje NVARCHAR(20), -- 110v/220v
    tomacorriente_polarizado BIT,
    tomacorriente_ubicacion NVARCHAR(50), -- interno/externo
    tomacorriente_seguridad NVARCHAR(50), -- GFCI/AFCI
    
    -- ==========================================
    -- ELECTRICIDAD - CENTROS DE CARGA
    -- ==========================================
    centro_carga_marca NVARCHAR(50),
    centro_carga_cantidad_circuitos INT,
    centro_carga_breaker_tipo NVARCHAR(50), -- sencillo/doble
    centro_carga_breaker_amperaje INT,
    
    -- ==========================================
    -- GENERADOR ELÉCTRICO
    -- ==========================================
    generador_marca NVARCHAR(50),
    generador_tipo_combustible NVARCHAR(50), -- diésel, gasolina, gas LP
    generador_transferencia_auto NVARCHAR(100),
    generador_kilowatts DECIMAL(10,2),
    
    -- ==========================================
    -- SUPRESOR DE PICOS
    -- ==========================================
    supresor_marca NVARCHAR(50),
    supresor_voltaje NVARCHAR(20),
    
    -- ==========================================
    -- PUERTAS
    -- ==========================================
    puerta_tipo NVARCHAR(50), -- madera/metal/MDF/otro
    puerta_tipo_otro NVARCHAR(100),
    puerta_tipo_bisagra NVARCHAR(50), -- convencional/cartucho/pivote
    puerta_tipo_llavin NVARCHAR(100),
    puerta_brazo_hidraulico NVARCHAR(100),
    
    -- ==========================================
    -- PISOS
    -- ==========================================
    piso_tipo_material NVARCHAR(100), -- cerámica/porcelanato/PVC/laminado/alfombra/madera/vinílico/otro
    piso_tipo_material_otro NVARCHAR(100),
    piso_enchapes NVARCHAR(100), -- azulejo/porcelanato/lámina PVC/mármol/cuarzo/granito/otro
    piso_enchapes_otro NVARCHAR(100),
    
    -- ==========================================
    -- PINTURA
    -- ==========================================
    pintura_paredes NVARCHAR(50), -- Block/gipsun/Durock
    pintura_tipo NVARCHAR(50), -- interior/exterior
    pintura_categoria NVARCHAR(100), -- aceite/acrílica/epóxica/texturada/impermeabilizante/otro
    pintura_acabado NVARCHAR(50), -- mate/satinada
    pintura_impermeabilizante_tipo NVARCHAR(100),
    pintura_otro NVARCHAR(100),
    
    -- ==========================================
    -- BOMBAS DE AGUA
    -- ==========================================
    bomba_tipo NVARCHAR(100), -- centrífuga/sumergible/periférica/presurizadora/de pozo profundo
    bomba_potencia NVARCHAR(20),
    bomba_material_cuerpo NVARCHAR(100),
    bomba_estado_sello NVARCHAR(100),
    bomba_estado_motor NVARCHAR(200),
    bomba_presion_salida NVARCHAR(50),
    bomba_fugas_visibles BIT,
    bomba_limpieza_filtro BIT,
    bomba_control_nivel_auto BIT,
    
    -- ==========================================
    -- AIRE ACONDICIONADO
    -- ==========================================
    ac_tipo NVARCHAR(50), -- mini split/cassette/piso-techo/ventana/central
    ac_capacidad_btu INT,
    ac_gas_refrigerante NVARCHAR(50), -- R410A/R22/R32/otro
    ac_limpieza_filtros BIT,
    ac_limpieza_serpentines BIT,
    ac_nivel_gas NVARCHAR(100),
    ac_estado_drenaje NVARCHAR(100),
    ac_estado_control_remoto NVARCHAR(100),
    ac_ruido_vibracion NVARCHAR(200),
    ac_consumo_electrico NVARCHAR(100),
    
    -- ==========================================
    -- VENTANAS
    -- ==========================================
    ventana_tipo NVARCHAR(50), -- corrediza/abatible/fija/proyectable/celosía
    ventana_material NVARCHAR(100), -- aluminio/PVC/madera/vidrio templado
    ventana_estado_rieles NVARCHAR(100),
    ventana_estado_sello NVARCHAR(100),
    ventana_vidrio_roto BIT,
    ventana_mecanismo_funcional BIT,
    ventana_estado_pintura NVARCHAR(100),
    
    -- ==========================================
    -- BARANDAS
    -- ==========================================
    baranda_material NVARCHAR(100), -- hierro/acero inoxidable/aluminio/vidrio/madera
    baranda_altura_conforme BIT,
    baranda_estado_soldaduras NVARCHAR(100),
    baranda_oxidacion BIT,
    baranda_puntos_flojos BIT,
    baranda_estado_pintura NVARCHAR(100),
    baranda_seguridad_estructural NVARCHAR(100),
    
    -- ==========================================
    -- HIDRO LAVADOS
    -- ==========================================
    hidrolavado_superficie NVARCHAR(100), -- paredes/pisos/techos/aceras/vehículos/maquinaria
    hidrolavado_presion_psi INT,
    hidrolavado_uso_detergente BIT,
    hidrolavado_estado_boquilla NVARCHAR(100),
    hidrolavado_resultado NVARCHAR(200),
    hidrolavado_seguridad_area NVARCHAR(200),
    
    -- ==========================================
    -- TELEFONÍA
    -- ==========================================
    telefonia_tipo_linea NVARCHAR(50), -- análoga/digital/IP
    telefonia_estado_tomas NVARCHAR(100),
    telefonia_nivel_tono NVARCHAR(100),
    telefonia_ruido_interferencia NVARCHAR(200),
    telefonia_identificacion_ext NVARCHAR(200),
    telefonia_estado_cableado NVARCHAR(100),
    telefonia_estado_conmutador NVARCHAR(100),
    
    -- ==========================================
    -- DATOS
    -- ==========================================
    datos_tipo_red NVARCHAR(50), -- cableada/inalámbrica
    datos_velocidad_mbps INT,
    datos_estado_puertos NVARCHAR(100),
    datos_identificacion_puntos NVARCHAR(200),
    datos_cableado_categoria NVARCHAR(50), -- cat 5e, 6, 6A
    datos_estado_patch_panel NVARCHAR(100),
    datos_perdida_señal NVARCHAR(200),
    datos_etiquetado NVARCHAR(100),
    
    -- ==========================================
    -- ESTRUCTURAS DE METAL
    -- ==========================================
    estructura_tipo NVARCHAR(100), -- viga/columna/cercha/soporte/marco
    estructura_material NVARCHAR(100), -- acero galvanizado/inoxidable/pintado
    estructura_medida_m DECIMAL(10,2),
    estructura_estado_soldaduras NVARCHAR(100),
    estructura_oxidacion BIT,
    estructura_fijacion_firme BIT,
    estructura_pintura_protectora BIT,
    estructura_deformaciones NVARCHAR(200),
    
    -- ==========================================
    -- SISTEMAS CONTRA INCENDIOS
    -- ==========================================
    incendio_tipo_sistema NVARCHAR(100), -- rociadores/gabinetes/extintores/hidrantes/alarma/detectores
    incendio_fecha_ultima_inspeccion DATE,
    incendio_presion_sistema NVARCHAR(50),
    incendio_estado_valvulas NVARCHAR(100),
    incendio_fecha_recarga_extintores DATE,
    incendio_funcionamiento_alarmas BIT,
    incendio_señalizacion_visible BIT,
    
    -- ==========================================
    -- PLANTA ELÉCTRICA
    -- ==========================================
    planta_combustible NVARCHAR(50), -- diésel/gasolina/gas LP
    planta_potencia_kw DECIMAL(10,2),
    planta_nivel_combustible NVARCHAR(50),
    planta_nivel_aceite NVARCHAR(100),
    planta_prueba_arranque BIT,
    planta_estado_baterias NVARCHAR(100),
    planta_tiempo_operacion NVARCHAR(100),
    planta_mantenimiento_vigente BIT,
    
    -- ==========================================
    -- MOTORES DE PORTONES
    -- ==========================================
    motor_porton_tipo NVARCHAR(50), -- corredizo/abatible/enrollable
    motor_porton_voltaje NVARCHAR(20), -- 110V/220V
    motor_porton_estado_riel NVARCHAR(100),
    motor_porton_fotorresistencias BIT,
    motor_porton_control_remoto BIT,
    motor_porton_finales_carrera BIT,
    motor_porton_ruido BIT,
    motor_porton_engrase BIT,
    
    -- ==========================================
    -- ACERAS
    -- ==========================================
    acera_material NVARCHAR(100), -- concreto/adoquín/piedra/cerámica
    acera_nivelacion NVARCHAR(100),
    acera_grietas BIT,
    acera_bordes_estado NVARCHAR(100),
    acera_limpieza_necesaria BIT,
    acera_accesibilidad NVARCHAR(200),
    
    -- ==========================================
    -- CORDÓN + CAÑO
    -- ==========================================
    cordon_tipo NVARCHAR(100), -- concreto/prefabricado/piedra
    cordon_obstrucciones BIT,
    cordon_flujo_agua BIT,
    cordon_grietas BIT,
    cordon_desnivel BIT,
    cordon_desague_correcto BIT,
    cordon_señalizacion NVARCHAR(100),
    
    -- ==========================================
    -- CÁMARAS DE SEGURIDAD
    -- ==========================================
    camara_tipo NVARCHAR(50), -- analógica/IP/PTZ/domo/bala
    camara_resolucion_mp DECIMAL(5,2),
    camara_estado_lente NVARCHAR(100),
    camara_alimentacion_estable BIT,
    camara_conectividad NVARCHAR(50), -- cable/Wi-Fi
    camara_grabacion_funcional BIT,
    camara_estado_dvr NVARCHAR(100),
    camara_angulo_cobertura BIT,
    
    -- ==========================================
    -- CAMPOS GENERALES
    -- ==========================================
    observaciones NVARCHAR(MAX),
    recomendaciones NVARCHAR(MAX),
    
    -- Auditoría
    creado_por INT,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_inspecciones_usuario FOREIGN KEY (creado_por) 
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
GO

CREATE INDEX IX_inspecciones_tipo ON inspecciones(tipo_inspeccion);
CREATE INDEX IX_inspecciones_fecha ON inspecciones(fecha_creacion);
GO

PRINT '✅ Tabla inspecciones creada con todos los campos detallados';
GO

-- =====================================================
-- TABLA: IMÁGENES (Relacionada con Inspecciones)
-- =====================================================
IF OBJECT_ID('imagenes_inspeccion', 'U') IS NOT NULL
    DROP TABLE imagenes_inspeccion;
GO

CREATE TABLE imagenes_inspeccion (
    id_imagen INT IDENTITY(1,1) PRIMARY KEY,
    id_inspeccion INT NOT NULL,
    nombre_archivo NVARCHAR(255) NOT NULL,
    tipo_mime NVARCHAR(100) NOT NULL,
    data_base64 NVARCHAR(MAX) NOT NULL,
    tamaño_bytes INT,
    descripcion NVARCHAR(500),
    subido_por INT,
    fecha_subida DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_imagenes_inspeccion FOREIGN KEY (id_inspeccion) 
        REFERENCES inspecciones(id_inspeccion) ON DELETE CASCADE,
    CONSTRAINT FK_imagenes_usuario FOREIGN KEY (subido_por) 
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
GO

CREATE INDEX IX_imagenes_inspeccion ON imagenes_inspeccion(id_inspeccion);
GO

PRINT '✅ Tabla imagenes_inspeccion creada';
GO

-- =====================================================
-- TABLA: TAREAS
-- =====================================================
IF OBJECT_ID('tareas', 'U') IS NOT NULL
    DROP TABLE tareas;
GO

CREATE TABLE tareas (
    id_tarea INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    estado NVARCHAR(20) NOT NULL CHECK (estado IN ('No Iniciado', 'En Proceso', 'Finalizado')),
    asignado_a NVARCHAR(100),
    fecha DATE NOT NULL,
    prioridad NVARCHAR(20) NOT NULL CHECK (prioridad IN ('Baja', 'Media', 'Alta')),
    descripcion NVARCHAR(MAX),
    
    -- Relación opcional con inspección
    id_inspeccion INT NULL,
    
    -- Auditoría
    creado_por INT,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_tareas_inspeccion FOREIGN KEY (id_inspeccion) 
        REFERENCES inspecciones(id_inspeccion) ON DELETE SET NULL,
    CONSTRAINT FK_tareas_creador FOREIGN KEY (creado_por) 
        REFERENCES usuarios(id_usuario) ON DELETE NO ACTION
);
GO

CREATE INDEX IX_tareas_estado ON tareas(estado);
CREATE INDEX IX_tareas_fecha ON tareas(fecha);
CREATE INDEX IX_tareas_prioridad ON tareas(prioridad);
GO

PRINT '✅ Tabla tareas creada';
GO

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
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
    SET fecha_actualizacion = GETDATE()
    FROM usuarios u
    INNER JOIN inserted i ON u.id_usuario = i.id_usuario;
END
GO

PRINT '✅ Trigger TR_usuarios_update creado';
GO

-- Trigger: Actualizar fecha de modificación en inspecciones
IF OBJECT_ID('TR_inspecciones_update', 'TR') IS NOT NULL
    DROP TRIGGER TR_inspecciones_update;
GO

CREATE TRIGGER TR_inspecciones_update
ON inspecciones
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE inspecciones 
    SET fecha_actualizacion = GETDATE()
    FROM inspecciones i
    INNER JOIN inserted ins ON i.id_inspeccion = ins.id_inspeccion;
END
GO

PRINT '✅ Trigger TR_inspecciones_update creado';
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

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Tareas completas con información relacionada
IF OBJECT_ID('VW_tareas_completas', 'V') IS NOT NULL
    DROP VIEW VW_tareas_completas;
GO

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
    
    -- Auditoría
    u.nombre AS creado_por_nombre,
    u.email AS creado_por_email,
    t.fecha_creacion,
    t.fecha_actualizacion,
    
    -- Conteo de imágenes de la inspección
    (SELECT COUNT(*) FROM imagenes_inspeccion img WHERE img.id_inspeccion = t.id_inspeccion) AS total_imagenes
    
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
LEFT JOIN usuarios u ON t.creado_por = u.id_usuario;
GO

PRINT '✅ Vista VW_tareas_completas creada';
GO

-- Vista: Estadísticas por estado
IF OBJECT_ID('VW_estadisticas_tareas', 'V') IS NOT NULL
    DROP VIEW VW_estadisticas_tareas;
GO

CREATE VIEW VW_estadisticas_tareas AS
SELECT 
    estado,
    COUNT(*) AS total_tareas,
    SUM(CASE WHEN prioridad = 'Alta' THEN 1 ELSE 0 END) AS tareas_alta_prioridad,
    SUM(CASE WHEN prioridad = 'Media' THEN 1 ELSE 0 END) AS tareas_media_prioridad,
    SUM(CASE WHEN prioridad = 'Baja' THEN 1 ELSE 0 END) AS tareas_baja_prioridad
FROM tareas
GROUP BY estado;
GO

PRINT '✅ Vista VW_estadisticas_tareas creada';
GO

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

-- SP: Crear inspección completa
IF OBJECT_ID('SP_crear_inspeccion', 'P') IS NOT NULL
    DROP PROCEDURE SP_crear_inspeccion;
GO

CREATE PROCEDURE SP_crear_inspeccion
    @nombre_inspeccion NVARCHAR(200),
    @tipo_inspeccion NVARCHAR(100),
    @creado_por INT,
    @id_inspeccion_nueva INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO inspecciones (nombre_inspeccion, tipo_inspeccion, creado_por)
    VALUES (@nombre_inspeccion, @tipo_inspeccion, @creado_por);
    
    SET @id_inspeccion_nueva = SCOPE_IDENTITY();
    
    SELECT @id_inspeccion_nueva AS id_inspeccion;
END
GO

PRINT '✅ Procedimiento SP_crear_inspeccion creado';
GO

-- SP: Crear tarea
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
    @creado_por INT = NULL,
    @id_tarea_nueva INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, descripcion, id_inspeccion, creado_por)
    VALUES (@titulo, @estado, @asignado_a, @fecha, @prioridad, @descripcion, @id_inspeccion, @creado_por);
    
    SET @id_tarea_nueva = SCOPE_IDENTITY();
    
    SELECT @id_tarea_nueva AS id_tarea;
END
GO

PRINT '✅ Procedimiento SP_crear_tarea creado';
GO

-- SP: Actualizar tarea
IF OBJECT_ID('SP_actualizar_tarea', 'P') IS NOT NULL
    DROP PROCEDURE SP_actualizar_tarea;
GO

CREATE PROCEDURE SP_actualizar_tarea
    @id_tarea INT,
    @titulo NVARCHAR(200) = NULL,
    @estado NVARCHAR(20) = NULL,
    @asignado_a NVARCHAR(100) = NULL,
    @fecha DATE = NULL,
    @prioridad NVARCHAR(20) = NULL,
    @descripcion NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE tareas
    SET 
        titulo = ISNULL(@titulo, titulo),
        estado = ISNULL(@estado, estado),
        asignado_a = ISNULL(@asignado_a, asignado_a),
        fecha = ISNULL(@fecha, fecha),
        prioridad = ISNULL(@prioridad, prioridad),
        descripcion = ISNULL(@descripcion, descripcion),
        fecha_actualizacion = GETDATE()
    WHERE id_tarea = @id_tarea;
    
    -- Retornar tarea actualizada
    SELECT * FROM VW_tareas_completas WHERE id_tarea = @id_tarea;
END
GO

PRINT '✅ Procedimiento SP_actualizar_tarea creado';
GO

-- SP: Obtener todas las tareas
IF OBJECT_ID('SP_obtener_tareas', 'P') IS NOT NULL
    DROP PROCEDURE SP_obtener_tareas;
GO

CREATE PROCEDURE SP_obtener_tareas
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM VW_tareas_completas
    ORDER BY 
        CASE estado 
            WHEN 'En Proceso' THEN 1 
            WHEN 'No Iniciado' THEN 2 
            WHEN 'Finalizado' THEN 3 
        END,
        CASE prioridad 
            WHEN 'Alta' THEN 1 
            WHEN 'Media' THEN 2 
            WHEN 'Baja' THEN 3 
        END,
        fecha ASC;
END
GO

PRINT '✅ Procedimiento SP_obtener_tareas creado';
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
        u.id_usuario,
        u.nombre,
        u.email,
        u.numero_telefono,
        u.password_hash,
        r.nombre_rol AS rol,
        u.activo
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.email = LOWER(@email) AND u.activo = 1;
    
    -- Actualizar último acceso
    UPDATE usuarios 
    SET ultimo_acceso = GETDATE()
    WHERE email = LOWER(@email);
END
GO

PRINT '✅ Procedimiento SP_autenticar_usuario creado';
GO

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

PRINT '';
PRINT '📊 Insertando datos de ejemplo...';
GO

-- Usuarios de ejemplo (password: Admin123)
-- El hash debe generarse con bcrypt en la aplicación
INSERT INTO usuarios (nombre, email, numero_telefono, password_hash, id_rol) VALUES
('Administrador Sistema', 'admin@empresa.com', '8888-8888', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 1),
('Juan Pérez', 'juan.perez@empresa.com', '8888-1111', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 2),
('María González', 'maria.gonzalez@empresa.com', '8888-2222', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 2),
('Carlos Rodríguez', 'carlos.rodriguez@empresa.com', '8888-3333', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K', 2);

PRINT '✅ Usuarios de ejemplo creados (password: Admin123)';
GO

-- Inspecciones de ejemplo
DECLARE @usuario_admin INT;
SELECT @usuario_admin = id_usuario FROM usuarios WHERE email = 'admin@empresa.com';

INSERT INTO inspecciones (nombre_inspeccion, tipo_inspeccion, edificio, piso, ubicacion, creado_por) VALUES
('Inspección Eléctrica - Edificio A', 'Electricidad', 'Edificio A', 'Planta Baja', 'Oficina 101', @usuario_admin),
('Mantenimiento Aire Acondicionado - Sala Principal', 'Aire Acondicionado', 'Edificio B', 'Piso 1', 'Sala de Juntas', @usuario_admin),
('Revisión Cubierta de Techos - Bodega', 'Cubierta de Techos', 'Bodega', 'N/A', 'Área Externa', @usuario_admin);

PRINT '✅ Inspecciones de ejemplo creadas';
GO

-- Tareas de ejemplo
INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, descripcion, creado_por) VALUES
('Revisar sistema eléctrico principal', 'No Iniciado', 'Juan Pérez', GETDATE(), 'Alta', 'Revisar todos los breakers del panel principal', @usuario_admin),
('Limpiar filtros de aire acondicionado', 'En Proceso', 'María González', GETDATE(), 'Media', 'Limpieza de filtros y serpentines', @usuario_admin),
('Pintar fachada principal', 'No Iniciado', 'Carlos Rodríguez', DATEADD(DAY, 7, GETDATE()), 'Baja', 'Pintura exterior de la fachada principal', @usuario_admin),
('Reparar puerta de emergencia', 'Finalizado', 'Juan Pérez', DATEADD(DAY, -2, GETDATE()), 'Alta', 'Cambio de bisagras y cerradura', @usuario_admin),
('Mantenimiento bomba de agua', 'En Proceso', 'Carlos Rodríguez', GETDATE(), 'Alta', 'Revisión completa del sistema de bombeo', @usuario_admin);

PRINT '✅ Tareas de ejemplo creadas';
GO

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

PRINT '';
PRINT '========================================';
PRINT '✅ BASE DE DATOS CREADA EXITOSAMENTE';
PRINT '========================================';
PRINT '';

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

PRINT '📋 TABLAS PRINCIPALES:';
PRINT '  ✓ roles (2 registros)';
PRINT '  ✓ usuarios (4 registros de ejemplo)';
PRINT '  ✓ inspecciones (con todos los campos detallados)';
PRINT '  ✓ imagenes_inspeccion';
PRINT '  ✓ tareas (5 registros de ejemplo)';
PRINT '';

PRINT '🔐 CREDENCIALES DE ACCESO:';
PRINT '  Email: admin@empresa.com';
PRINT '  Password: Admin123';
PRINT '';

PRINT '========================================';
GO

