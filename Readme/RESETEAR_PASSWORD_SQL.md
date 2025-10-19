# 🔐 Resetear Contraseña de SQL Server

## Usuario: `db_connect`

---

## ✅ Método 1: Resetear Contraseña (Recomendado)

### Paso 1: Conectarte con Windows Authentication

1. Abre **SQL Server Management Studio (SSMS)**
2. En la ventana de conexión:
   - **Server name**: `localhost` (o el nombre de tu instancia)
   - **Authentication**: Selecciona **"Windows Authentication"**
   - Click en **Connect**

### Paso 2: Ejecutar el Script

Copia y pega esto en una nueva Query (Ctrl+N):

```sql
-- Resetear contraseña del usuario db_connect
ALTER LOGIN db_connect WITH PASSWORD = 'NuevaPassword123!';
GO

-- Verificar que funcionó
SELECT 
    name AS Usuario,
    type_desc AS Tipo,
    is_disabled AS Deshabilitado,
    create_date AS Fecha_Creacion
FROM sys.server_principals 
WHERE name = 'db_connect';
GO

-- Dar permisos a la base de datos (por si acaso)
USE PlanificadorMantenimiento;
GO

-- Si el usuario no existe en la BD, crearlo
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'db_connect')
BEGIN
    CREATE USER db_connect FOR LOGIN db_connect;
END
GO

-- Dar permisos
ALTER ROLE db_owner ADD MEMBER db_connect;
GO

PRINT '✅ Contraseña cambiada exitosamente a: NuevaPassword123!';
```

### Paso 3: Actualizar tu archivo `.env`

Edita el archivo `.env` en la raíz del proyecto:

```env
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=db_connect
DB_PASSWORD=NuevaPassword123!    # ⬅️ Tu nueva contraseña
DB_PORT=1433
DB_ENCRYPT=false
```

**⚠️ Cambia `NuevaPassword123!` por la contraseña que prefieras**

---

## ✅ Método 2: Usar Windows Authentication (Sin Contraseña)

Si prefieres no usar contraseñas, usa Windows Authentication:

### Actualizar `.env`:

```env
# Windows Authentication (sin usuario ni contraseña)
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=
DB_PASSWORD=
DB_PORT=1433
DB_ENCRYPT=false
```

**Deja `DB_USER` y `DB_PASSWORD` vacíos** y automáticamente usará Windows Authentication.

---

## 🧪 Probar la Conexión

Después de cambiar la contraseña, prueba la conexión:

```bash
npm start
```

Deberías ver:
```
═══════════════════════════════════════════════════════
  🚀 SERVIDOR INICIADO EXITOSAMENTE
═══════════════════════════════════════════════════════

  💾 Base de Datos: SQL Server conectado
═══════════════════════════════════════════════════════
```

---

## ❌ Si No Funciona

### Error: "Login failed for user 'db_connect'"

**Solución 1**: Verificar que el usuario existe

```sql
-- Conectado como Windows Authentication
SELECT * FROM sys.server_principals WHERE name = 'db_connect';
```

Si no aparece nada, el usuario no existe. Créalo:

```sql
-- Crear el login
CREATE LOGIN db_connect WITH PASSWORD = 'NuevaPassword123!';
GO

-- Darle acceso a la base de datos
USE PlanificadorMantenimiento;
GO

CREATE USER db_connect FOR LOGIN db_connect;
GO

ALTER ROLE db_owner ADD MEMBER db_connect;
GO
```

**Solución 2**: Verificar que SQL Server permite autenticación mixta

1. En SSMS, clic derecho en el servidor (raíz del árbol)
2. Properties → Security
3. Verificar que esté en **"SQL Server and Windows Authentication mode"**
4. Si lo cambias, reiniciar el servicio SQL Server

### Error: "Cannot open database"

La base de datos no existe. Ejecuta:
```
BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql
```

---

## 📝 Resumen Rápido

### Si quieres usar `db_connect`:
1. ✅ Resetear contraseña con el script de arriba
2. ✅ Actualizar `.env` con la nueva contraseña
3. ✅ Ejecutar `npm start`

### Si prefieres Windows Authentication:
1. ✅ Dejar `DB_USER` y `DB_PASSWORD` vacíos en `.env`
2. ✅ Ejecutar `npm start`

---

## ✅ ¡Listo!

Una vez configurado, tu aplicación se conectará automáticamente a SQL Server.

¿Necesitas más ayuda? Revisa `CONFIGURACION_BD.md`

