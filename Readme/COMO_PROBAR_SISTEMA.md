# 🧪 Cómo Probar el Sistema Completo

## ✅ Sistema Implementado

Tu aplicación ahora está completamente conectada a SQL Server con:

- ✅ **Login** funcionando
- ✅ **Tareas** guardadas en base de datos
- ✅ **Inspecciones** guardadas con todos los campos
- ✅ **Imágenes** guardadas en base64
- ✅ **Dashboard** con estadísticas en tiempo real

---

## 🚀 Paso 1: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C si está corriendo)
# Luego reiniciar:
npm start
```

Deberías ver:
```
═══════════════════════════════════════════════════════
  🚀 SERVIDOR INICIADO EXITOSAMENTE
═══════════════════════════════════════════════════════

  🌐 URL: http://localhost:3000
  💾 Base de Datos: SQL Server conectado
  
  Credenciales de prueba:
  📧 Email: admin@empresa.com
  🔐 Password: Admin123
═══════════════════════════════════════════════════════
```

---

## 🧪 Paso 2: Probar Login

1. Abre el navegador: **http://localhost:3000**
2. Click en **"Iniciar Sesión"**
3. Ingresa:
   - Email: `admin@empresa.com`
   - Password: `Admin123`
4. Click en **"Iniciar sesión"**
5. ✅ Deberías entrar al dashboard

---

## 📋 Paso 3: Ver Tareas Existentes

En el dashboard, deberías ver las **5 tareas de ejemplo** que vienen en la base de datos:

1. Revisar sistema eléctrico principal - 🔴 No Iniciado
2. Limpiar filtros de aire acondicionado - 🟡 En Proceso  
3. Pintar fachada principal - 🔴 No Iniciado
4. Reparar puerta de emergencia - 🟢 Finalizado
5. Mantenimiento bomba de agua - 🟡 En Proceso

### Probar Cambiar Estado

1. Cambia el estado de una tarea (dropdown)
2. Selecciona un usuario diferente
3. Click en **"Guardar"**
4. ✅ La tarea se actualiza

### Verificar en SQL Server

Abre SSMS y ejecuta:
```sql
USE PlanificadorMantenimiento;
SELECT * FROM tareas ORDER BY fecha_actualizacion DESC;
```

Deberías ver los cambios reflejados! ✅

---

## 🔍 Paso 4: Crear una Inspección Completa

### 1. Ir a la Página de Inspección

Desde el dashboard o directamente:
```
http://localhost:3000/Vistas/inspeccion.html
```

### 2. Completar el Wizard (7 Pasos)

#### **Paso 1: Ubicación**
- Nombre de la tarea: `Inspección Eléctrica Oficina 201`
- Edificio: `Edificio A`
- Piso: `2`
- Oficina/Aula: `201`

#### **Paso 2: Cubierta & Hojalatería** (Opcional - puedes saltarlo)
- Dejar en blanco o llenar según necesites

#### **Paso 3: Pisos / Pintura** (Opcional)
- Tipo de material: Selecciona `cerámica`
- Estado general: `Buen estado`

#### **Paso 4: Electricidad & Aire Acondicionado** ⭐ **IMPORTANTE**
- **Iluminación - Ubicación**: `interna`
- **Tipo de bombillo**: `LED`
- **Tipo de luz**: `luz blanca`
- **Watts**: `12`
- **Tomacorriente tipo**: `doble`
- **Voltaje**: `110v`

#### **Paso 5: Datos / Telefonía**
- Tipo de red: `cableada`

#### **Paso 6: Otros Sistemas** (Opcional)

#### **Paso 7: Prioridad y Observaciones**
- Prioridad: `alta`
- Observaciones: `Todo funcionando correctamente`

### 3. Agregar Imágenes (Opcional)

- Click en **"Seleccionar imágenes"**
- Sube 1 o 2 imágenes (JPG/PNG)
- Deberías ver el preview

### 4. Enviar la Inspección

- Click en **"Enviar Tarea"**
- Deberías ver: `✅ Inspección guardada exitosamente!`
- Te redirige al dashboard

---

## 🔎 Paso 5: Verificar en SQL Server

### Ver la Inspección Guardada

```sql
USE PlanificadorMantenimiento;

-- Ver inspecciones creadas
SELECT 
    id_inspeccion,
    nombre_inspeccion,
    tipo_inspeccion,
    edificio,
    piso,
    ubicacion,
    fecha_creacion
FROM inspecciones
ORDER BY fecha_creacion DESC;
```

### Ver los Campos Específicos

```sql
-- Ver campos de electricidad
SELECT 
    id_inspeccion,
    nombre_inspeccion,
    iluminacion_ubicacion,
    iluminacion_bombillo,
    iluminacion_watts,
    tomacorriente_tipo,
    tomacorriente_voltaje
FROM inspecciones
WHERE iluminacion_ubicacion IS NOT NULL
ORDER BY fecha_creacion DESC;
```

### Ver la Tarea Asociada

```sql
-- Ver tarea creada desde la inspección
SELECT 
    t.id_tarea,
    t.titulo,
    t.estado,
    t.fecha,
    i.nombre_inspeccion,
    i.tipo_inspeccion
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
ORDER BY t.fecha_creacion DESC;
```

### Ver Imágenes Guardadas

```sql
-- Ver imágenes (sin el base64 completo)
SELECT 
    img.id_imagen,
    img.nombre_archivo,
    img.tipo_mime,
    img.tamaño_bytes,
    i.nombre_inspeccion,
    img.fecha_subida
