# 🎯 PASOS FINALES PARA PROBAR EL SISTEMA

## ✅ Todo Está Listo

El sistema está **completamente implementado y conectado a SQL Server**. Solo necesitas 3 pasos para probarlo:

---

## 📝 PASO 1: Verificar el Archivo `.env`

Asegúrate de que el archivo `.env` (en la raíz) tenga:

```env
DB_USER=db_connect
DB_PASSWORD=Andres01$
```

✅ Ya debería estar configurado correctamente.

---

## 🔄 PASO 2: Reiniciar el Servidor

**Si el servidor está corriendo**: Detenerlo (Ctrl+C)

**Luego ejecutar**:
```bash
npm start
```

**Deberías ver**:
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

## 🧪 PASO 3: Probar el Sistema

### 3.1 Probar Login ✅
1. Abrir: **http://localhost:3000**
2. Login: `admin@empresa.com` / `Admin123`
3. Deberías entrar al dashboard

### 3.2 Probar Tareas ✅
1. En el dashboard, verás **5 tareas de ejemplo**
2. Cambia el estado de una tarea
3. Click en **"Guardar"**
4. La tarea se actualiza

**Verificar en SQL Server**:
```sql
USE PlanificadorMantenimiento;
SELECT * FROM tareas;
```

### 3.3 Probar Inspección ✅ ⭐ **NUEVO**
1. Ve a: **http://localhost:3000/Vistas/inspeccion.html**
2. Completa el wizard:
   - **Paso 1**: Edificio A, Piso 1, Oficina 101
   - **Paso 4**: Llena datos de electricidad o aire acondicionado
   - **Paso 7**: Prioridad `alta`, Observaciones
3. (Opcional) Sube 1-2 imágenes
4. Click en **"Enviar Tarea"**
5. Deberías ver: `✅ Inspección guardada exitosamente!`
6. Te redirige al dashboard
7. **Nueva tarea creada** automáticamente

**Verificar en SQL Server**:
```sql
USE PlanificadorMantenimiento;

-- Ver inspección creada
SELECT * FROM inspecciones ORDER BY fecha_creacion DESC;

-- Ver tarea asociada
SELECT t.*, i.nombre_inspeccion 
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
ORDER BY t.fecha_creacion DESC;

-- Ver imágenes (si subiste)
SELECT 
    id_imagen,
    nombre_archivo,
    tipo_mime,
    tamaño_bytes
FROM imagenes_inspeccion;
```

---

## 🎉 Si Todo Funciona

Deberías poder:
- ✅ Iniciar sesión
- ✅ Ver tareas en el dashboard
- ✅ Cambiar estados de tareas
- ✅ Ver estadísticas actualizadas
- ✅ Crear inspecciones completas
- ✅ Subir imágenes
- ✅ Ver todo guardado en SQL Server

---

## 📊 Consultas Útiles

### Ver Todo lo que Creaste Hoy

```sql
USE PlanificadorMantenimiento;

-- Inspecciones de hoy
SELECT * FROM inspecciones 
WHERE CAST(fecha_creacion AS DATE) = CAST(GETDATE() AS DATE);

-- Tareas de hoy
SELECT * FROM tareas 
WHERE CAST(fecha_creacion AS DATE) = CAST(GETDATE() AS DATE);

-- Imágenes de hoy
SELECT COUNT(*) AS total_imagenes_hoy 
FROM imagenes_inspeccion
WHERE CAST(fecha_subida AS DATE) = CAST(GETDATE() AS DATE);
```

### Ver Datos Completos de una Inspección

```sql
-- Reemplaza el ID por el de tu inspección
DECLARE @id INT = 1;

-- Datos de la inspección
SELECT * FROM inspecciones WHERE id_inspeccion = @id;

-- Tarea asociada
SELECT * FROM tareas WHERE id_inspeccion = @id;

-- Imágenes
SELECT 
    nombre_archivo,
    tipo_mime,
    tamaño_bytes,
    fecha_subida
FROM imagenes_inspeccion 
WHERE id_inspeccion = @id;
```

---

## ❌ Si Algo Falla

### Error de Conexión a BD
- Verifica que SQL Server esté corriendo
- Revisa el archivo `.env`

### Error 401 en Login
- Ya debería estar resuelto
- Si no, ejecuta: `node scripts/update-admin-password.js`

### No Se Guarda la Inspección
1. Abre la consola del navegador (F12)
2. Ve a la pestaña Network
3. Intenta crear la inspección
4. Mira el error en la respuesta
5. Cópiame el error completo

---

## 📚 Documentación Disponible

Todos los archivos están en la carpeta **`Readme/`**:

- `COMO_PROBAR_SISTEMA.md` - Guía detallada de pruebas
- `IMPLEMENTACION_COMPLETA.md` - Resumen técnico completo
- `ESTRUCTURA_NUEVA_BASE_DE_DATOS.md` - Estructura de BD
- `GUIA_DROPDOWNS_FRONTEND.md` - Referencia de campos

---

## 🎊 ¡Empieza a Probar!

Ejecuta:
```bash
npm start
```

Y abre:
```
http://localhost:3000
```

**¡Disfruta tu sistema de mantenimiento!** 🚀

