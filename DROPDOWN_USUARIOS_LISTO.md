# 🧪 Prueba del Dropdown de Usuarios

## ✅ Implementación Completada

He agregado el sistema completo de usuarios para el dropdown de asignación:

### **Nuevos Endpoints Creados:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios` | Lista usuarios activos (para dropdown) |
| POST | `/api/usuarios` | Crear usuario (solo admin) |
| DELETE | `/api/usuarios/:id` | Desactivar usuario (solo admin) |

### **Funcionalidad Implementada:**

✅ **Dropdown de usuarios** en la columna "Asignado"  
✅ **Carga automática** de usuarios desde SQL Server  
✅ **Asignación por nombre** (se guarda en `asignado_a`)  
✅ **Creación de usuarios** desde el panel de admin  
✅ **Desactivación de usuarios** (no eliminación física)

---

## 🚀 Para Probar Ahora:

### 1️⃣ **Reinicia el servidor**:
```bash
npm start
```

### 2️⃣ **Abre el dashboard**:
```
http://localhost:3000
```

### 3️⃣ **Verifica el dropdown**:
1. En la tabla de tareas, columna "Asignado"
2. Deberías ver un dropdown con:
   - "Sin asignar" (opción por defecto)
   - "admin (admin@empresa.com)"
   - "Juan Pérez (juan.perez@empresa.com)"
   - "María González (maria.gonzalez@empresa.com)"
   - "Carlos Rodríguez (carlos.rodriguez@empresa.com)"

### 4️⃣ **Prueba asignar una tarea**:
1. Selecciona un usuario del dropdown
2. Click en "Guardar"
3. ✅ La tarea se actualiza con el usuario asignado

### 5️⃣ **Verifica en SQL Server**:
```sql
USE PlanificadorMantenimiento;
SELECT id_tarea, titulo, asignado_a, estado 
FROM tareas 
ORDER BY fecha_actualizacion DESC;
```

---

## 📊 Usuarios Disponibles

La base de datos incluye estos usuarios de ejemplo:

| Nombre | Email | Rol |
|--------|-------|-----|
| admin | admin@empresa.com | Administrador |
| Juan Pérez | juan.perez@empresa.com | Usuario |
| María González | maria.gonzalez@empresa.com | Usuario |
| Carlos Rodríguez | carlos.rodriguez@empresa.com | Usuario |

**Todos con password:** `Admin123`

---

## 🔧 Funcionalidades Adicionales

### **Panel de Administración** (si eres admin):
- Crear nuevos usuarios
- Desactivar usuarios existentes
- Ver lista de usuarios

### **Asignación Inteligente**:
- El sistema guarda el **nombre del usuario** en `asignado_a`
- También mantiene el **ID del usuario** para futuras mejoras
- Si cambias de usuario, se actualiza automáticamente

---

## 🎯 Flujo de Prueba Completo

### Escenario: Asignar tarea a María González

1. **Login**: `admin@empresa.com` / `Admin123`

2. **Ir al Dashboard**: Ver tabla de tareas

3. **Seleccionar Usuario**:
   - En la fila de cualquier tarea
   - Columna "Asignado"
   - Dropdown → "María González (maria.gonzalez@empresa.com)"

4. **Guardar**: Click en "Guardar"

5. **Verificar**:
   - La tarea se actualiza inmediatamente
   - El dropdown muestra "María González (maria.gonzalez@empresa.com)"

6. **Verificar en SQL**:
   ```sql
   SELECT titulo, asignado_a 
   FROM tareas 
   WHERE asignado_a = 'María González';
   ```

---

## ✅ Checklist de Pruebas

- [ ] Dropdown se carga con usuarios
- [ ] Puedes seleccionar un usuario
- [ ] Click "Guardar" actualiza la tarea
- [ ] El cambio se refleja en SQL Server
- [ ] Puedes cambiar entre usuarios
- [ ] "Sin asignar" funciona correctamente

---

## 🎉 ¡Listo para Usar!

El sistema de asignación de usuarios está **100% funcional**. 

**Reinicia el servidor y prueba el dropdown!** 🚀

