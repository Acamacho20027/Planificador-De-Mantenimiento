# 📊 ESTRUCTURA DE LA BASE DE DATOS - PLANIFICADOR DE MANTENIMIENTO

## 📋 Resumen General

Esta es la estructura corregida de la base de datos que incluye todas las características requeridas:

- ✅ Sistema de roles (Administrador/Usuario)
- ✅ Tabla de usuarios con nombre, email, teléfono y rol
- ✅ Sistema completo de inspecciones con todos los campos detallados
- ✅ Tabla de imágenes relacionada con inspecciones
- ✅ Sistema de tareas con estados y prioridades

---

## 🗂️ Estructura de Tablas

### 1. **ROLES**
Define los tipos de usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_rol` | INT (PK) | Identificador único del rol |
| `nombre_rol` | NVARCHAR(50) | Nombre del rol (Administrador/Usuario) |
| `descripcion` | NVARCHAR(200) | Descripción del rol |
| `fecha_creacion` | DATETIME2 | Fecha de creación |

**Datos iniciales:**
- **Administrador**: Acceso completo al sistema
- **Usuario**: Permisos limitados

---

### 2. **USUARIOS**
Almacena la información de los usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | INT (PK) | Identificador único |
| `nombre` | NVARCHAR(100) | Nombre completo del usuario |
| `email` | NVARCHAR(100) | Correo electrónico (único) |
| `numero_telefono` | NVARCHAR(20) | Número de teléfono |
| `password_hash` | NVARCHAR(255) | Contraseña encriptada con bcrypt |
| `id_rol` | INT (FK) | Referencia a la tabla roles |
| `activo` | BIT | Si el usuario está activo |
| `fecha_creacion` | DATETIME2 | Fecha de registro |
| `fecha_actualizacion` | DATETIME2 | Última actualización |
| `ultimo_acceso` | DATETIME2 | Último inicio de sesión |

**Relaciones:**
- `id_rol` → `roles.id_rol`

---

### 3. **INSPECCIONES**
Tabla principal que almacena todas las inspecciones con campos específicos para cada tipo.

#### Campos Generales
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_inspeccion` | INT (PK) | Identificador único |
| `nombre_inspeccion` | NVARCHAR(200) | Nombre de la inspección |
| `tipo_inspeccion` | NVARCHAR(100) | Tipo de inspección realizada |
| `edificio` | NVARCHAR(100) | Edificio donde se realizó |
| `piso` | NVARCHAR(50) | Piso/nivel |
| `ubicacion` | NVARCHAR(200) | Ubicación específica |

#### Campos Específicos por Tipo de Inspección

##### 🏠 **CUBIERTA DE TECHOS - LÁMINA**
- `lamina_tipo`: ondulada/rectangular
- `lamina_color`: Color de la lámina
- `lamina_medida`: 3,66 / 2,84 / 1,83

##### 🔧 **HOJALATERÍA - CUMBRERA**
- `cumbrera_descripcion_lamina`: galvanizada/esmaltada
- `cumbrera_medida_ml`: Medida en metros lineales
- `cumbrera_desarrollo_pulgadas`: Desarrollo en pulgadas
- `cumbrera_color`: galvanizado, blanco, rojo óxido, rojo teja, verde, azul
- `cumbrera_tipo_tornillo`: punta fina/punta broca
- `cumbrera_descripcion_tornillo`: Descripción del tornillo
- `cumbrera_medida_tornillo`: 1 pulgada
- `cumbrera_color_tornillo`: Color del tornillo

##### 💧 **HOJALATERÍA - BOTA AGUAS**
- `bota_aguas_descripcion_lamina`: galvanizada/esmaltada
- `bota_aguas_color`: Color
- `bota_aguas_calibre`: Calibre
- `bota_aguas_estilo`: pared+techo / techo+pared
- `bota_aguas_medida_ml`: Metros lineales
- `bota_aguas_desarrollo_pulgadas`: Desarrollo en pulgadas
- `bota_aguas_tipo_tornillo`: Tipo de tornillo
- `bota_aguas_descripcion_tornillo`: Descripción
- `bota_aguas_medida_tornillo`: Medida

##### 🔩 **TORNILLERÍA**
- `tornilleria_tipo`: punta broca, punta fina
- `tornilleria_descripcion`: galvanizada/esmaltada + color
- `tornilleria_medida`: 1, 2, 3 pulgadas

