Migration: imagenes_tarea
=========================

Este archivo explica el propósito y uso del script de migración `001_create_imagenes_tarea.sql` incluido en `sql/migrations/`.

Propósito
--------
- Crear la tabla `imagenes_tarea` que almacena metadatos de las imágenes subidas por usuarios para cada tarea.
- Campos: id_imagen, id_tarea, nombre_archivo, url_path, tipo_mime, tamano_bytes, uploaded_by, fecha_subida.

Uso rápido
---------
1. Abrir una terminal con acceso al servidor SQL (o usar tu herramienta SQL favorita).
2. Ejecutar el script contra la base de datos usada por la aplicación.

Ejemplo con `sqlcmd` (PowerShell):

```powershell
sqlcmd -S <server> -U <user> -P <password> -d <database> -i sql\migrations\001_create_imagenes_tarea.sql
```

Comportamiento de la aplicación
-------------------------------
- `POST /api/tasks/:id/images`: después de guardar los archivos en `uploads/tasks/:id/` la API intentará insertar metadata en `imagenes_tarea`. Si ocurre un error en la inserción (tabla inexistente, permisos, etc.) la inserción se registra como advertencia y la subida no falla.
- `GET /api/tasks/:id/images`: si la tabla `imagenes_tarea` existe la API devolverá las filas desde la BD (incluyendo uploadedBy y uploadedAt). Si la tabla no existe o falla la consulta, la API retorna un listado de archivos desde el filesystem.

Notas
-----
- `uploaded_by` en la tabla se guarda como INT. El servidor intentará mapear `req.session.userId` a número cuando sea posible.
- Si tu sistema usa otro esquema de usuarios (por ejemplo `user_id` con GUIDs o strings), adapta la columna `uploaded_by` y la inserción en `js/routes/tasks.js`.
