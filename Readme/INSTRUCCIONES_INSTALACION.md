# 📦 INSTRUCCIONES DE INSTALACIÓN Y MIGRACIÓN

Esta guía te ayudará a instalar la nueva estructura de base de datos y migrar datos existentes si es necesario.

---

## 🆕 INSTALACIÓN LIMPIA (Proyecto Nuevo)

Si estás empezando desde cero, sigue estos pasos:

### 1. **Preparar SQL Server**

Asegúrate de tener instalado:
- SQL Server 2016 o superior
- SQL Server Management Studio (SSMS)

### 2. **Ejecutar el Script de Creación**

1. Abre SQL Server Management Studio
2. Conéctate a tu servidor SQL Server
3. Abre el archivo `PlanificadorMantenimiento_NuevaEstructura.sql`
4. Ejecuta el script completo (F5 o botón Ejecutar)

El script hará automáticamente:
- ✅ Crear la base de datos `PlanificadorMantenimiento`
- ✅ Crear todas las tablas con sus relaciones
- ✅ Crear índices para optimización
- ✅ Crear triggers automáticos
- ✅ Crear vistas útiles
- ✅ Crear procedimientos almacenados
- ✅ Insertar datos de ejemplo

### 3. **Verificar la Instalación**

Ejecuta estas consultas para verificar:

```sql
-- Ver todas las tablas
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Ver usuarios de ejemplo
SELECT * FROM usuarios;

-- Ver estadísticas de tareas
SELECT * FROM VW_estadisticas_tareas;
```

### 4. **Probar Login**

Usa estas credenciales de prueba:
- **Email**: `admin@empresa.com`
- **Password**: `Admin123`

---

## 🔄 MIGRACIÓN DESDE BASE DE DATOS ANTERIOR

Si ya tienes una base de datos anterior y quieres migrar a la nueva estructura:

### Opción A: Migración Manual (Recomendada)

#### Paso 1: Respaldar Base de Datos Actual

```sql
-- Crear respaldo
BACKUP DATABASE planificador_mantenimiento 
TO DISK = 'C:\Backups\planificador_mantenimiento_backup.bak'
WITH FORMAT, COMPRESSION;
```

#### Paso 2: Crear Nueva Base de Datos

Ejecuta el script `PlanificadorMantenimiento_NuevaEstructura.sql` completo.

#### Paso 3: Migrar Usuarios

```sql
-- Migrar usuarios de la estructura anterior
-- IMPORTANTE: Ajusta los nombres de las columnas según tu estructura anterior

INSERT INTO PlanificadorMantenimiento.dbo.usuarios 
    (nombre, email, numero_telefono, password_hash, id_rol, activo)
SELECT 
    nombre_completo,
    email,
    NULL, -- Si no tienes teléfono en la anterior, poner NULL
    password_hash,
    CASE 
        WHEN rol = 'Admin' THEN 1 -- Administrador
        ELSE 2 -- Usuario
    END,
    activo
FROM planificador_mantenimiento.dbo.usuarios;
```

#### Paso 4: Migrar Tareas (si aplica)

```sql
-- Migrar tareas básicas
-- IMPORTANTE: Ajusta según tu estructura

INSERT INTO PlanificadorMantenimiento.dbo.tareas 
    (titulo, estado, asignado_a, fecha, prioridad, descripcion, creado_por)
SELECT 
    titulo_tarea,
    CASE 
        WHEN id_estado = 1 THEN 'No Iniciado'
        WHEN id_estado = 2 THEN 'En Proceso'
        WHEN id_estado = 3 THEN 'Finalizado'
        ELSE 'No Iniciado'
    END,
    asignado_a,
    ISNULL(fecha_creacion, GETDATE()),
    CASE 
        WHEN prioridad = 'Crítica' THEN 'Alta'
        WHEN prioridad = 'Media' THEN 'Media'
        ELSE 'Baja'
    END,
    descripcion,
    NULL -- Ajustar si tienes referencia de usuario
FROM planificador_mantenimiento.dbo.tareas;
```

### Opción B: Empezar de Cero

Si la estructura anterior es muy diferente, puede ser más fácil empezar de cero:

1. Exporta los datos importantes a Excel/CSV
2. Crea la nueva base de datos
3. Importa manualmente los datos críticos

---

## 🔧 CONFIGURACIÓN DEL BACKEND (Node.js)

### 1. **Instalar Dependencias**

```bash
npm install mssql bcryptjs jsonwebtoken dotenv
```

### 2. **Crear Archivo de Configuración**

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_PORT=1433

# JWT
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=24h

# Puerto del servidor
PORT=3000
```

### 3. **Configurar Conexión a la Base de Datos**

Actualiza tu archivo `js/server.js` o crea uno nuevo:

```javascript
const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true, // Para Azure
        trustServerCertificate: true // Para desarrollo local
    }
};

