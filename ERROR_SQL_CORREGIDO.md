# 🔧 ERROR CORREGIDO - Problema en UPDATE SQL

## ✅ Problema Identificado y Solucionado

El error **500** estaba causado por un problema en la consulta SQL del endpoint `PUT /api/tasks/:id`.

### **Causa del Error:**
- Usaba `OUTPUT INSERTED.*` en un `UPDATE` statement
- En SQL Server, `INSERTED` solo funciona con `INSERT`, no con `UPDATE`
- Para `UPDATE` se debe usar `OUTPUT` sin `INSERTED`

### **Solución:**
✅ **Corregido la consulta SQL** en `js/routes/tasks.js` línea 159-165  
✅ **Cambiado `OUTPUT INSERTED.*` por `OUTPUT`** en UPDATE

---

## 🚀 Para Probar Ahora:

### **1️⃣ Reinicia el servidor:**
```bash
npm start
```

### **2️⃣ Prueba el dropdown:**
1. Selecciona un usuario del dropdown
2. Click en "Guardar"
3. ✅ **Ya NO debería dar error 500**

---

## 🔧 Cambio Específico:

**Antes (INCORRECTO):**
```sql
UPDATE tareas
SET estado = @estado, asignado_a = @asignado_a
OUTPUT INSERTED.id_tarea, INSERTED.titulo, INSERTED.estado  -- ❌ ERROR
WHERE id_tarea = @id_tarea
```

**Después (CORRECTO):**
```sql
UPDATE tareas
SET estado = @estado, asignado_a = @asignado_a
OUTPUT id_tarea, titulo, estado, asignado_a  -- ✅ CORRECTO
WHERE id_tarea = @id_tarea
```

---

**¡Reinicia el servidor y prueba!** 🚀

El error 500 ya no debería aparecer.

