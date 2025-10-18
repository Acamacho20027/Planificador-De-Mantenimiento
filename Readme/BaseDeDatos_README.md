# 📁 Base de Datos - Planificador de Mantenimiento

## 🎯 Descripción

Esta carpeta contiene la **base de datos completa en SQL Server** diseñada específicamente para el sistema de Planificador de Mantenimiento. La base de datos está 100% integrada con todas las funcionalidades del proyecto:

- ✅ **Sistema de Autenticación** completo con seguridad
- ✅ **Inspecciones con Wizard de 7 pasos** (almacenamiento JSON)
- ✅ **Gestión de Tareas** con estados y asignaciones
- ✅ **Imágenes en Base64** para documentación visual
- ✅ **Dashboard y Estadísticas** con vistas optimizadas
- ✅ **Historial y Auditoría** automática
- ✅ **Reset de Contraseña** con tokens seguros

---

## 📂 Archivos Incluidos

| Archivo | Descripción |
|---------|-------------|
| `PlanificadorMantenimiento_BaseDeDatos_Completa.sql` | Script SQL completo para crear toda la base de datos |
| `INSTRUCCIONES_INTEGRACION.md` | Guía detallada de integración con Node.js |
| `README.md` | Este archivo (resumen general) |

---

## 🚀 Inicio Rápido

### 1. Instalar la Base de Datos

**Abrir SQL Server Management Studio (SSMS):**

1. Conectar a tu servidor SQL Server
2. Archivo → Abrir → Archivo
3. Seleccionar: `PlanificadorMantenimiento_BaseDeDatos_Completa.sql`
4. Presionar `F5` (Ejecutar)
5. ✅ ¡Listo! La base de datos está creada

**O desde línea de comandos:**

```cmd
cd BaseDeDatos
sqlcmd -S localhost -E -i PlanificadorMantenimiento_BaseDeDatos_Completa.sql
```

### 2. Instalar Dependencias en Node.js

```bash
npm install mssql
```

### 3. Configurar Conexión

Crear archivo `.env` en la raíz del proyecto:

```env
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=tu_usuario
DB_PASSWORD=tu_password
SESSION_SECRET=tu-secreto-seguro
```

### 4. Copiar Archivos de Configuración

```bash
# Copiar el archivo de ejemplo a la carpeta config
copy js\ejemplo-config-database.js config\database.js
```

### 5. Leer las Instrucciones Completas

👉 **Leer:** `INSTRUCCIONES_INTEGRACION.md` para integración paso a paso con tu código Node.js

---

## 📊 Estructura de la Base de Datos

### Tablas Principales

```
PlanificadorMantenimiento
│
├── 👤 usuarios                      (Sistema de autenticación)
├── 🔐 password_reset_tokens         (Reset de contraseña)
├── 📋 tareas                        (Tareas de mantenimiento)
├── 🔍 inspecciones                  (Datos del wizard)
├── 📍 ubicaciones                   (Edificios, pisos, oficinas)
├── 🏷️  estados                      (Estados de tareas)
├── 🖼️  imagenes                     (Imágenes en base64)
└── 📜 historial_estados             (Auditoría automática)
```

### Procedimientos Almacenados

- `SP_autenticar_usuario` - Login
- `SP_registrar_login_fallido` - Control de seguridad
- `SP_limpiar_login_fallidos` - Tras login exitoso
- `SP_obtener_todas_tareas` - Listar tareas
- `SP_crear_tarea_desde_inspeccion` - Crear tarea
- `SP_actualizar_tarea` - Actualizar tarea
- `SP_obtener_stats_dashboard` - Estadísticas
- `SP_obtener_tarea_por_id` - Obtener una tarea

### Vistas

- `VW_tareas_completas` - Tareas con toda la información
- `VW_estadisticas_estados` - Stats por estado
- `VW_dashboard_principal` - Resumen general

### Triggers

- `TR_usuarios_update` - Actualiza fecha de modificación
- `TR_tareas_update` - Actualiza fecha de modificación
- `TR_tareas_cambio_estado` - Registra cambios automáticamente

---

## 🔐 Credenciales por Defecto