##### 🌊 **CANOAS**
- `canoas_tipo`: pecho de paloma, Pachuca, otro
- `canoas_tipo_otro`: Input personalizado
- `canoas_descripcion`: Descripción completa
- `canoas_cantidad_arizos`: Cantidad
- `canoas_boquilla_diametro`: Diámetro en pulgadas
- `canoas_boquilla_cantidad`: Cantidad
- `canoas_boquilla_descripcion`: Descripción

##### 📏 **BAJANTE**
- `bajante_tipo`: rectangular, cuadrado, redondo
- `bajante_material`: PVC/galvanizada/esmaltada
- `bajante_medida_ml`: Metros lineales

##### ⚡ **ELECTRICIDAD - ILUMINACIÓN**
- `iluminacion_ubicacion`: interna/externa
- `iluminacion_bombillo`: LED/fluorescente
- `iluminacion_tipo_luz`: luz blanca/luz cálida
- `iluminacion_watts`: Watts
- `iluminacion_apagador_marca`: Marca
- `iluminacion_apagador_tipo`: sencillo/doble/triple

##### 🔌 **ELECTRICIDAD - TOMACORRIENTE**
- `tomacorriente_tipo`: sencillo/doble
- `tomacorriente_voltaje`: 110v/220v
- `tomacorriente_polarizado`: si/no
- `tomacorriente_ubicacion`: interno/externo
- `tomacorriente_seguridad`: GFCI/AFCI

##### 📊 **ELECTRICIDAD - CENTROS DE CARGA**
- `centro_carga_marca`: Marca
- `centro_carga_cantidad_circuitos`: Cantidad
- `centro_carga_breaker_tipo`: sencillo/doble
- `centro_carga_breaker_amperaje`: Amperaje

##### 🔋 **GENERADOR ELÉCTRICO**
- `generador_marca`: Marca
- `generador_tipo_combustible`: diésel, gasolina, gas LP
- `generador_transferencia_auto`: Código de contactores
- `generador_kilowatts`: KW

##### ⚡ **SUPRESOR DE PICOS**
- `supresor_marca`: Marca
- `supresor_voltaje`: Voltaje

##### 🚪 **PUERTAS**
- `puerta_tipo`: madera/metal/MDF/otro
- `puerta_tipo_otro`: Input personalizado
- `puerta_tipo_bisagra`: convencional/cartucho/pivote
- `puerta_tipo_llavin`: Tipo de llavín
- `puerta_brazo_hidraulico`: Marca

##### 🏗️ **PISOS**
- `piso_tipo_material`: cerámica/porcelanato/PVC/laminado/alfombra/madera/vinílico/otro
- `piso_tipo_material_otro`: Input personalizado
- `piso_enchapes`: azulejo/porcelanato/lámina PVC/mármol/cuarzo/granito/otro
- `piso_enchapes_otro`: Input personalizado

##### 🎨 **PINTURA**
- `pintura_paredes`: Block/gipsun/Durock
- `pintura_tipo`: interior/exterior
- `pintura_categoria`: aceite/acrílica/epóxica/texturada/impermeabilizante/otro
- `pintura_acabado`: mate/satinada
- `pintura_impermeabilizante_tipo`: dry coat/siliconizer/siliconizer1000
- `pintura_otro`: Input personalizado

##### 💧 **BOMBAS DE AGUA**
- `bomba_tipo`: centrífuga/sumergible/periférica/presurizadora/de pozo profundo
- `bomba_potencia`: HP o kW
- `bomba_material_cuerpo`: hierro fundido/acero inoxidable/plástico reforzado
- `bomba_estado_sello`: Estado
- `bomba_estado_motor`: Estado (ruido, vibración, temperatura)
- `bomba_presion_salida`: psi o bar
- `bomba_fugas_visibles`: si/no
- `bomba_limpieza_filtro`: si/no
- `bomba_control_nivel_auto`: si/no

##### ❄️ **AIRE ACONDICIONADO**
- `ac_tipo`: mini split/cassette/piso-techo/ventana/central
- `ac_capacidad_btu`: BTU
- `ac_gas_refrigerante`: R410A/R22/R32/otro
- `ac_limpieza_filtros`: si/no
- `ac_limpieza_serpentines`: si/no
- `ac_nivel_gas`: Nivel
- `ac_estado_drenaje`: Estado
- `ac_estado_control_remoto`: Estado
- `ac_ruido_vibracion`: Observaciones
- `ac_consumo_electrico`: Consumo