FROM imagenes_inspeccion img
INNER JOIN inspecciones i ON img.id_inspeccion = i.id_inspeccion
ORDER BY img.fecha_subida DESC;

-- Si quieres ver el base64 completo (solo para probar):
-- SELECT data_base64 FROM imagenes_inspeccion WHERE id_imagen = 1;
```

---

## ✅ Checklist de Pruebas

### Login
- [ ] Login exitoso con `admin@empresa.com` / `Admin123`
- [ ] Redirección al dashboard después del login
- [ ] Sesión se mantiene al navegar

### Tareas
- [ ] Ver listado de tareas existentes
- [ ] Cambiar estado de una tarea
- [ ] Cambiar asignado de una tarea
- [ ] Guardar cambios correctamente
- [ ] Ver cambios reflejados en SQL Server

### Inspecciones
- [ ] Completar wizard de inspección (7 pasos)
- [ ] Subir imágenes (1-3 imágenes)
- [ ] Enviar inspección
- [ ] Ver mensaje de éxito
- [ ] Inspección guardada en SQL Server
- [ ] Tarea creada automáticamente
- [ ] Imágenes guardadas en base64

### Dashboard
- [ ] Ver estadísticas actualizadas
- [ ] Gráficos reflejan datos reales
- [ ] Filtros funcionan correctamente

---

## 📊 Consultas Útiles para Monitorear

### Ver Todo lo Creado Hoy

```sql
USE PlanificadorMantenimiento;

-- Inspecciones de hoy
SELECT COUNT(*) AS total_inspecciones_hoy
FROM inspecciones
WHERE CAST(fecha_creacion AS DATE) = CAST(GETDATE() AS DATE);

-- Tareas de hoy
SELECT COUNT(*) AS total_tareas_hoy
FROM tareas
WHERE CAST(fecha_creacion AS DATE) = CAST(GETDATE() AS DATE);

-- Imágenes de hoy
SELECT COUNT(*) AS total_imagenes_hoy
FROM imagenes_inspeccion
WHERE CAST(fecha_subida AS DATE) = CAST(GETDATE() AS DATE);
```

### Ver Estadísticas Generales

```sql
-- Resumen completo
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE activo = 1) AS usuarios_activos,
    (SELECT COUNT(*) FROM inspecciones) AS total_inspecciones,
    (SELECT COUNT(*) FROM tareas) AS total_tareas,
    (SELECT COUNT(*) FROM tareas WHERE estado = 'Finalizado') AS tareas_finalizadas,
    (SELECT COUNT(*) FROM tareas WHERE estado = 'En Proceso') AS tareas_en_proceso,
    (SELECT COUNT(*) FROM tareas WHERE estado = 'No Iniciado') AS tareas_pendientes,
    (SELECT COUNT(*) FROM imagenes_inspeccion) AS total_imagenes;
```

---

## 🎯 Flujo Completo de Prueba

### Escenario: Inspección de Aire Acondicionado

1. **Login**: `admin@empresa.com` / `Admin123`

2. **Ir a Inspecciones**: Click en "Nueva Inspección"

3. **Completar Datos**:
   - Paso 1: Edificio B, Piso 1, Aula 301
   - Paso 4: 
     - AC Tipo: `mini split`
     - BTU: `18000`
     - Gas: `R410A`
     - Filtros limpios: `no`
   - Paso 7: Prioridad `alta`, Observación: "Filtros muy sucios"

4. **Subir Imagen**: 1 foto del aire acondicionado

5. **Enviar**: Click "Enviar Tarea"

6. **Verificar Dashboard**: Ver nueva tarea creada

7. **Verificar SQL**:
   ```sql
   SELECT * FROM inspecciones WHERE id_inspeccion = (SELECT MAX(id_inspeccion) FROM inspecciones);
   SELECT * FROM tareas WHERE id_tarea = (SELECT MAX(id_tarea) FROM tareas);
   SELECT COUNT(*) FROM imagenes_inspeccion;
   ```

---

## 🎉 ¡Sistema Funcionando!

Si todas las pruebas pasan, tu sistema está **100% funcional** y conectado a SQL Server.

### Lo que Funciona:
- ✅ Autenticación con base de datos real
- ✅ Tareas persistidas en SQL Server
- ✅ Inspecciones completas con 150+ campos
- ✅ Imágenes en base64
- ✅ Estados y cambios reflejados en tiempo real
- ✅ Dashboard con estadísticas reales

---

## 📞 Si Algo No Funciona

### Error al Crear Inspección

1. Abre la **consola del navegador** (F12)
2. Ve a la pestaña **Network**
3. Intenta crear la inspección
4. Mira el error en la respuesta
5. Copia el mensaje de error

### Error en el Servidor

Revisa la consola donde está corriendo `npm start` y busca mensajes de error.

### No Se Guardan Datos

Verifica que el usuario `db_connect` tenga permisos:
```sql
USE PlanificadorMantenimiento;
SELECT USER_NAME() AS usuario_actual;
```

---

¡Empieza a probar! 🚀

