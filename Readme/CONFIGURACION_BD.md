# 🔧 Configuración de Base de Datos - Guía Paso a Paso

## ✅ Cambios Realizados

Se ha conectado exitosamente el proyecto con SQL Server. El código está limpio y organizado en las siguientes carpetas:

```
Planificador-De-Mantenimiento/
├── config/
│   ├── database.js          ✅ Configuración de SQL Server
│   └── env.template          ✅ Plantilla de variables de entorno
├── js/
│   ├── routes/
│   │   ├── auth.js          ✅ Rutas de autenticación
│   │   └── tasks.js         ✅ Rutas de tareas
│   └── server.js            ✅ Servidor principal (actualizado)
└── BaseDeDatos/
    └── PlanificadorMantenimiento_NuevaEstructura.sql ✅ Script de BD
```

---

## 📝 Pasos para Configurar

### 1️⃣ Crear Archivo .env

Copia el archivo de plantilla y configúralo:

```bash
# En la raíz del proyecto
copy config\env.template .env
```

Luego **edita el archivo `.env`** con tus credenciales de SQL Server:

```env
# Configuración de Base de Datos SQL Server
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=sa
DB_PASSWORD=TU_PASSWORD_AQUI    # ⚠️ Cambiar por tu contraseña
DB_PORT=1433
DB_ENCRYPT=false
```

**Notas importantes:**
- Cambiar `DB_PASSWORD` por tu contraseña de SQL Server
- Si usas otro usuario, cambiar también `DB_USER`
- Si SQL Server usa otro puerto, cambiar `DB_PORT`

---

### 2️⃣ Ejecutar el Script de Base de Datos

**Opción A: SQL Server Management Studio (SSMS)**

1. Abrir SSMS
2. Conectar a tu servidor SQL Server
3. Abrir el archivo: `BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql`
4. Ejecutar (F5 o botón Ejecutar)
5. Verificar que se creó la base de datos `PlanificadorMantenimiento`

**Opción B: Línea de comandos**

```bash
sqlcmd -S localhost -U sa -P TuPassword -i BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql
```

---

### 3️⃣ Verificar la Instalación

Ejecuta estas consultas en SSMS para verificar:

```sql
-- Usar la base de datos
USE PlanificadorMantenimiento;

-- Ver tablas creadas
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';

-- Ver usuarios de ejemplo
SELECT * FROM usuarios;

-- Ver tareas de ejemplo
SELECT * FROM tareas;
```

Deberías ver:
- ✅ 5 tablas: roles, usuarios, inspecciones, imagenes_inspeccion, tareas
- ✅ 4 usuarios de ejemplo
- ✅ 5 tareas de ejemplo

---

### 4️⃣ Iniciar el Servidor

```bash
npm start
```

Si todo está configurado correctamente, verás:

```
═══════════════════════════════════════════════════════
  🚀 SERVIDOR INICIADO EXITOSAMENTE
═══════════════════════════════════════════════════════

  📋 Planificador de Mantenimiento
  🌐 URL: http://localhost:3000
  💾 Base de Datos: SQL Server conectado
  📝 Ambiente: development

  Credenciales de prueba:
  📧 Email: admin@empresa.com
  🔐 Password: Admin123

═══════════════════════════════════════════════════════
```

---

### 5️⃣ Probar la Aplicación

1. **Abrir el navegador**: `http://localhost:3000`
2. **Iniciar sesión** con:
   - Email: `admin@empresa.com`
   - Password: `Admin123`
3. **Ver el dashboard** con las tareas de ejemplo
4. **Crear una nueva tarea** y verificar que se guarde en la base de datos

---

## 🧪 Probar Endpoints

### Verificar Estado del Servidor

```bash
# En PowerShell o CMD
curl http://localhost:3000/api/status
```

Respuesta esperada:
```json
{
  "status": "ok",
  "message": "Servidor y base de datos funcionando correctamente",
  "database": "SQL Server conectado",
  "timestamp": "2025-10-19T..."
}
```

### Ver Tareas

```bash
curl http://localhost:3000/api/tasks
```

---

## ❌ Solución de Problemas

### Error: "Login failed for user"

**Problema**: Credenciales incorrectas en el archivo `.env`

**Solución**:
1. Verificar que `DB_USER` y `DB_PASSWORD` sean correctos
2. Probar conectándote con SSMS usando esas credenciales
3. Si usas Windows Authentication, configurar según tu caso

### Error: "Cannot open database"

**Problema**: La base de datos no existe

**Solución**:
1. Ejecutar el script SQL: `BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql`
2. Verificar en SSMS que existe la base de datos `PlanificadorMantenimiento`

### Error: "Connection timeout"

**Problema**: SQL Server no está corriendo o el puerto está bloqueado

**Solución**:
1. Verificar que SQL Server esté corriendo (Services → SQL Server)
2. Verificar el puerto en SQL Server Configuration Manager
3. Verificar el firewall

### Error: No se ven los datos en el dashboard

**Problema**: Problema de mapeo de estados

**Solución**:
- La BD usa estados en español: "No Iniciado", "En Proceso", "Finalizado"
- El código ya está actualizado para usar estos nombres

---

## 📊 Estructura de la Base de Datos

### Tabla: roles
- `id_rol` (PK)
- `nombre_rol` (Administrador / Usuario)

### Tabla: usuarios
- `id_usuario` (PK)
- `nombre`
- `email`
- `numero_telefono`
- `password_hash`
- `id_rol` (FK → roles)

### Tabla: tareas
- `id_tarea` (PK)
- `titulo`
- `estado` (No Iniciado / En Proceso / Finalizado)
- `asignado_a`
- `fecha`
- `prioridad` (Alta / Media / Baja)
- `descripcion`

### Tabla: inspecciones
- `id_inspeccion` (PK)
- ~150 campos específicos para 19 tipos de inspección
- `creado_por` (FK → usuarios)

### Tabla: imagenes_inspeccion
- `id_imagen` (PK)
- `id_inspeccion` (FK → inspecciones)
- `data_base64` (imagen en base64)
- `subido_por` (FK → usuarios)

---

## 🎯 Próximos Pasos

1. ✅ **Base de datos conectada** - Completado
2. ⏳ **Actualizar frontend** - Para usar los nuevos endpoints
3. ⏳ **Implementar inspecciones** - Guardar inspecciones completas
4. ⏳ **Subir imágenes** - Guardar imágenes en base64

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. Verifica el archivo `.env`
2. Revisa que SQL Server esté corriendo
3. Confirma que la base de datos existe
4. Revisa los logs del servidor en la consola

---

## 🎉 ¡Listo!

Tu aplicación ahora está conectada a SQL Server y lista para guardar datos de forma persistente.

Para probar:
1. Inicia sesión en http://localhost:3000
2. Crea una tarea
3. Verifica en SQL Server que se guardó:
   ```sql
   USE PlanificadorMantenimiento;
   SELECT * FROM tareas ORDER BY fecha_creacion DESC;
   ```

¡Disfruta tu sistema de mantenimiento! 🚀

