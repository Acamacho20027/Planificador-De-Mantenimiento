# 🚀 INICIO RÁPIDO - 3 Pasos para Empezar

## ⚠️ IMPORTANTE: Configurar ANTES de iniciar

### 1️⃣ Configurar Credenciales de SQL Server

Edita el archivo **`.env`** (ya existe en la raíz) y cambia la contraseña:

```env
DB_PASSWORD=TU_PASSWORD_AQUI    # ⬅️ CAMBIAR ESTO
```

**Ubicación**: Raíz del proyecto → `.env`

---

### 2️⃣ Ejecutar el Script de Base de Datos

Abre **SQL Server Management Studio** y ejecuta:

```
📂 BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql
```

Esto creará:
- ✅ Base de datos `PlanificadorMantenimiento`
- ✅ 5 tablas
- ✅ Datos de ejemplo
- ✅ Usuario administrador

---

### 3️⃣ Iniciar el Servidor

```bash
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

## ✅ ¡Listo!

Abre tu navegador en:
```
http://localhost:3000
```

Inicia sesión con:
- **Email**: `admin@empresa.com`
- **Password**: `Admin123`

---

## ❌ Si hay Errores

Si ves error de conexión:

1. ✅ Verifica que SQL Server esté corriendo
2. ✅ Revisa el archivo `.env` (contraseña correcta)
3. ✅ Confirma que ejecutaste el script SQL

**Ver guía completa**: `CONFIGURACION_BD.md`

---

## 📁 Archivos Importantes

- **`.env`** - Configuración de base de datos ⚙️
- **`BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql`** - Script SQL 💾
- **`CONFIGURACION_BD.md`** - Guía detallada 📖

---

¡Tu aplicación está lista para usar! 🎉

