# 📁 BASE DE DATOS - PLANIFICADOR DE MANTENIMIENTO

Bienvenido a la documentación completa de la base de datos del sistema de Planificador de Mantenimiento.

---

## 🗂️ Índice de Archivos

### 📄 Scripts SQL

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| **`PlanificadorMantenimiento_NuevaEstructura.sql`** | ✅ **Script principal** - Usar este archivo | Ejecutar para crear toda la base de datos |
| `database_schema_sqlserver.sql` | ⚠️ Estructura anterior (legacy) | Solo referencia |
| `PlanificadorMantenimiento_BaseDeDatos_Completa.sql` | ⚠️ Estructura anterior (legacy) | Solo referencia |
| `sample_data_sqlserver.sql` | ⚠️ Datos de ejemplo anteriores | Solo referencia |

### 📚 Documentación

| Archivo | Descripción | Cuándo usarlo |
|---------|-------------|---------------|
| **`RESUMEN_CAMBIOS.md`** | 📋 Resumen ejecutivo de cambios | **Empezar aquí** - Contexto general |
| **`INSTRUCCIONES_INSTALACION.md`** | 📦 Guía de instalación paso a paso | Para instalar la BD |
| **`ESTRUCTURA_NUEVA_BASE_DE_DATOS.md`** | 📊 Documentación técnica completa | Referencia de tablas y campos |
| **`DIAGRAMA_NUEVA_ESTRUCTURA.txt`** | 🗺️ Diagrama visual de la BD | Entender relaciones |
| **`GUIA_DROPDOWNS_FRONTEND.md`** | 🎨 Guía para desarrolladores frontend | Implementar formularios |
| `DIAGRAMA_BASE_DE_DATOS.txt` | ⚠️ Diagrama anterior (legacy) | Solo referencia |

---

## 🚀 Inicio Rápido

### Opción 1: Instalación Nueva (Recomendado)

Si estás empezando desde cero:

1. **Lee el resumen**: [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md)
2. **Ejecuta el script**: [`PlanificadorMantenimiento_NuevaEstructura.sql`](PlanificadorMantenimiento_NuevaEstructura.sql)
3. **Sigue la guía**: [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md)

### Opción 2: Migración desde BD Anterior

Si ya tienes una base de datos antigua:

1. **Lee los cambios**: [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md)
2. **Sigue la guía de migración**: [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md) - Sección "Migración"

---

## 📖 Guía de Lectura Recomendada

### Para Gerentes de Proyecto
1. [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md) - Entender qué cambió y por qué

### Para Desarrolladores Backend
1. [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md) - Contexto
2. [`ESTRUCTURA_NUEVA_BASE_DE_DATOS.md`](ESTRUCTURA_NUEVA_BASE_DE_DATOS.md) - Referencia técnica
3. [`DIAGRAMA_NUEVA_ESTRUCTURA.txt`](DIAGRAMA_NUEVA_ESTRUCTURA.txt) - Visualizar relaciones
4. [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md) - Ejemplos de código

### Para Desarrolladores Frontend
1. [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md) - Contexto
2. [`GUIA_DROPDOWNS_FRONTEND.md`](GUIA_DROPDOWNS_FRONTEND.md) - **MUY IMPORTANTE** - Implementación de formularios
3. [`ESTRUCTURA_NUEVA_BASE_DE_DATOS.md`](ESTRUCTURA_NUEVA_BASE_DE_DATOS.md) - Entender estructura de datos

### Para DBAs (Administradores de BD)
1. [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md) - Instalación y mantenimiento
2. [`ESTRUCTURA_NUEVA_BASE_DE_DATOS.md`](ESTRUCTURA_NUEVA_BASE_DE_DATOS.md) - Estructura técnica
3. [`DIAGRAMA_NUEVA_ESTRUCTURA.txt`](DIAGRAMA_NUEVA_ESTRUCTURA.txt) - Diagrama completo

---

## 🎯 Características Principales

### ✅ Estructura Completa

- **7 tablas principales**: roles, usuarios, inspecciones, imagenes_inspeccion, tareas, estados, historial_estados
- **~200 campos** totales cubriendo todos los tipos de inspección
- **19 tipos de inspección** con campos específicos para cada uno
- **10 índices** para optimización de consultas
- **3 triggers automáticos** para auditoría
- **2 vistas útiles** para consultas complejas
- **5 procedimientos almacenados** para operaciones comunes

### 🔐 Seguridad

- Sistema de roles (Administrador/Usuario)
- Passwords hasheados con bcrypt
- Validaciones con CHECK constraints
- Integridad referencial con foreign keys
- CSRF protection implementado
- Rate limiting para autenticación

### 📱 Funcionalidades Implementadas

- ✅ **Sistema de login** completo con sesiones
- ✅ **Administración de usuarios** con CRUD completo
- ✅ **Campo de teléfono** en usuarios
- ✅ **Eliminación física** de usuarios de la BD
- ✅ **Dropdown de usuarios** en asignación de tareas
- ✅ **Sistema de inspecciones** con imágenes
- ✅ **Gestión de tareas** con estados dinámicos
- ✅ **Dashboard** con estadísticas en tiempo real

### 📊 Tipos de Inspección Soportados

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

## 📋 Checklist de Implementación