##### 🪟 **VENTANAS**
- `ventana_tipo`: corrediza/abatible/fija/proyectable/celosía
- `ventana_material`: aluminio/PVC/madera/vidrio templado
- `ventana_estado_rieles`: Estado
- `ventana_estado_sello`: Estado
- `ventana_vidrio_roto`: si/no
- `ventana_mecanismo_funcional`: si/no
- `ventana_estado_pintura`: Estado

##### 🛡️ **BARANDAS**
- `baranda_material`: hierro/acero inoxidable/aluminio/vidrio/madera
- `baranda_altura_conforme`: si/no
- `baranda_estado_soldaduras`: Estado
- `baranda_oxidacion`: si/no
- `baranda_puntos_flojos`: si/no
- `baranda_estado_pintura`: Estado
- `baranda_seguridad_estructural`: Estado

##### 💦 **HIDRO LAVADOS**
- `hidrolavado_superficie`: paredes/pisos/techos/aceras/vehículos/maquinaria
- `hidrolavado_presion_psi`: PSI
- `hidrolavado_uso_detergente`: si/no
- `hidrolavado_estado_boquilla`: Estado
- `hidrolavado_resultado`: Resultado visual
- `hidrolavado_seguridad_area`: Seguridad

##### 📞 **TELEFONÍA**
- `telefonia_tipo_linea`: análoga/digital/IP
- `telefonia_estado_tomas`: Estado
- `telefonia_nivel_tono`: Nivel
- `telefonia_ruido_interferencia`: Ruido
- `telefonia_identificacion_ext`: Extensiones
- `telefonia_estado_cableado`: Estado
- `telefonia_estado_conmutador`: Estado

##### 🌐 **DATOS**
- `datos_tipo_red`: cableada/inalámbrica
- `datos_velocidad_mbps`: Mbps
- `datos_estado_puertos`: Estado RJ45
- `datos_identificacion_puntos`: Puntos de red
- `datos_cableado_categoria`: cat 5e, 6, 6A
- `datos_estado_patch_panel`: Estado
- `datos_perdida_señal`: Pérdida/latencia
- `datos_etiquetado`: Estado del etiquetado

##### 🏗️ **ESTRUCTURAS DE METAL**
- `estructura_tipo`: viga/columna/cercha/soporte/marco
- `estructura_material`: acero galvanizado/inoxidable/pintado
- `estructura_medida_m`: Medida en metros
- `estructura_estado_soldaduras`: Estado
- `estructura_oxidacion`: si/no
- `estructura_fijacion_firme`: si/no
- `estructura_pintura_protectora`: si/no
- `estructura_deformaciones`: Deformaciones o fisuras

##### 🔥 **SISTEMAS CONTRA INCENDIOS**
- `incendio_tipo_sistema`: rociadores/gabinetes/extintores/hidrantes/alarma/detectores
- `incendio_fecha_ultima_inspeccion`: Fecha
- `incendio_presion_sistema`: Presión
- `incendio_estado_valvulas`: Estado
- `incendio_fecha_recarga_extintores`: Fecha
- `incendio_funcionamiento_alarmas`: si/no
- `incendio_señalizacion_visible`: si/no

##### ⚡ **PLANTA ELÉCTRICA**
- `planta_combustible`: diésel/gasolina/gas LP
- `planta_potencia_kw`: kW
- `planta_nivel_combustible`: Nivel
- `planta_nivel_aceite`: Nivel
- `planta_prueba_arranque`: si/no
- `planta_estado_baterias`: Estado
- `planta_tiempo_operacion`: Tiempo
- `planta_mantenimiento_vigente`: si/no

##### 🚪 **MOTORES DE PORTONES**
- `motor_porton_tipo`: corredizo/abatible/enrollable
- `motor_porton_voltaje`: 110V/220V
- `motor_porton_estado_riel`: Estado
- `motor_porton_fotorresistencias`: si/no
- `motor_porton_control_remoto`: si/no
- `motor_porton_finales_carrera`: si/no
- `motor_porton_ruido`: si/no
- `motor_porton_engrase`: si/no

##### 🛤️ **ACERAS**
- `acera_material`: concreto/adoquín/piedra/cerámica
- `acera_nivelacion`: Estado
- `acera_grietas`: si/no
- `acera_bordes_estado`: Estado
- `acera_limpieza_necesaria`: si/no
- `acera_accesibilidad`: Rampas, señalización

