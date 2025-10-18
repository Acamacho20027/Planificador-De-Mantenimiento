# Planificador de Mantenimiento
## Autenticación (lista para DB SQL Server)

Este proyecto incluye autenticación basada en sesión con:
- Inicio de sesión (`POST /auth/login`) con bloqueo tras 5 intentos fallidos (15 min)
- Cierre de sesión (`POST /auth/logout`)
- Usuario actual (`GET /auth/me`)
- Solicitud de restablecimiento de contraseña (`POST /auth/request-password-reset`)
- Restablecimiento de contraseña (`POST /auth/reset-password`)

Se usa un almacén en memoria para usuarios y tokens, listo para ser reemplazado por Microsoft SQL Server.

### Variables de entorno

Defínelas en el entorno antes de arrancar:

```
SESSION_SECRET=coloca_un_secreto_seguro
RESET_TOKEN_SECRET=coloca_un_secreto_hmac_seguro
NODE_ENV=development
PORT=3000
```

Para futura base de datos SQL Server (no usadas aún):

```
MSSQL_SERVER=localhost
MSSQL_DATABASE=Planificador
MSSQL_USER=usuario
MSSQL_PASSWORD=contraseña
MSSQL_ENCRYPT=true
```

### Usuario demo

Al iniciar el servidor se crea automáticamente:

```
Email: demo@empresa.com
Password: Demo1234!
```

### Flujo de uso

1. Abrir `http://localhost:3000/` y pulsar "Iniciar Sesión".
2. Iniciar sesión con el usuario demo.
3. Desde la página de login, usar "¿Olvidaste tu contraseña?" para generar un enlace (en modo demo el enlace aparece en la consola del servidor) y completar el cambio en `reset.html`.

### Seguridad

- Cookies de sesión HttpOnly y SameSite=Lax.
- CSRF (`/auth/csrf`) para operaciones de estado.
- Rate limiting en login y reset.
- Hash de contraseñas con Argon2id.

### Sustitución por SQL Server

Los puntos a reemplazar:
- `users` (Map en memoria) por tabla `dbo.Users`.
- `passwordResetTokens` (Map) por tabla `dbo.PasswordResetTokens`.
- Operaciones de lectura/escritura en `server.js` deben traducirse a consultas SQL usando `mssql` o un ORM.


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