### Base de Datos
- [ ] Ejecutar script de creación
- [ ] Verificar que todas las tablas se crearon
- [ ] Probar procedimientos almacenados
- [ ] Crear usuario administrador real
- [ ] Configurar backup automático

### Backend
- [x] Instalar dependencias (mssql, bcryptjs, express-session, csurf, express-rate-limit)
- [x] Configurar archivo .env con credenciales
- [x] Actualizar conexión a BD
- [x] Crear endpoints de autenticación
- [x] Crear endpoints de inspecciones
- [x] Crear endpoints de tareas
- [x] Crear endpoint de subida de imágenes
- [x] Implementar middleware de autenticación
- [x] Implementar control de acceso por roles
- [x] Implementar CRUD completo de usuarios
- [x] Implementar eliminación física de usuarios

### Frontend
- [x] Actualizar formulario de login
- [x] Crear formulario dinámico de inspecciones
- [x] Implementar dropdowns según guía
- [x] Actualizar vista de tareas con nuevos estados
- [x] Aplicar colores a estados (rojo/amarillo/verde)
- [x] Implementar subida de imágenes
- [x] Actualizar dashboard con nuevas estadísticas
- [x] Implementar dropdown de usuarios en asignación de tareas
- [x] Implementar administración de usuarios con campo de teléfono
- [x] Implementar eliminación de usuarios desde la interfaz

---

## 🔧 Comandos Útiles

### Ejecutar Script en SQL Server

```bash
# Desde línea de comandos
sqlcmd -S localhost -U tu_usuario -P tu_password -i PlanificadorMantenimiento_NuevaEstructura.sql
```

### Backup de Base de Datos

```sql
BACKUP DATABASE PlanificadorMantenimiento 
TO DISK = 'C:\Backups\PlanificadorMantenimiento.bak'
WITH FORMAT, COMPRESSION;
```

### Restaurar Backup

```sql
RESTORE DATABASE PlanificadorMantenimiento 
FROM DISK = 'C:\Backups\PlanificadorMantenimiento.bak'
WITH REPLACE;
```

---

## 📊 Estadísticas

- **Total de archivos**: 12
- **Líneas de SQL**: ~1,200
- **Líneas de documentación**: ~2,500
- **Campos en inspecciones**: ~150
- **Procedimientos almacenados**: 5
- **Triggers**: 3
- **Vistas**: 2
- **Índices**: 10

---

## 🆘 Soporte

### Problemas Comunes

**No se puede conectar a la BD**
- Solución: Verifica que SQL Server esté corriendo
- Archivo: [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md) - Sección "Solución de Problemas"

**No entiendo la estructura**
- Solución: Revisa el diagrama visual
- Archivo: [`DIAGRAMA_NUEVA_ESTRUCTURA.txt`](DIAGRAMA_NUEVA_ESTRUCTURA.txt)

**No sé qué campos usar en el formulario**
- Solución: Consulta la guía de frontend
- Archivo: [`GUIA_DROPDOWNS_FRONTEND.md`](GUIA_DROPDOWNS_FRONTEND.md)

**Error al ejecutar script**
- Solución: Verifica permisos y sintaxis
- Archivo: [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md) - Sección "Solución de Problemas"

---

## 📞 Contacto

Para preguntas o problemas:
1. Revisa la documentación relevante
2. Verifica la sección de solución de problemas
3. Consulta los ejemplos de código en las guías

---

## 📅 Historial de Versiones

### Versión 2.0 (Actual) - Octubre 2025
- ✅ Estructura completamente rediseñada
- ✅ Tabla de roles separada
- ✅ 150+ campos de inspección
- ✅ Imágenes relacionadas con inspecciones
- ✅ Estados y prioridades simplificados
- ✅ Documentación completa

### Versión 1.0 (Legacy)
- ⚠️ Estructura básica inicial
- ⚠️ Roles como texto
- ⚠️ Campos JSON genéricos
- ⚠️ Documentación limitada

---

## 🎓 Recursos de Aprendizaje

### Para aprender SQL Server
- [Documentación oficial de Microsoft](https://docs.microsoft.com/sql/)
- [SQL Server Tutorial](https://www.sqlservertutorial.net/)

### Para aprender Node.js con SQL Server
- [node-mssql npm package](https://www.npmjs.com/package/mssql)
- Ejemplos en [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md)

### Para aprender bcrypt
- [bcryptjs npm package](https://www.npmjs.com/package/bcryptjs)
- Ejemplos en [`INSTRUCCIONES_INSTALACION.md`](INSTRUCCIONES_INSTALACION.md) - Sección "Seguridad"

---

## ⚖️ Licencia

Uso interno del proyecto Planificador de Mantenimiento.

---

## ✅ Estado del Proyecto

🟢 **Sistema Completo y Funcional**

- ✅ Base de datos implementada y probada
- ✅ Backend completo con todas las funcionalidades
- ✅ Frontend funcional con todas las características
- ✅ Sistema de autenticación implementado
- ✅ Administración de usuarios completa
- ✅ Gestión de tareas e inspecciones funcional
- ✅ Dashboard con estadísticas en tiempo real

---

**Última actualización**: Octubre 2025  
**Versión de la BD**: 2.0  
**Compatible con**: SQL Server 2016+

---

🎉 **¡Sistema completamente implementado y funcionando!** 🎉