| Email | Password | Rol |
|-------|----------|-----|
| demo@empresa.com | Demo1234! | admin |
| juan.perez@empresa.com | Demo1234! | tecnico |
| maria.gonzalez@empresa.com | Demo1234! | tecnico |
| carlos.rodriguez@empresa.com | Demo1234! | supervisor |

**⚠️ IMPORTANTE:** Cambiar estas contraseñas en producción.

---

## 💡 Características Principales

### 1. Sistema de Inspecciones Completo

- **7 pasos del wizard** almacenados como JSON
- Campos dinámicos por tipo de inspección
- Prioridades: baja, media, alta
- Datos estructurados pero flexibles

**Ejemplo de datos almacenados:**
```json
{
  "electricidad": {
    "iluminacion_ubicacion": "interna",
    "iluminacion_bombillo": "LED",
    "tomacorriente_tipo": "doble"
  },
  "aire_acondicionado": {
    "ac_tipo": "mini split",
    "ac_btu": 12000,
    "ac_filtros_limpios": "no"
  },
  "prioridad": {
    "prioridad_tarea": "alta"
  }
}
```

### 2. Estados de Tareas

Los estados mapean directamente al código JavaScript:

| Código Backend | Código SQL | Display |
|----------------|------------|---------|
| `not_started` | `not_started` | No Iniciado |
| `in_progress` | `in_progress` | En Progreso |
| `done` | `done` | Finalizado |

### 3. Imágenes en Base64

Las imágenes se almacenan directamente en la BD como data URLs:

```sql
INSERT INTO imagenes (id_tarea, nombre_archivo, tipo_mime, data_base64)
VALUES (1, 'foto.jpg', 'image/jpeg', 'data:image/jpeg;base64,/9j/4AAQ...');
```

### 4. Seguridad Integrada

- ✅ Hash de contraseñas con bcrypt
- ✅ Bloqueo tras 5 intentos fallidos (15 minutos)
- ✅ Tokens de reset con expiración (30 minutos)
- ✅ Auditoría automática de cambios
- ✅ Control de sesiones

---

## 🔄 Flujo de Trabajo

### Creación de Tarea desde Inspección

```
1. Usuario completa wizard de inspección
   ↓
2. Frontend envía POST /api/tasks con datos JSON
   ↓
3. Backend:
   a) Crea registro en tabla 'inspecciones'
   b) Crea registro en tabla 'tareas' (referencia)
   c) Guarda imágenes en tabla 'imagenes'
   ↓
4. Trigger automático registra en 'historial_estados'
   ↓
5. Vista 'VW_tareas_completas' consolida todo
```

### Actualización de Estado

```
1. Usuario cambia estado en dashboard
   ↓
2. Frontend envía PUT /api/tasks/:id
   ↓
3. Backend llama SP_actualizar_tarea
   ↓
4. Trigger TR_tareas_cambio_estado se activa
   ↓
5. Registro automático en historial_estados
   ↓
6. Actualización de fechas (inicio/fin) automática
```

---

## 📈 Consultas Útiles

### Obtener todas las tareas de un usuario

```sql
SELECT * 
FROM VW_tareas_completas 
WHERE asignado_email = 'juan.perez@empresa.com'
ORDER BY fecha DESC;
```

### Estadísticas generales

```sql
SELECT * FROM VW_dashboard_principal;
```

### Tareas pendientes por prioridad

```sql
SELECT titulo, nombre_estado, prioridad, fecha
FROM VW_tareas_completas
WHERE codigo_estado IN ('not_started', 'in_progress')
ORDER BY 
    CASE prioridad 
        WHEN 'alta' THEN 1 
        WHEN 'media' THEN 2 
        WHEN 'baja' THEN 3 
    END,
    fecha ASC;
```

### Historial de una tarea

```sql
SELECT 
    h.fecha_cambio,
    ea.nombre_estado AS estado_anterior,
    en.nombre_estado AS estado_nuevo,
    u.nombre AS cambiado_por,
    h.comentario
FROM historial_estados h
LEFT JOIN estados ea ON h.estado_anterior = ea.id_estado
LEFT JOIN estados en ON h.estado_nuevo = en.id_estado
LEFT JOIN usuarios u ON h.cambiado_por = u.user_id
WHERE h.id_tarea = 1
ORDER BY h.fecha_cambio DESC;
```

