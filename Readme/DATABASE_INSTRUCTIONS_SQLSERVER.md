# 📋 Instrucciones de Base de Datos - Planificador de Mantenimiento
## 🎯 **SQL SERVER MANAGEMENT STUDIO**

## 🚀 Instalación Rápida

### 1. **Requisitos Previos**
- SQL Server 2016 o superior
- SQL Server Management Studio (SSMS)
- Permisos de administrador en SQL Server

### 2. **Instalación de la Base de Datos**

#### **Opción A: Desde SSMS (Interfaz Gráfica)**
1. Abrir **SQL Server Management Studio**
2. Conectar al servidor SQL Server
3. Hacer clic derecho en **"Databases"** → **"New Database"**
4. Nombre: `planificador_mantenimiento`
5. Hacer clic derecho en la nueva base de datos → **"New Query"**
6. Copiar y pegar el contenido de `database_schema_sqlserver.sql`
7. Ejecutar con **F5** o **Execute**
8. Repetir para `sample_data_sqlserver.sql`

#### **Opción B: Desde Línea de Comandos**
```cmd
sqlcmd -S localhost -E -i BaseDeDatos\database_schema_sqlserver.sql
sqlcmd -S localhost -E -i BaseDeDatos\sample_data_sqlserver.sql
```

### 3. **Verificación de Instalación**

```sql
-- Verificar que las tablas se crearon correctamente
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Verificar datos de ejemplo
SELECT COUNT(*) as total_tareas FROM tareas;
SELECT COUNT(*) as total_usuarios FROM usuarios;
```

## 📊 Estructura de la Base de Datos

### **Tablas Principales:**

1. **`estados`** - Estados de las tareas (Sin Iniciar, En Proceso, Finalizado, etc.)
2. **`inspecciones`** - Tipos de inspecciones/mantenimiento (19 tipos predefinidos)
3. **`ubicaciones`** - Ubicaciones del edificio (Fachada, Piso, Aula, etc.)
4. **`tareas`** - Tareas de mantenimiento principales
5. **`imagenes_tareas`** - Imágenes asociadas a las tareas
6. **`historial_estados`** - Historial de cambios de estado
7. **`usuarios`** - Usuarios del sistema

### **Vistas Útiles:**
- **`VW_tareas_completa`** - Tareas con información completa
- **`VW_estadisticas_estados`** - Estadísticas por estado

### **Procedimientos Almacenados:**
- **`SP_crear_tareas_inspeccion`** - Crear tareas desde un tipo de inspección
- **`SP_obtener_estadisticas_tareas`** - Obtener estadísticas

### **Triggers:**
- **`TR_tareas_fecha_actualizacion`** - Actualizar fecha automáticamente
- **`TR_cambio_estado_tarea`** - Registrar cambios de estado automáticamente

## 🎯 Tipos de Inspecciones Incluidas

| ID | Tipo de Inspección | Categoría | Frecuencia |
|----|----------------------|-----------|------------|
| 1  | Cubierta de Techos | Preventivo | Mensual |
| 2  | Electricidad | Preventivo | Mensual |
| 3  | Puertas | Preventivo | Trimestral |
| 4  | Pisos | Preventivo | Mensual |
| 5  | Pintura | Preventivo | Anual |
| 6  | Bombas de Agua | Preventivo | Mensual |
| 7  | Aire Acondicionado | Preventivo | Mensual |
| 8  | Ventanas | Preventivo | Trimestral |
| 9  | Barandas | Preventivo | Mensual |
| 10 | Hidrolavados | Preventivo | Semanal |
| 11 | Telefonía | Preventivo | Trimestral |
| 12 | Datos | Preventivo | Mensual |
| 13 | Estructuras de Metal | Preventivo | Semestral |
| 14 | Sistemas Contra Incendios | Preventivo | Mensual |
| 15 | Planta Eléctrica | Preventivo | Mensual |
| 16 | Motores de Portones | Preventivo | Trimestral |
| 17 | Aceras | Preventivo | Mensual |
| 18 | Cordón + Caño | Preventivo | Mensual |
| 19 | Cámaras de Seguridad | Preventivo | Mensual |

## 🏢 Ubicaciones Predefinidas

### **Fachadas:**
- Fachada Principal
- Fachada Lateral Izquierda
- Fachada Lateral Derecha
- Fachada Posterior

### **Pisos:**
- Planta Baja
- Primer Piso
- Segundo Piso
- Tercer Piso

### **Aulas:**
- Aula 101, 102 (Planta Baja)
- Aula 201, 202 (Primer Piso)

### **Exterior:**
- Patio Principal
- Estacionamiento
- Azotea

## 👥 Usuarios por Defecto

| Usuario | Email | Rol | Password |
|---------|-------|-----|----------|
| admin | admin@mantenimiento.com | Admin | password123 |
| jperez | juan.perez@empresa.com | Técnico | password123 |
| crodriguez | carlos.rodriguez@empresa.com | Técnico | password123 |
| mgonzalez | maria.gonzalez@empresa.com | Supervisor | password123 |
| lmartinez | luis.martinez@empresa.com | Técnico | password123 |
| supervisor | supervisor@empresa.com | Supervisor | password123 |

## 🔧 Consultas Útiles

### **Obtener Tareas Pendientes:**
```sql
SELECT * FROM VW_tareas_completa 
WHERE nombre_estado IN ('Sin Iniciar', 'En Proceso')
ORDER BY 
    CASE prioridad 
        WHEN 'Crítica' THEN 1 
        WHEN 'Alta' THEN 2 
        WHEN 'Media' THEN 3 
        WHEN 'Baja' THEN 4 
    END,
    fecha_creacion ASC;
```

