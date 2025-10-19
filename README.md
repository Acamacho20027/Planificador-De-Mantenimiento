# 📋 Planificador de Mantenimiento

Sistema completo de planificación y gestión de mantenimiento con Node.js, JavaScript y SQL Server.

---

## 🎯 Características Principales

- ✅ **Sistema de Inspecciones Completo** - 19 tipos de inspecciones con campos específicos
- ✅ **Gestión de Tareas** - Estados visuales con colores (🔴 No Iniciado, 🟡 En Proceso, 🟢 Finalizado)
- ✅ **Sistema de Usuarios** - Roles (Administrador/Usuario) con autenticación segura
- ✅ **Subida de Imágenes** - Almacenamiento en base64 relacionadas con inspecciones
- ✅ **Dashboard Interactivo** - Estadísticas y gráficos en tiempo real
- ✅ **Base de Datos SQL Server** - Estructura optimizada con ~200 campos

---

## 📚 Documentación Completa

Toda la documentación está en la carpeta **[`Readme/`](Readme/)**.

### 🚀 Guía de Inicio Rápido

1. **[📖 README - Documentación](Readme/README.md)** ⭐ **EMPEZAR AQUÍ**
   - Índice completo de toda la documentación
   - Guía de lectura por rol (Backend/Frontend/DBA)

2. **[📦 Instalación](Readme/INSTRUCCIONES_INSTALACION.md)**
   - Instalación paso a paso de SQL Server
   - Configuración de Node.js
   - Ejemplos de código backend

3. **[📋 Resumen de Cambios](Readme/RESUMEN_CAMBIOS.md)**
   - Qué cambió de la estructura anterior
   - Características implementadas
   - Checklist de requisitos

4. **[🎨 Guía Frontend](Readme/GUIA_DROPDOWNS_FRONTEND.md)**
   - Dropdowns y campos para cada inspección
   - Tipos de input (text/select/checkbox)

5. **[💻 Ejemplos de Código](Readme/EJEMPLO_IMPLEMENTACION_FRONTEND.md)**
   - JavaScript completo funcional
   - Formulario dinámico
   - Tabla de tareas con colores

---

## ⚡ Instalación Rápida

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Instalar Base de Datos

Ejecutar en SQL Server Management Studio:
```sql
-- Abrir y ejecutar:
BaseDeDatos/PlanificadorMantenimiento_NuevaEstructura.sql
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Base de datos
DB_SERVER=localhost
DB_NAME=PlanificadorMantenimiento
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_PORT=1433

# JWT
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=24h

# Puerto del servidor
PORT=3000
```

### 4. Iniciar Servidor

```bash
npm start
```

**O en modo desarrollo:**
```bash
npm run dev
```

### 5. Acceder a la Aplicación

```
http://localhost:3000
```

---

## 🔐 Credenciales de Prueba

```
Email: admin@empresa.com
Password: Admin123
```

---

## 📊 Estructura de la Base de Datos

### Tablas Principales

- **`roles`** - Tipos de usuario (Administrador/Usuario)
- **`usuarios`** - Información de usuarios (nombre, email, teléfono, rol)
- **`inspecciones`** - 19 tipos con ~150 campos específicos
- **`imagenes_inspeccion`** - Imágenes en base64 relacionadas con inspecciones
- **`tareas`** - Tareas con estados y prioridades

### 19 Tipos de Inspección

1. Cubierta de Techos (Lámina, Hojalatería, Tornillería, Canoas, Bajante)
2. Electricidad (Iluminación, Tomacorriente, Centros de Carga, Generador, Supresor)
3. Puertas
4. Pisos
5. Pintura
6. Bombas de Agua
7. Aire Acondicionado
8. Ventanas
9. Barandas
10. Hidro Lavados
11. Telefonía
12. Datos
13. Estructuras de Metal
14. Sistemas Contra Incendios
15. Planta Eléctrica
16. Motores de Portones
17. Aceras
18. Cordón + Caño
19. Cámaras de Seguridad

---

## 🗂️ Estructura del Proyecto