---

## 🛠️ Mantenimiento

### Backup Diario

```sql
BACKUP DATABASE PlanificadorMantenimiento 
TO DISK = 'C:\Backups\PlanificadorMantenimiento.bak'
WITH FORMAT, INIT, NAME = 'Full Backup';
```

### Optimización de Índices

```sql
-- Reorganizar índices
ALTER INDEX ALL ON tareas REORGANIZE;
ALTER INDEX ALL ON imagenes REORGANIZE;

-- Actualizar estadísticas
UPDATE STATISTICS tareas;
UPDATE STATISTICS imagenes;
```

### Limpiar tokens expirados

```sql
DELETE FROM password_reset_tokens
WHERE expires_at < GETDATE() OR used_at IS NOT NULL;
```

---

## 📦 Migración de Datos

Si ya tienes datos en memoria y quieres migrarlos:

```javascript
// Ejemplo: Migrar tareas existentes
const tasksInMemory = [...]; // tus tareas actuales

for (const task of tasksInMemory) {
    await db.query(`
        INSERT INTO tareas (titulo, id_estado, asignado_a, fecha)
        VALUES (@titulo, 
                (SELECT id_estado FROM estados WHERE codigo_estado = @status),
                @assignedTo, 
                @fecha)
    `, {
        titulo: task.title,
        status: task.status,
        assignedTo: task.assignedTo,
        fecha: task.date
    });
}
```

---

## 🧪 Testing

### Test de Conexión

```javascript
const db = require('./config/database');

async function test() {
    const result = await db.query('SELECT COUNT(*) as total FROM usuarios');
    console.log('Total usuarios:', result.recordset[0].total);
}

test();
```

### Test de Procedimientos

```bash
# En SSMS, ejecutar:
EXEC SP_obtener_stats_dashboard;
EXEC SP_obtener_todas_tareas;
```

---

## 📝 Notas Importantes

1. **JSON en SQL Server:** Requiere SQL Server 2016 o superior para soporte JSON nativo
2. **UUIDs:** Se usan `UNIQUEIDENTIFIER` para compatibilidad con el frontend
3. **Fechas:** Se usa `DATETIME2` para mayor precisión
4. **Codificación:** Todos los campos de texto usan `NVARCHAR` para soporte Unicode
5. **Índices:** Ya están optimizados para las consultas más frecuentes

---

## 🔗 Recursos

- [Documentación SQL Server](https://docs.microsoft.com/en-us/sql/)
- [mssql npm package](https://www.npmjs.com/package/mssql)
- [JSON en SQL Server](https://docs.microsoft.com/en-us/sql/relational-databases/json/)

---

## 🆘 Problemas Comunes

### Error: "Cannot open database"

**Solución:** Verificar que el usuario tenga permisos:

```sql
USE master;
GO
CREATE LOGIN [tu_usuario] WITH PASSWORD = 'tu_password';
GO
USE PlanificadorMantenimiento;
GO
CREATE USER [tu_usuario] FOR LOGIN [tu_usuario];
GO
ALTER ROLE db_owner ADD MEMBER [tu_usuario];
GO
```

### Error: "Login failed"

**Solución:** Verificar autenticación mixta en SQL Server Configuration Manager

### Error: "Connection timeout"

**Solución:** Verificar firewall y que SQL Server Browser esté corriendo

---

## 🎉 ¡Todo Listo!

Ahora tienes una base de datos profesional y completa que soporta todas las funcionalidades de tu sistema de Planificador de Mantenimiento.

**Próximos pasos:**
1. ✅ Instalar la base de datos
2. ✅ Configurar conexión en Node.js
3. ✅ Seguir `INSTRUCCIONES_INTEGRACION.md`
4. ✅ Probar endpoints
5. ✅ ¡Disfrutar del sistema completo!

---

**Desarrollado específicamente para:** Sistema de Planificador de Mantenimiento  
**Compatible con:** SQL Server 2016+, Node.js 14+  
**Fecha:** Octubre 2025