// Pool de conexiones
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Conectado a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error de conexión a BD:', err);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};
```

### 4. **Ejemplo de Endpoint de Login**

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('./database');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const pool = await poolPromise;
        
        // Llamar al procedimiento almacenado
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .execute('SP_autenticar_usuario');
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = result.recordset[0];
        
        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario,
                email: usuario.email,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;
```

### 5. **Ejemplo de Endpoint para Crear Inspección**

```javascript
router.post('/inspecciones', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const {
            nombre_inspeccion,
            tipo_inspeccion,
            edificio,
            piso,
            ubicacion,
            // ... todos los campos de la inspección
            creado_por
        } = req.body;
        
        // Insertar inspección
        const result = await pool.request()
            .input('nombre_inspeccion', sql.NVarChar, nombre_inspeccion)
            .input('tipo_inspeccion', sql.NVarChar, tipo_inspeccion)
            .input('edificio', sql.NVarChar, edificio)
            .input('piso', sql.NVarChar, piso)
            .input('ubicacion', sql.NVarChar, ubicacion)
            // Agregar todos los campos específicos del tipo de inspección
            .input('creado_por', sql.Int, creado_por)
            .query(`
                INSERT INTO inspecciones (
                    nombre_inspeccion, tipo_inspeccion, edificio, piso, ubicacion, 
                    creado_por
                )
                OUTPUT INSERTED.id_inspeccion
                VALUES (
                    @nombre_inspeccion, @tipo_inspeccion, @edificio, @piso, @ubicacion,
                    @creado_por
                )
            `);
        
        const id_inspeccion = result.recordset[0].id_inspeccion;
        
        res.json({
            success: true,
            id_inspeccion
        });
        
    } catch (error) {
        console.error('Error al crear inspección:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
```

### 6. **Ejemplo de Endpoint para Subir Imagen**

```javascript
router.post('/imagenes', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const {
            id_inspeccion,
            nombre_archivo,
            tipo_mime,
            data_base64, // Imagen completa en base64: data:image/jpeg;base64,...
            descripcion,
            subido_por
        } = req.body;
        
        // Calcular tamaño en bytes
        const tamaño_bytes = Buffer.from(data_base64.split(',')[1], 'base64').length;
        
        await pool.request()
            .input('id_inspeccion', sql.Int, id_inspeccion)
            .input('nombre_archivo', sql.NVarChar, nombre_archivo)
            .input('tipo_mime', sql.NVarChar, tipo_mime)
            .input('data_base64', sql.NVarChar(sql.MAX), data_base64)
            .input('tamaño_bytes', sql.Int, tamaño_bytes)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('subido_por', sql.Int, subido_por)
            .query(`
                INSERT INTO imagenes_inspeccion (
                    id_inspeccion, nombre_archivo, tipo_mime, data_base64,
                    tamaño_bytes, descripcion, subido_por
                )
                VALUES (
                    @id_inspeccion, @nombre_archivo, @tipo_mime, @data_base64,
                    @tamaño_bytes, @descripcion, @subido_por
                )
            `);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
```

---

## 🔐 SEGURIDAD

### Hashear Contraseñas

**NUNCA guardes contraseñas en texto plano.** Usa bcrypt:

```javascript
const bcrypt = require('bcryptjs');

// Al registrar usuario
const password = 'Admin123';
const salt = await bcrypt.genSalt(12);
const password_hash = await bcrypt.hash(password, salt);

// Guardar password_hash en la BD

// Al verificar login
const passwordValida = await bcrypt.compare(
    passwordIngresada,
    password_hash_de_bd
);
```

### Crear Usuario Administrador

Si necesitas crear un nuevo usuario administrador:

```javascript
const bcrypt = require('bcryptjs');

async function crearAdmin() {
    const password = 'TuPasswordSeguro123!';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Hash:', hash);
    // Usar este hash en el INSERT INTO usuarios
}

crearAdmin();
```

---

## 📊 CONSULTAS ÚTILES PARA ADMINISTRACIÓN

### Ver todos los usuarios
```sql
SELECT 
    u.id_usuario,
    u.nombre,
    u.email,
    u.numero_telefono,
    r.nombre_rol,
    u.activo,
    u.ultimo_acceso
FROM usuarios u
INNER JOIN roles r ON u.id_rol = r.id_rol
ORDER BY u.fecha_creacion DESC;
```

### Ver estadísticas generales
```sql
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE activo = 1) AS usuarios_activos,
    (SELECT COUNT(*) FROM inspecciones) AS total_inspecciones,
    (SELECT COUNT(*) FROM tareas) AS total_tareas,
    (SELECT COUNT(*) FROM tareas WHERE estado = 'Finalizado') AS tareas_finalizadas,
    (SELECT COUNT(*) FROM tareas WHERE estado = 'En Proceso') AS tareas_en_proceso,
    (SELECT COUNT(*) FROM tareas WHERE estado = 'No Iniciado') AS tareas_pendientes,
    (SELECT COUNT(*) FROM imagenes_inspeccion) AS total_imagenes;
```