```
Planificador-De-Mantenimiento/
│
├── 📂 Vistas/                  # Archivos HTML
│   ├── index.html              # Página principal
│   ├── login.html              # Login
│   ├── dashboard.html          # Dashboard
│   ├── inspeccion.html         # Formulario de inspección
│   └── reset.html              # Reset de contraseña
│
├── 📂 js/                      # JavaScript
│   ├── server.js               # Servidor Node.js/Express
│   ├── app.js                  # Lógica página principal
│   ├── dashboard.js            # Lógica dashboard
│   ├── inspeccion.js           # Wizard de inspección
│   ├── login.js                # Autenticación
│   └── ...
│
├── 📂 Styles/                  # CSS
│   └── styles.css              # Estilos globales
│
├── 📂 BaseDeDatos/             # ⭐ Base de Datos SQL
│   ├── PlanificadorMantenimiento_NuevaEstructura.sql  # ⭐ SCRIPT PRINCIPAL
│   └── DIAGRAMA_NUEVA_ESTRUCTURA.txt                  # Diagrama visual
│
├── 📂 Readme/                  # 📚 Documentación
│   ├── README.md                              # Índice de documentación
│   ├── RESUMEN_CAMBIOS.md                     # Resumen de cambios
│   ├── ESTRUCTURA_NUEVA_BASE_DE_DATOS.md      # Documentación técnica
│   ├── GUIA_DROPDOWNS_FRONTEND.md             # Guía para frontend
│   ├── INSTRUCCIONES_INSTALACION.md           # Instalación
│   └── EJEMPLO_IMPLEMENTACION_FRONTEND.md     # Ejemplos código
│
├── 📂 charts/                  # Gráficos
├── 📂 scripts/                 # Scripts auxiliares
├── 📄 package.json             # Dependencias Node.js
├── 📄 .env                     # Variables de entorno (crear)
└── 📄 README.md                # Este archivo
```

---

## 🚀 Próximos Pasos

### Para el Frontend

1. Implementar formulario dinámico de inspecciones
   - Usar [GUIA_DROPDOWNS_FRONTEND.md](Readme/GUIA_DROPDOWNS_FRONTEND.md)
   - Código de ejemplo en [EJEMPLO_IMPLEMENTACION_FRONTEND.md](Readme/EJEMPLO_IMPLEMENTACION_FRONTEND.md)

2. Actualizar vista de tareas con colores
   - 🔴 No Iniciado
   - 🟡 En Proceso
   - 🟢 Finalizado

3. Implementar subida de imágenes en base64

### Para el Backend

1. Actualizar endpoints para nueva estructura
2. Implementar autenticación con roles
3. Usar procedimientos almacenados de la BD
4. Crear endpoints de inspecciones

---

## 🛠️ Tecnologías

- **Backend**: Node.js, Express
- **Base de Datos**: SQL Server 2016+
- **Frontend**: JavaScript Vanilla, HTML5, CSS3
- **Autenticación**: bcrypt, JWT
- **Gráficos**: Chart.js (próximamente)

---

## 📝 Comandos Útiles

### Desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo (con recarga automática)
npm run dev

# Iniciar servidor
npm start

# Probar conexión a BD
node js/test-conexion.js
```

### Base de Datos

```sql
-- Verificar tablas creadas
USE PlanificadorMantenimiento;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';

-- Ver estadísticas
SELECT * FROM VW_estadisticas_tareas;

-- Backup
BACKUP DATABASE PlanificadorMantenimiento TO DISK = 'C:\Backups\bd.bak';
```

---

## 📞 Soporte

Para preguntas o problemas:

1. **Documentación General**: Consultar [Readme/README.md](Readme/README.md)
2. **Instalación**: Ver [INSTRUCCIONES_INSTALACION.md](Readme/INSTRUCCIONES_INSTALACION.md)
3. **Frontend**: Revisar [GUIA_DROPDOWNS_FRONTEND.md](Readme/GUIA_DROPDOWNS_FRONTEND.md)

---

## 📊 Estadísticas del Proyecto

- **5 tablas** principales en la BD
- **~200 campos** totales
- **19 tipos de inspección** completos
- **10 índices** para optimización
- **3 triggers** automáticos
- **2 vistas** útiles
- **5 procedimientos** almacenados

---

## ✅ Estado del Proyecto

🟢 **Base de Datos**: Completa y documentada  
🟡 **Backend**: En desarrollo  
🟡 **Frontend**: En desarrollo  

---

**Desarrollado para:** Gestión eficiente de mantenimiento  
**Compatible con:** SQL Server 2016+, Node.js 14+  
**Fecha:** Octubre 2025  
**Versión BD:** 2.0