### **Estadísticas por Tipo de Inspección:**
```sql
SELECT 
    i.nombre_inspeccion,
    i.categoria,
    COUNT(t.id_tarea) as total_tareas,
    AVG(CAST(t.tiempo_usado AS FLOAT)) as tiempo_promedio_minutos,
    SUM(t.costo_real) as costo_total
FROM inspecciones i
LEFT JOIN tareas t ON i.id_inspeccion = t.id_inspeccion
GROUP BY i.id_inspeccion, i.nombre_inspeccion, i.categoria
ORDER BY total_tareas DESC;
```

### **Tareas por Ubicación:**
```sql
SELECT 
    u.tipo_ubicacion,
    u.nombre_ubicacion,
    COUNT(t.id_tarea) as tareas_pendientes
FROM ubicaciones u
LEFT JOIN tareas t ON u.id_ubicacion = t.id_ubicacion 
    AND t.id_estado IN (1, 2)
GROUP BY u.id_ubicacion, u.tipo_ubicacion, u.nombre_ubicacion
ORDER BY tareas_pendientes DESC;
```

### **Trabajos Especiales:**
```sql
SELECT 
    t.titulo_tarea,
    i.nombre_inspeccion,
    u.nombre_ubicacion,
    t.costo_estimado,
    t.asignado_a,
    t.prioridad
FROM tareas t
LEFT JOIN inspecciones i ON t.id_inspeccion = i.id_inspeccion
LEFT JOIN ubicaciones u ON t.id_ubicacion = u.id_ubicacion
WHERE t.trabajo_especial = 1
AND t.id_estado IN (1, 2, 4)
ORDER BY t.prioridad DESC;
```

### **Usar Procedimiento Almacenado:**
```sql
EXEC SP_obtener_estadisticas_tareas;
```

### **Crear Tareas desde Tipo de Inspección:**
```sql
EXEC SP_crear_tareas_inspeccion 
    @id_inspeccion = 1,  -- ID del tipo de inspección (ej: Cubierta de Techos)
    @ubicacion_ids = '1,2,5',  -- IDs de ubicaciones donde aplicar
    @creado_por = 'Admin';
```

## 📱 Funcionalidades del Sistema

### **✅ Gestión de Tareas:**
- ✅ Crear tareas basadas en tipos de inspección
- ✅ Cambiar estados (Sin Iniciar → En Proceso → Finalizado)
- ✅ Subir imágenes (Antes, Durante, Después, Problema, Solución)
- ✅ Asignar técnicos
- ✅ Registrar tiempos y costos
- ✅ Comentarios y observaciones

### **✅ Tipos de Inspecciones:**
- ✅ 19 tipos predefinidos de mantenimiento
- ✅ Categorías: Preventivo, Correctivo, Predictivo, Otros
- ✅ Frecuencias sugeridas configurables
- ✅ Trabajos Especiales (empresas externas)
- ✅ Sistema de Cotizaciones

### **✅ Estados de Tareas:**
- ✅ Sin Iniciar
- ✅ En Proceso
- ✅ Finalizado
- ✅ Cotizar
- ✅ Cancelado

### **✅ Sistema de Prioridades:**
- ✅ Baja
- ✅ Media
- ✅ Alta
- ✅ Crítica

## 🔄 Flujo de Trabajo

1. **Seleccionar Tipo de Inspección** → Elegir del catálogo de 19 tipos
2. **Crear Tarea** → Asignar ubicación y técnico
3. **Iniciar Trabajo** → Tarea pasa a "En Proceso"
4. **Subir Imágenes** → Documentar el trabajo (Antes/Durante/Después)
5. **Registrar Tiempo/Costo** → Actualizar información real
6. **Marcar Finalizado** → Tarea completada
7. **Historial Automático** → Registro de todos los cambios

## 🛠️ Mantenimiento de la Base de Datos

### **Backup Diario:**
```sql
BACKUP DATABASE planificador_mantenimiento 
TO DISK = 'C:\Backups\planificador_mantenimiento_' + 
    CONVERT(VARCHAR, GETDATE(), 112) + '.bak'
WITH FORMAT, INIT, NAME = 'Full Backup';
```

### **Limpieza de Imágenes Antiguas:**
```sql
-- Eliminar imágenes de tareas finalizadas hace más de 1 año
DELETE it 
FROM imagenes_tareas it
INNER JOIN tareas t ON it.id_tarea = t.id_tarea
WHERE t.fecha_finalizacion < DATEADD(YEAR, -1, GETDATE());
```

### **Optimización:**
```sql
-- Actualizar estadísticas
UPDATE STATISTICS tareas;
UPDATE STATISTICS imagenes_tareas;
UPDATE STATISTICS historial_estados;

-- Reorganizar índices
ALTER INDEX ALL ON tareas REORGANIZE;
```

## 🔗 Conexión desde Node.js

### **Configuración de Conexión:**
```javascript
// Para usar con SQL Server desde Node.js
const sql = require('mssql');

const config = {
    user: 'tu_usuario',
    password: 'tu_password',
    server: 'localhost',
    database: 'planificador_mantenimiento',
    options: {
        encrypt: true, // Usar en Azure
        trustServerCertificate: true // Solo para desarrollo
    }
};
```

### **Instalar Driver:**
```bash
npm install mssql
```

## 📞 Soporte

Para dudas o modificaciones en la base de datos, contactar al administrador del sistema.

---

**Nota:** Este sistema está optimizado para SQL Server con índices apropiados y triggers automáticos para mantener la integridad de los datos.
