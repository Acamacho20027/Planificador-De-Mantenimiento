# Planificador de Mantenimiento

Sistema web para la planificación y gestión de mantenimiento de equipos e instalaciones.

## Tecnologías

- **Node.js** - Servidor backend
- **JavaScript** - Funcionalidad frontend
- **Python** - Análisis y procesamiento (próximamente)
- **HTML/CSS** - Interfaz de usuario

## Estructura del Proyecto

```
Planificador_De_Mantenimiento/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── app.js              # JavaScript del cliente
├── server.js           # Servidor Node.js
├── package.json        # Dependencias de Node.js
└── README.md           # Este archivo
```

## Instalación

1. Asegúrate de tener Node.js instalado en tu sistema

2. Instala las dependencias:
```bash
npm install
```

## Uso

### Modo Desarrollo

Para iniciar el servidor en modo desarrollo con recarga automática:

```bash
npm run dev
```

### Modo Producción

Para iniciar el servidor:

```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## Características

- ✅ Interfaz de usuario moderna y responsive
- ✅ Sistema de navegación fluida
- ✅ Formulario de contacto
- ✅ Servidor Node.js con Express
- ✅ API REST básica
- 🔄 Gestión de equipos (próximamente)
- 🔄 Programación de mantenimiento (próximamente)
- 🔄 Reportes y análisis (próximamente)

## API Endpoints

### GET /api/status
Verifica el estado del servidor

### POST /api/contact
Envía un mensaje de contacto

**Body:**
```json
{
  "nombre": "Tu nombre",
  "email": "tu@email.com",
  "telefono": "+34 123 456 789",
  "mensaje": "Tu mensaje"
}
```

## Próximos Pasos

1. Integración con base de datos
2. Sistema de autenticación de usuarios
3. Panel de administración
4. Módulo de gestión de equipos
5. Sistema de programación de mantenimiento
6. Generación de reportes
7. Integración con Python para análisis predictivo

## Licencia

ISC

## Autor

Desarrollado para la gestión eficiente de mantenimiento

