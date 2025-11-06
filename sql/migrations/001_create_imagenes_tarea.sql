/* Migration: Create table imagenes_tarea
   Run this script in your SQL Server database used by the app.
*/
CREATE TABLE IF NOT EXISTS imagenes_tarea (
    id_imagen INT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    nombre_archivo NVARCHAR(260) NOT NULL,
    url_path NVARCHAR(512) NOT NULL,
    tipo_mime NVARCHAR(128) NULL,
    tamano_bytes INT NULL,
    uploaded_by INT NULL,
    fecha_subida DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX IX_imagenes_tarea_idtarea ON imagenes_tarea(id_tarea);