### Ver inspecciones con imágenes
```sql
SELECT 
    i.id_inspeccion,
    i.nombre_inspeccion,
    i.tipo_inspeccion,
    i.edificio,
    i.piso,
    u.nombre AS creado_por_nombre,
    COUNT(img.id_imagen) AS total_imagenes,
    i.fecha_creacion
FROM inspecciones i
LEFT JOIN imagenes_inspeccion img ON i.id_inspeccion = img.id_inspeccion
LEFT JOIN usuarios u ON i.creado_por = u.id_usuario
GROUP BY 
    i.id_inspeccion, i.nombre_inspeccion, i.tipo_inspeccion, 
    i.edificio, i.piso, u.nombre, i.fecha_creacion
ORDER BY i.fecha_creacion DESC;
```

### Ver tareas por usuario
```sql
SELECT 
    asignado_a,
    COUNT(*) AS total_tareas,
    SUM(CASE WHEN estado = 'No Iniciado' THEN 1 ELSE 0 END) AS pendientes,
    SUM(CASE WHEN estado = 'En Proceso' THEN 1 ELSE 0 END) AS en_proceso,
    SUM(CASE WHEN estado = 'Finalizado' THEN 1 ELSE 0 END) AS finalizadas
FROM tareas
WHERE asignado_a IS NOT NULL
GROUP BY asignado_a
ORDER BY total_tareas DESC;
```

---

## 🧪 PRUEBAS

### Script de Prueba Completo

Ejecuta este script para probar todas las funcionalidades:

```sql
-- 1. Crear usuario de prueba
DECLARE @password_hash NVARCHAR(255) = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K';
DECLARE @id_usuario_prueba INT;

INSERT INTO usuarios (nombre, email, numero_telefono, password_hash, id_rol)
VALUES ('Usuario Prueba', 'prueba@test.com', '1234-5678', @password_hash, 2);

SET @id_usuario_prueba = SCOPE_IDENTITY();
PRINT 'Usuario creado: ' + CAST(@id_usuario_prueba AS VARCHAR);

-- 2. Crear inspección de prueba
DECLARE @id_inspeccion_prueba INT;

INSERT INTO inspecciones (
    nombre_inspeccion, tipo_inspeccion, edificio, piso, ubicacion,
    ac_tipo, ac_capacidad_btu, ac_gas_refrigerante,
    creado_por
)
VALUES (
    'Prueba AC', 'Aire Acondicionado', 'Edificio Test', 'PB', 'Sala 1',
    'mini split', 18000, 'R410A',
    @id_usuario_prueba
);

SET @id_inspeccion_prueba = SCOPE_IDENTITY();
PRINT 'Inspección creada: ' + CAST(@id_inspeccion_prueba AS VARCHAR);

-- 3. Crear tarea de prueba
DECLARE @id_tarea_prueba INT;

INSERT INTO tareas (titulo, estado, asignado_a, fecha, prioridad, id_inspeccion, creado_por)
VALUES ('Tarea de Prueba', 'No Iniciado', 'Usuario Prueba', GETDATE(), 'Media', @id_inspeccion_prueba, @id_usuario_prueba);

SET @id_tarea_prueba = SCOPE_IDENTITY();
PRINT 'Tarea creada: ' + CAST(@id_tarea_prueba AS VARCHAR);

-- 4. Verificar
SELECT * FROM VW_tareas_completas WHERE id_tarea = @id_tarea_prueba;

-- 5. Limpiar (opcional)
-- DELETE FROM tareas WHERE id_tarea = @id_tarea_prueba;
-- DELETE FROM inspecciones WHERE id_inspeccion = @id_inspeccion_prueba;
-- DELETE FROM usuarios WHERE id_usuario = @id_usuario_prueba;
```

---

## ❓ SOLUCIÓN DE PROBLEMAS

### Error: "Cannot open database"
**Solución**: Verifica que SQL Server esté corriendo y que tienes permisos.

### Error: "Login failed for user"
**Solución**: Verifica las credenciales en el archivo `.env`.

### Error: "Invalid object name"
**Solución**: Asegúrate de estar usando la base de datos correcta:
```sql
USE PlanificadorMantenimiento;
GO
```

### Las imágenes son muy grandes
**Solución**: Comprime las imágenes antes de convertirlas a base64. Usa calidad 80-85% para JPEG.

### Queries lentas
**Solución**: Verifica que los índices estén creados:
```sql
-- Ver índices existentes
SELECT 
    OBJECT_NAME(object_id) AS tabla,
    name AS nombre_indice,
    type_desc
FROM sys.indexes
WHERE OBJECT_NAME(object_id) IN ('usuarios', 'inspecciones', 'tareas', 'imagenes_inspeccion')
ORDER BY tabla, name;
```

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa el archivo de log de SQL Server
2. Verifica que todos los scripts se ejecutaron correctamente
3. Consulta la documentación en `ESTRUCTURA_NUEVA_BASE_DE_DATOS.md`
4. Revisa los diagramas en `DIAGRAMA_NUEVA_ESTRUCTURA.txt`

---

¡Listo! Tu base de datos está configurada y lista para usar. 🎉

