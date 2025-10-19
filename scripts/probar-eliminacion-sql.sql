-- Script SQL para probar eliminación de usuarios
USE PlanificadorMantenimiento;

-- Ver estado actual
PRINT '=== ESTADO ACTUAL DE USUARIOS ===';
SELECT 
    id_usuario,
    nombre,
    email,
    numero_telefono,
    CASE WHEN activo = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END as estado,
    fecha_actualizacion
FROM usuarios 
ORDER BY fecha_actualizacion DESC;

-- Crear un usuario de prueba
PRINT '';
PRINT '=== CREANDO USUARIO DE PRUEBA ===';
INSERT INTO usuarios (nombre, email, numero_telefono, password_hash, id_rol, activo)
VALUES ('Usuario Prueba', 'prueba@test.com', '1234567890', 'hash_fake', 2, 1);

DECLARE @nuevo_id INT = SCOPE_IDENTITY();
PRINT 'Usuario creado con ID: ' + CAST(@nuevo_id AS VARCHAR);

-- Verificar que se creó
PRINT '';
PRINT '=== USUARIO CREADO ===';
SELECT 
    id_usuario,
    nombre,
    email,
    numero_telefono,
    CASE WHEN activo = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END as estado
FROM usuarios 
WHERE id_usuario = @nuevo_id;

-- Simular eliminación (desactivar)
PRINT '';
PRINT '=== ELIMINANDO USUARIO (DESACTIVANDO) ===';
UPDATE usuarios 
SET activo = 0, fecha_actualizacion = GETDATE()
WHERE id_usuario = @nuevo_id;

-- Verificar que se desactivó
PRINT '';
PRINT '=== USUARIO DESACTIVADO ===';
SELECT 
    id_usuario,
    nombre,
    email,
    numero_telefono,
    CASE WHEN activo = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END as estado,
    fecha_actualizacion
FROM usuarios 
WHERE id_usuario = @nuevo_id;

-- Ver solo usuarios activos (como hace el frontend)
PRINT '';
PRINT '=== USUARIOS ACTIVOS (LOS QUE VE EL FRONTEND) ===';
SELECT 
    id_usuario,
    nombre,
    email,
    numero_telefono
FROM usuarios 
WHERE activo = 1
ORDER BY nombre;

-- Limpiar usuario de prueba
PRINT '';
PRINT '=== LIMPIANDO USUARIO DE PRUEBA ===';
DELETE FROM usuarios WHERE id_usuario = @nuevo_id;
PRINT 'Usuario de prueba eliminado físicamente';
