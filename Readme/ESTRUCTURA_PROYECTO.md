# 📁 Estructura del Proyecto - Planificador de Mantenimiento

## 🎯 Organización de Archivos

```
Planificador-De-Mantenimiento/
│
├── 📂 Vistas/                       # ⭐ TODOS LOS ARCHIVOS HTML
│   ├── index.html                   # Página principal/landing
│   ├── login.html                   # Página de inicio de sesión
│   ├── dashboard.html               # Panel de control principal
│   ├── inspeccion.html              # Formulario de inspección (7 pasos)
│   └── reset.html                   # Página de reset de contraseña
│
├── 📂 js/                           # ⭐ TODOS LOS ARCHIVOS JAVASCRIPT
│   ├── server.js                    # Servidor Node.js/Express
│   ├── app.js                       # Lógica de la página principal
│   ├── dashboard.js                 # Lógica del dashboard
│   ├── inspeccion.js                # Wizard de inspección (completo)
│   ├── inspeccion-nav.js            # Navegación de inspección
│   ├── login.js                     # Lógica de autenticación
│   ├── protect-dashboard.js         # Protección de rutas
│   ├── ejemplo-config-database.js   # Ejemplo de configuración BD
│   └── test-conexion.js             # Script de prueba de BD
│
├── 📂 Styles/                       # ⭐ TODOS LOS ARCHIVOS CSS
│   └── styles.css                   # Estilos globales del proyecto
│
├── 📂 BaseDeDatos/                  # ⭐ TODOS LOS ARCHIVOS SQL Y DOCS
│   ├── PlanificadorMantenimiento_BaseDeDatos_Completa.sql  # ⭐ BD PRINCIPAL
│   ├── database_schema_sqlserver.sql                        # Schema antiguo
│   ├── sample_data_sqlserver.sql                            # Datos antiguo
│   ├── README.md                                            # Guía rápida
│   ├── INSTRUCCIONES_INTEGRACION.md                         # Guía detallada
│   ├── DIAGRAMA_BASE_DE_DATOS.txt                           # Diagramas visuales
│   └── DATABASE_INSTRUCTIONS_SQLSERVER.md                   # Instrucciones SQL
│
├── 📂 charts/                       # Imágenes de gráficos (Python)
│   ├── by_assignee.png
│   ├── state_done.png
│   ├── state_in_progress.png
│   ├── state_not_started.png
│   ├── status_bar.png
│   └── status_pie.png
│
├── 📂 scripts/                      # Scripts auxiliares
│   ├── generate_charts.py          # Generador de gráficos
│   ├── e2e_inspeccion.js           # Tests e2e
│   ├── e2e_result.json             # Resultados de tests
│   ├── requirements.txt            # Dependencias Python
│   └── sample.png                  # Imagen de muestra
│
├── 📂 config/                       # ⚙️ Configuración (crear esta carpeta)
│   └── database.js                 # Copiar de js/ejemplo-config-database.js
│
├── 📄 package.json                  # Dependencias Node.js
├── 📄 package-lock.json             # Lock de dependencias
├── 📄 .env                          # Variables de entorno (crear)
├── 📄 .gitignore                    # Archivos ignorados por Git
├── 📄 README.md                     # Documentación principal
└── 📄 ESTRUCTURA_PROYECTO.md        # Este archivo
```

---

## 📋 Referencias Actualizadas

### Archivos HTML (Carpeta Vistas/)

| Archivo | Referencia JavaScript | Estado |
|---------|----------------------|--------|
| `Vistas/index.html` | `js/app.js` | ✅ Actualizado |
| `Vistas/login.html` | `js/login.js` | ✅ Actualizado |
| `Vistas/dashboard.html` | `js/dashboard.js` + `js/protect-dashboard.js` | ✅ Actualizado |
| `Vistas/inspeccion.html` | `js/inspeccion.js` + `js/inspeccion-nav.js` | ✅ Actualizado |
| `Vistas/reset.html` | - | ✅ Actualizado |

### package.json

