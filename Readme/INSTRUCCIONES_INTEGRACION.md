# 🚀 Instrucciones de Integración - Base de Datos SQL Server

## 📋 Contenido
- [Instalación de la Base de Datos](#instalación)
- [Configuración en Node.js](#configuración-nodejs)
- [Migración del Código Actual](#migración)
- [Endpoints API Actualizados](#endpoints-api)
- [Pruebas](#pruebas)

---

## 🎯 Instalación de la Base de Datos

### Opción 1: SQL Server Management Studio (SSMS)

1. **Abrir SSMS** y conectar a tu servidor SQL Server
2. **Abrir el archivo SQL**:
   - Archivo → Abrir → Archivo
   - Seleccionar: `BaseDeDatos/PlanificadorMantenimiento_BaseDeDatos_Completa.sql`
3. **Ejecutar el script**: Presionar `F5` o hacer clic en **"Ejecutar"**
4. **Verificar la creación**:
   ```sql
   USE PlanificadorMantenimiento;
   SELECT * FROM usuarios;
   SELECT * FROM tareas;
   ```

### Opción 2: Línea de Comandos (sqlcmd)

```cmd
cd BaseDeDatos
sqlcmd -S localhost -E -i PlanificadorMantenimiento_BaseDeDatos_Completa.sql
```

**Nota:** Si usas autenticación SQL Server en lugar de Windows:
```cmd
sqlcmd -S localhost -U tu_usuario -P tu_contraseña -i PlanificadorMantenimiento_BaseDeDatos_Completa.sql
```

---

## 🔧 Configuración en Node.js

### 1. Instalar el Driver de SQL Server

```bash
npm install mssql
```

### 2. Crear archivo de configuración `config/database.js`

**Nota:** Puedes copiar el archivo de ejemplo:
```bash
copy js\ejemplo-config-database.js config\database.js
```

O crear manualmente:

```javascript
// config/database.js
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'tu_usuario_sql',
    password: process.env.DB_PASSWORD || 'tu_password_sql',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'PlanificadorMantenimiento',
    options: {
        encrypt: true, // Usar true para Azure
        trustServerCertificate: true, // Usar true para desarrollo local
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getConnection() {
    try {
        if (!pool) {
            pool = await sql.connect(config);
            console.log('✅ Conectado a SQL Server');
        }
        return pool;
    } catch (err) {
        console.error('❌ Error de conexión a SQL Server:', err);
        throw err;
    }
}

async function query(sqlQuery, params = {}) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Agregar parámetros
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(sqlQuery);
        return result;
    } catch (err) {
        console.error('Error en query:', err);
        throw err;
    }
}

async function execute(procedureName, params = {}) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Agregar parámetros
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        console.error('Error ejecutando procedimiento:', err);
        throw err;
    }
}

module.exports = {
    sql,
    getConnection,
    query,
    execute
};
```

### 3. Crear archivo `.env` (variables de entorno)

```env
# Base de datos
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Sesiones
SESSION_SECRET=tu-secreto-super-seguro-aqui
RESET_TOKEN_SECRET=otro-secreto-para-tokens

# Entorno
NODE_ENV=development
PORT=3000
```

**Importante:** Agregar `.env` a tu archivo `.gitignore`:
```
.env
node_modules/
```

---

## 🔄 Migración del Código Actual

### Reemplazar el In-Memory Store

En tu `server.js`, reemplaza las secciones de memoria por llamadas a la base de datos:

#### **Antes (In-Memory):**
```javascript
const users = new Map();
const tasks = [...];
```

#### **Después (SQL Server):**
```javascript
const db = require('./config/database');
```

### Ejemplos de Migración por Endpoint

#### 1. Login (`/auth/login`)

**Reemplazar:**
```javascript
const user = users.get(normalized) || null;
```

**Con:**
```javascript
const result = await db.execute('SP_autenticar_usuario', { email: normalized });
const user = result.recordset[0] || null;
```

**Login completo actualizado:**
```javascript
app.post('/auth/login', loginLimiter, csrfProtection, async (req, res) => {
    const { email = '', password = '' } = req.body || {};
    const normalized = String(email).trim().toLowerCase();
    
    try {
        const result = await db.execute('SP_autenticar_usuario', { email: normalized });
        let user = result.recordset[0] || null;
        
        if (!user) {
            await bcrypt.compare(password, await bcrypt.hash('dummy', 10));
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        if (!user.is_active) {
            return res.status(403).json({ error: 'Cuenta inactiva' });
        }
        
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            return res.status(423).json({ 
                error: 'Cuenta bloqueada temporalmente', 
                lockout_until: user.lockout_until 
            });
        }
        
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            await db.execute('SP_registrar_login_fallido', { email: normalized });
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        await db.execute('SP_limpiar_login_fallidos', { email: normalized });
        
        req.session.user = { 
            user_id: user.user_id, 
            email: user.email 
        };
        
        res.json({ 
            success: true, 
            user: { 
                user_id: user.user_id, 
                email: user.email,
                nombre: user.nombre,
                rol: user.rol
            } 
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### 2. Obtener Tareas (`/api/tasks`)

**Reemplazar:**
```javascript
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});
```

**Con:**
```javascript
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await db.execute('SP_obtener_todas_tareas');
        const tasks = result.recordset || [];
        
        // Parsear JSON de inspecciones
        tasks.forEach(task => {
            if (task.inspection && typeof task.inspection === 'string') {
                try {
                    task.inspection = JSON.parse(task.inspection);
                } catch (e) {
                    task.inspection = null;
                }
            }
        });
        
        res.json(tasks);
    } catch (err) {
        console.error('Error obteniendo tareas:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### 3. Crear Tarea desde Inspección (`/api/tasks` POST)

**Reemplazar:**
```javascript
app.post('/api/tasks', (req, res) => {
    const body = req.body || {};
    // ... código in-memory
    tasks.push(task);
    res.status(201).json(task);
});
```

**Con:**
```javascript
app.post('/api/tasks', async (req, res) => {
    const body = req.body || {};
    
    try {
        let title = body.title || '';
        let status = body.status || 'not_started';
        let assignedTo = body.assignedTo || '';
        let date = body.date || new Date().toISOString().split('T')[0];
        
        // Si viene de inspección
        if (body.inspection) {
            const oficina = body.inspection.location?.oficina || '';
            const edificio = body.inspection.location?.edificio || '';
            title = title || `Inspección - ${edificio}${oficina ? ' / ' + oficina : ''}`;
            date = date || new Date().toISOString().split('T')[0];
        }
        
        // Crear inspección primero si existe
        let idInspeccion = null;
        if (body.inspection) {
            const inspResult = await db.query(`
                INSERT INTO inspecciones (nombre_tarea, edificio, piso, oficina_aula, prioridad, datos_completos)
                OUTPUT INSERTED.id_inspeccion
                VALUES (@nombre, @edificio, @piso, @oficina, @prioridad, @datos)
            `, {
                nombre: title,
                edificio: body.inspection.location?.edificio || '',
                piso: body.inspection.location?.piso || '',
                oficina: body.inspection.location?.oficina_aula || body.inspection.location?.oficina || '',
                prioridad: body.inspection.priority || 'media',
                datos: JSON.stringify(body.inspection)
            });
            idInspeccion = inspResult.recordset[0].id_inspeccion;
        }
        
        // Crear la tarea
        const tareaResult = await db.query(`
            DECLARE @id_tarea INT;
            EXEC SP_crear_tarea_desde_inspeccion 
                @titulo = @title,
                @fecha = @date,
                @id_inspeccion = @idInspeccion,
                @asignado_a = @assignedTo,
                @inspeccion_data_json = @inspectionData,
                @id_tarea_creada = @id_tarea OUTPUT;
            
            SELECT @id_tarea AS id;
        `, {
            title,
            date,
            idInspeccion,
            assignedTo,
            inspectionData: body.inspection ? JSON.stringify(body.inspection) : null
        });
        
        const taskId = tareaResult.recordset[0].id;
        
        // Guardar imágenes si existen
        if (body.inspection?.images_base64 && Array.isArray(body.inspection.images_base64)) {
            for (const img of body.inspection.images_base64) {
                await db.query(`
                    INSERT INTO imagenes (id_tarea, nombre_archivo, tipo_mime, data_base64)
                    VALUES (@taskId, @nombre, @tipo, @data)
                `, {
                    taskId,
                    nombre: img.name,
                    tipo: img.type,
                    data: img.data
                });
            }
        }
        
        // Obtener la tarea completa creada
        const result = await db.execute('SP_obtener_tarea_por_id', { id_tarea: taskId });
        const task = result.recordset[0];
        
        res.status(201).json(task);
    } catch (err) {
        console.error('Error creando tarea:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### 4. Actualizar Tarea (`/api/tasks/:id` PUT)

**Reemplazar:**
```javascript
app.put('/api/tasks/:id', (req, res) => {
    const idx = tasks.findIndex(t => t.id === id);
    // ... actualización in-memory
});
```

**Con:**
```javascript
app.put('/api/tasks/:id', async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body || {};
    
    try {
        const result = await db.execute('SP_actualizar_tarea', {
            id_tarea: id,
            status: body.status || null,
            assignedTo: body.assignedTo || null,
            assignedUserId: body.assignedUserId || null,
            updatedBy: body.updatedBy || 'system'
        });
        
        const task = result.recordset[0];
        res.json(task);
    } catch (err) {
        console.error('Error actualizando tarea:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### 5. Estadísticas (`/api/stats`)

**Reemplazar:**
```javascript
app.get('/api/stats', (req, res) => {
    const counts = tasks.reduce((acc, t) => { ... });
    res.json({ labels, counts });
});
```

**Con:**
```javascript
app.get('/api/stats', async (req, res) => {
    try {
        const result = await db.execute('SP_obtener_stats_dashboard');
        const stats = result.recordset || [];
        
        // Formato compatible con el frontend
        const labels = [];
        const counts = [];
        
        // Orden: done, in_progress, not_started
        const done = stats.find(s => s.codigo_estado === 'done') || { count: 0 };
        const progress = stats.find(s => s.codigo_estado === 'in_progress') || { count: 0 };
        const notStarted = stats.find(s => s.codigo_estado === 'not_started') || { count: 0 };
        
        res.json({
            labels: ['Completadas', 'En progreso', 'No iniciadas'],
            counts: [done.count, progress.count, notStarted.count]
        });
    } catch (err) {
        console.error('Error obteniendo estadísticas:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### 6. Usuarios - Listar (`/api/usuarios`)

**Reemplazar:**
```javascript
app.get('/api/usuarios', requireAuth, (req, res) => {
    const list = Array.from(usersById.values());
    res.json(list);
});
```

**Con:**
```javascript
app.get('/api/usuarios', requireAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                user_id,
                email,
                nombre,
                rol,
                is_active
            FROM usuarios
            WHERE is_active = 1
            ORDER BY nombre
        `);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Error obteniendo usuarios:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### 7. Crear Usuario (`/api/usuarios` POST)

**Con Base de Datos:**
```javascript
app.post('/api/usuarios', requireAuth, async (req, res) => {
    const { email = '', nombre = '', rol = 'usuario', password = '' } = req.body || {};
    const normalized = String(email).trim().toLowerCase();
    
    if (!normalized) return res.status(400).json({ error: 'Email requerido' });
    
    try {
        // Verificar si existe
        const checkResult = await db.query(
            'SELECT user_id FROM usuarios WHERE email = @email',
            { email: normalized }
        );
        
        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: 'Email ya existe' });
        }
        
        const pwd = password && String(password).length >= 8 ? String(password) : 'Cambio1234!';
        const password_hash = await bcrypt.hash(pwd, 12);
        
        const result = await db.query(`
            INSERT INTO usuarios (email, nombre, rol, password_hash, is_active)
            OUTPUT INSERTED.user_id, INSERTED.email, INSERTED.nombre, INSERTED.rol
            VALUES (@email, @nombre, @rol, @hash, 1)
        `, {
            email: normalized,
            nombre: nombre || normalized,
            rol,
            hash: password_hash
        });
        
        const user = result.recordset[0];
        res.status(201).json({
            user_id: user.user_id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            temp_password: pwd
        });
    } catch (err) {
        console.error('Error creando usuario:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

---

## 🧪 Pruebas

### 1. Verificar Conexión

Ejecutar el archivo de prueba incluido:

```bash
node js/test-conexion.js
```

O crear tu propio archivo `test-connection.js`:

```javascript
const db = require('./config/database');

async function test() {
    try {
        console.log('Probando conexión...');
        const result = await db.query('SELECT @@VERSION AS version');
        console.log('✅ Conexión exitosa!');
        console.log('SQL Server Version:', result.recordset[0].version);
        
        // Probar procedimiento
        const stats = await db.execute('SP_obtener_stats_dashboard');
        console.log('✅ Procedimiento almacenado funciona!');
        console.log('Estadísticas:', stats.recordset);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

test();
```

### 2. Probar Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@empresa.com","password":"Demo1234!"}'
```

### 3. Probar Tareas

```bash
curl http://localhost:3000/api/tasks
```

---

## 📊 Estructura de la Base de Datos

### Tablas Principales

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `usuarios` | Usuarios del sistema | user_id, email, password_hash, nombre, rol |
| `tareas` | Tareas de mantenimiento | id_tarea, titulo, id_estado, asignado_user_id |
| `inspecciones` | Datos de inspecciones | id_inspeccion, datos_completos (JSON) |
| `estados` | Estados de tareas | id_estado, codigo_estado (not_started/in_progress/done) |
| `imagenes` | Imágenes en base64 | id_imagen, id_tarea, data_base64 |
| `password_reset_tokens` | Tokens de reset | token_id, user_id, token_hash, expires_at |

### Procedimientos Almacenados

| Procedimiento | Uso |
|---------------|-----|
| `SP_autenticar_usuario` | Login de usuario |
| `SP_registrar_login_fallido` | Registrar intentos fallidos |
| `SP_limpiar_login_fallidos` | Limpiar tras login exitoso |
| `SP_obtener_todas_tareas` | Listar tareas |
| `SP_crear_tarea_desde_inspeccion` | Crear tarea nueva |
| `SP_actualizar_tarea` | Actualizar tarea |
| `SP_obtener_stats_dashboard` | Estadísticas |

### Vistas

| Vista | Descripción |
|-------|-------------|
| `VW_tareas_completas` | Tareas con joins |
| `VW_estadisticas_estados` | Stats por estado |
| `VW_dashboard_principal` | Resumen general |

---

## 🔐 Seguridad

### Recomendaciones

1. **Nunca subir el archivo `.env` a Git**
2. **Usar variables de entorno en producción**
3. **Cambiar las contraseñas por defecto**
4. **Habilitar SSL/TLS en producción**
5. **Implementar rate limiting**
6. **Sanitizar entradas del usuario**

### Configuración de Producción

```javascript
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // SIEMPRE true en producción
        trustServerCertificate: false, // false en producción
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
```

---

## 📞 Soporte

Si encuentras algún problema:

1. Verificar que SQL Server esté corriendo
2. Verificar credenciales en `.env`
3. Revisar logs de SQL Server
4. Verificar firewall y puertos (1433 por defecto)

---

## 🎉 ¡Listo!

Tu base de datos está completa y lista para integrarse con tu proyecto Node.js. Sigue los pasos de migración y tendrás un sistema robusto y escalable.

**Nota:** Esta base de datos está diseñada específicamente para tu sistema de Planificador de Mantenimiento y mantiene compatibilidad 100% con tu código frontend actual.