##### 🌊 **CORDÓN + CAÑO**
- `cordon_tipo`: concreto/prefabricado/piedra
- `cordon_obstrucciones`: si/no
- `cordon_flujo_agua`: si/no
- `cordon_grietas`: si/no
- `cordon_desnivel`: si/no
- `cordon_desague_correcto`: si/no
- `cordon_señalizacion`: Estado

##### 📹 **CÁMARAS DE SEGURIDAD**
- `camara_tipo`: analógica/IP/PTZ/domo/bala
- `camara_resolucion_mp`: MP
- `camara_estado_lente`: Estado
- `camara_alimentacion_estable`: si/no
- `camara_conectividad`: cable/Wi-Fi
- `camara_grabacion_funcional`: si/no
- `camara_estado_dvr`: Estado DVR/NVR
- `camara_angulo_cobertura`: si/no

#### Campos de Auditoría
- `observaciones`: Observaciones generales
- `recomendaciones`: Recomendaciones
- `creado_por`: ID del usuario que creó la inspección
- `fecha_creacion`: Fecha de creación
- `fecha_actualizacion`: Última actualización

**Relaciones:**
- `creado_por` → `usuarios.id_usuario`

---

### 4. **IMAGENES_INSPECCION**
Almacena las imágenes relacionadas con cada inspección.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_imagen` | INT (PK) | Identificador único |
| `id_inspeccion` | INT (FK) | Referencia a la inspección |
| `nombre_archivo` | NVARCHAR(255) | Nombre del archivo |
| `tipo_mime` | NVARCHAR(100) | Tipo MIME (image/jpeg, image/png) |
| `data_base64` | NVARCHAR(MAX) | Imagen en formato base64 |
| `tamaño_bytes` | INT | Tamaño en bytes |
| `descripcion` | NVARCHAR(500) | Descripción de la imagen |
| `subido_por` | INT (FK) | Usuario que subió la imagen |
| `fecha_subida` | DATETIME2 | Fecha de subida |

**Relaciones:**
- `id_inspeccion` → `inspecciones.id_inspeccion` (CASCADE DELETE)
- `subido_por` → `usuarios.id_usuario`

---

### 5. **TAREAS**
Gestión de tareas del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_tarea` | INT (PK) | Identificador único |
| `titulo` | NVARCHAR(200) | Título de la tarea |
| `estado` | NVARCHAR(20) | **No Iniciado** / **En Proceso** / **Finalizado** |
| `asignado_a` | NVARCHAR(100) | Nombre de la persona asignada |
| `fecha` | DATE | Fecha de la tarea |
| `prioridad` | NVARCHAR(20) | **Baja** / **Media** / **Alta** |
| `descripcion` | NVARCHAR(MAX) | Descripción detallada |
| `id_inspeccion` | INT (FK) | Referencia opcional a inspección |
| `creado_por` | INT (FK) | Usuario que creó la tarea |
| `fecha_creacion` | DATETIME2 | Fecha de creación |
| `fecha_actualizacion` | DATETIME2 | Última actualización |

**Relaciones:**
- `id_inspeccion` → `inspecciones.id_inspeccion` (opcional)
- `creado_por` → `usuarios.id_usuario`

**Estados:**
- 🔴 **No Iniciado** (rojo)
- 🟡 **En Proceso** (amarillo)
- 🟢 **Finalizado** (verde)

**Prioridades:**
- 🔴 **Alta**
- 🟡 **Media**
- 🟢 **Baja**

---

## 🔄 Relaciones entre Tablas

```
roles (1) ──────── (N) usuarios
                        │
                        ├── (1) creado_por ──── (N) inspecciones
                        │                              │
                        │                              ├── (1) id_inspeccion ──── (N) imagenes_inspeccion
                        │                              │
                        │                              └── (1) id_inspeccion ──── (N) tareas
                        │
                        └── (1) creado_por ──── (N) tareas
```

---

## 📊 Vistas Creadas

### 1. **VW_tareas_completas**
Vista completa de todas las tareas con información relacionada:
- Datos de la tarea
- Información de la inspección relacionada (si existe)
- Datos del creador
- Conteo de imágenes

### 2. **VW_estadisticas_tareas**
Estadísticas agrupadas por estado:
- Total de tareas por estado
- Cantidad de tareas por prioridad en cada estado