```json
{
  "main": "js/server.js",
  "scripts": {
    "start": "node js/server.js",
    "dev": "nodemon js/server.js"
  }
}
```

---

## 🚀 Comandos de Inicio

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Iniciar el Servidor
```bash
npm start
```

**O en modo desarrollo:**
```bash
npm run dev
```

### 3. Acceder a la Aplicación
```
http://localhost:3000
```

---

## 🗄️ Configuración de Base de Datos

### Paso 1: Crear la Base de Datos
```sql
-- En SQL Server Management Studio:
-- Abrir: BaseDeDatos/PlanificadorMantenimiento_BaseDeDatos_Completa.sql
-- Ejecutar: F5
```

### Paso 2: Crear Carpeta de Configuración
```bash
mkdir config
```

### Paso 3: Copiar Archivo de Configuración
```bash
copy js\ejemplo-config-database.js config\database.js
```

### Paso 4: Configurar Variables de Entorno
Crear archivo `.env` en la raíz:
```env
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=tu_usuario
DB_PASSWORD=tu_password
SESSION_SECRET=tu-secreto-seguro
```

### Paso 5: Probar Conexión
```bash
node js/test-conexion.js
```

---

## 📦 Archivos por Categoría

### 🌐 Frontend (HTML/CSS/JS Client-Side)
- `Vistas/index.html` → `js/app.js`
- `Vistas/login.html` → `js/login.js`
- `Vistas/dashboard.html` → `js/dashboard.js` + `js/protect-dashboard.js`
- `Vistas/inspeccion.html` → `js/inspeccion.js` + `js/inspeccion-nav.js`
- `Vistas/reset.html`
- `Styles/styles.css`

### ⚙️ Backend (Node.js/Express)
- `js/server.js` - Servidor principal
- `config/database.js` - Configuración BD (crear)

### 🗄️ Base de Datos
- `BaseDeDatos/PlanificadorMantenimiento_BaseDeDatos_Completa.sql` - **Principal**
- `BaseDeDatos/*.md` - Documentación

### 🧪 Testing y Scripts
- `js/test-conexion.js` - Probar conexión BD
- `scripts/e2e_inspeccion.js` - Tests E2E
- `scripts/generate_charts.py` - Generar gráficos

### 📚 Documentación
- `README.md` - Documentación principal
- `BaseDeDatos/README.md` - Guía de BD
- `BaseDeDatos/INSTRUCCIONES_INTEGRACION.md` - Integración
- `ESTRUCTURA_PROYECTO.md` - Este archivo

---

## 🔧 Próximos Pasos

1. ✅ **Archivos organizados** - Completado
2. ⏳ **Crear carpeta config/** y copiar configuración
3. ⏳ **Crear archivo .env** con credenciales
4. ⏳ **Instalar dependencias SQL Server**: `npm install mssql`
5. ⏳ **Ejecutar script SQL** en SQL Server Management Studio
6. ⏳ **Probar conexión** con `node js/test-conexion.js`
7. ⏳ **Actualizar server.js** para usar la base de datos
8. ⏳ **Probar el sistema** con `npm start`

---

## 📝 Notas Importantes

- ✅ Todos los `.html` ahora están en la carpeta `Vistas/`
- ✅ Todos los `.js` ahora están en la carpeta `js/`
- ✅ Todos los `.css` ahora están en la carpeta `Styles/`
- ✅ Todos los `.sql` ahora están en la carpeta `BaseDeDatos/`
- ✅ Todos los `.md` ahora están en la carpeta `Readme/`
- ✅ Las referencias JavaScript a HTML están actualizadas
- ✅ Las referencias HTML a CSS están actualizadas
- ✅ El `package.json` apunta a `js/server.js`
- ✅ El `js/server.js` sirve archivos desde la raíz y HTML desde `Vistas/`
- 📌 **Crear la carpeta `config/`** manualmente
- 📌 **No subir `.env`** a Git (ya está en `.gitignore`)

---

**Última actualización:** Octubre 2025  
**Estado:** Organización completada ✅