---

## 🔧 Procedimientos Almacenados

### 1. **SP_crear_inspeccion**
Crea una nueva inspección.

**Parámetros:**
- `@nombre_inspeccion`: Nombre de la inspección
- `@tipo_inspeccion`: Tipo de inspección
- `@creado_por`: ID del usuario
- `@id_inspeccion_nueva` (OUTPUT): ID generado

### 2. **SP_crear_tarea**
Crea una nueva tarea.

**Parámetros:**
- `@titulo`: Título de la tarea
- `@estado`: Estado inicial
- `@asignado_a`: Persona asignada
- `@fecha`: Fecha de la tarea
- `@prioridad`: Prioridad
- `@descripcion`: Descripción (opcional)
- `@id_inspeccion`: ID de inspección relacionada (opcional)
- `@creado_por`: ID del usuario (opcional)
- `@id_tarea_nueva` (OUTPUT): ID generado

### 3. **SP_actualizar_tarea**
Actualiza una tarea existente.

**Parámetros:**
- `@id_tarea`: ID de la tarea
- `@titulo`: Nuevo título (opcional)
- `@estado`: Nuevo estado (opcional)
- `@asignado_a`: Nueva asignación (opcional)
- `@fecha`: Nueva fecha (opcional)
- `@prioridad`: Nueva prioridad (opcional)
- `@descripcion`: Nueva descripción (opcional)

### 4. **SP_obtener_tareas**
Obtiene todas las tareas ordenadas por estado y prioridad.

### 5. **SP_autenticar_usuario**
Autentica un usuario por email.

**Parámetros:**
- `@email`: Email del usuario

**Retorna:**
- Datos del usuario incluyendo rol y password_hash

---

## ⚙️ Triggers Automáticos

### 1. **TR_usuarios_update**
Actualiza automáticamente `fecha_actualizacion` cuando se modifica un usuario.

### 2. **TR_inspecciones_update**
Actualiza automáticamente `fecha_actualizacion` cuando se modifica una inspección.

### 3. **TR_tareas_update**
Actualiza automáticamente `fecha_actualizacion` cuando se modifica una tarea.

---

## 📝 Datos de Ejemplo

### Usuarios
- **admin@empresa.com** (Administrador) - Password: Admin123
- **juan.perez@empresa.com** (Usuario) - Password: Admin123
- **maria.gonzalez@empresa.com** (Usuario) - Password: Admin123
- **carlos.rodriguez@empresa.com** (Usuario) - Password: Admin123

### Inspecciones
- 3 inspecciones de ejemplo de diferentes tipos

### Tareas
- 5 tareas de ejemplo con diferentes estados y prioridades

---

## 🚀 Instalación

1. Abre SQL Server Management Studio
2. Ejecuta el archivo `PlanificadorMantenimiento_NuevaEstructura.sql`
3. La base de datos se creará automáticamente con datos de ejemplo
4. Usa las credenciales de ejemplo para probar el sistema

---

## 📌 Notas Importantes

- **Todos los campos de inspección son opcionales** - Solo se llenan los que aplican al tipo de inspección realizada
- **Las imágenes se guardan en base64** - Para facilitar el manejo en la aplicación web
- **Los passwords deben hashearse con bcrypt** - Nunca guardar contraseñas en texto plano
- **La relación tarea-inspección es opcional** - Puedes crear tareas independientes
- **Los estados de tareas son fijos** - No Iniciado, En Proceso, Finalizado (con colores específicos)

---

## 🔍 Consultas Útiles

### Obtener todas las tareas de un usuario
```sql
SELECT * FROM VW_tareas_completas
WHERE asignado_a = 'Juan Pérez'
ORDER BY prioridad, fecha;
```

### Obtener inspecciones con imágenes
```sql
SELECT 
    i.nombre_inspeccion,
    i.tipo_inspeccion,
    COUNT(img.id_imagen) AS total_imagenes
FROM inspecciones i
LEFT JOIN imagenes_inspeccion img ON i.id_inspeccion = img.id_inspeccion
GROUP BY i.id_inspeccion, i.nombre_inspeccion, i.tipo_inspeccion;
```

### Estadísticas de tareas
```sql
SELECT * FROM VW_estadisticas_tareas;
```

---

## 📞 Soporte

Para cualquier duda o problema con la estructura de la base de datos, revisa este documento o consulta los comentarios en el archivo SQL.

