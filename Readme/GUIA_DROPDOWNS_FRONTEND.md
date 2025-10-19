# 🎨 GUÍA DE DROPDOWNS Y CAMPOS PARA EL FRONTEND

Esta guía especifica exactamente qué tipo de campo usar (input vs dropdown) y las opciones disponibles para cada campo de inspección.

---

## 📝 Leyenda

- 🟢 **Input** = Campo de texto libre
- 🔵 **Dropdown** = Menú desplegable con opciones fijas
- ☑️ **Checkbox** = Verdadero/Falso (Si/No)
- 🔢 **Number** = Campo numérico
- 📅 **Date** = Campo de fecha

---

## 🏠 CUBIERTA DE TECHOS

### LÁMINA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de lámina | 🔵 Dropdown | `ondulada`, `rectangular` |
| Color | 🟢 Input | Texto libre |
| Medida (m) | 🔵 Dropdown | `3.66`, `2.84`, `1.83` |

---

### HOJALATERÍA - CUMBRERA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Descripción de la lámina | 🔵 Dropdown | `galvanizada`, `esmaltada` |
| Medida (metro lineal) | 🔢 Number | Número decimal |
| Desarrollo (pulgadas) | 🔢 Number | Número decimal |
| Color | 🔵 Dropdown | `galvanizado`, `blanco`, `rojo oxido`, `rojo teja`, `verde`, `azul` |
| Tipo de tornillo | 🔵 Dropdown | `punta fina`, `punta broca` |
| Descripción del tornillo | 🟢 Input | Texto libre (incluir galvanizada/esmaltada + color) |
| Medida del tornillo | 🔵 Dropdown | `1 pulgada` |
| Color del tornillo | 🔵 Dropdown | `galvanizado`, `blanco`, `rojo oxido`, `rojo teja`, `verde`, `azul` |

---

### HOJALATERÍA - BOTA AGUAS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Descripción de la lámina | 🔵 Dropdown | `galvanizada`, `esmaltada` |
| Color | 🔵 Dropdown | `galvanizado`, `blanco`, `rojo oxido`, `rojo teja`, `verde`, `azul` |
| Calibre | 🟢 Input | Texto libre |
| Estilo | 🔵 Dropdown | `pared+techo`, `techo+pared` |
| Medida (metro lineal) | 🔢 Number | Número decimal |
| Desarrollo (pulgadas) | 🔢 Number | Número decimal |
| Tipo de tornillo | 🔵 Dropdown | `punta fina`, `punta broca` |
| Descripción del tornillo | 🟢 Input | Texto libre |
| Medida del tornillo | 🔵 Dropdown | `1 pulgada` |

---

### TORNILLERÍA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de tornillo | 🔵 Dropdown | `punta broca`, `punta fina` |
| Descripción | 🟢 Input | Texto libre (galvanizada/esmaltada + color) |
| Medida | 🔵 Dropdown | `1 pulgada`, `2 pulgadas`, `3 pulgadas` |

---

### CANOAS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de canoa | 🔵 Dropdown | `pecho de paloma`, `Pachuca`, `otro` |
| Tipo otro (si aplica) | 🟢 Input | Texto libre (aparece si elige "otro") |
| Descripción de la canoa | 🟢 Input | Texto libre (galvanizada/esmaltada + colores) |
| Cantidad de arizos | 🔢 Number | Número entero |
| Boquilla - Diámetro (pulgadas) | 🟢 Input | Texto libre |
| Boquilla - Cantidad | 🔢 Number | Número entero |
| Boquilla - Descripción | 🟢 Input | Texto libre (galvanizada/esmaltada + colores) |

---

### BAJANTE

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de bajante | 🔵 Dropdown | `rectangular`, `cuadrado`, `redondo` |
| Material | 🟢 Input | Texto libre (PVC/galvanizada/esmaltada + colores) |
| Medida o diámetro (metro lineal) | 🔢 Number | Número decimal |

---

## ⚡ ELECTRICIDAD

### ILUMINACIÓN

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Ubicación | 🔵 Dropdown | `interna`, `externa` |
| Bombillo | 🔵 Dropdown | `LED`, `fluorescente` |
| Tipo de luz | 🔵 Dropdown | `luz blanca`, `luz cálida` |
| Watts | 🔢 Number | Número entero |
| Apagador - Marca | 🟢 Input | Texto libre |
| Apagador - Tipo | 🔵 Dropdown | `sencillo`, `doble`, `triple` |

---

### TOMACORRIENTE

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo | 🔵 Dropdown | `sencillo`, `doble` |
| Voltaje | 🔵 Dropdown | `110v`, `220v` |
| Polarizado | ☑️ Checkbox | Si / No |
| Ubicación | 🔵 Dropdown | `interno`, `externo` |
| Seguridad eléctrica | 🔵 Dropdown | `GFCI`, `AFCI` |

---

### CENTROS DE CARGA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Marca | 🟢 Input | Texto libre |
| Cantidad de circuitos | 🔢 Number | Número entero |
| Breaker - Tipo | 🔵 Dropdown | `sencillo`, `doble` |
| Breaker - Amperaje | 🔢 Number | Número entero |

---

### GENERADOR ELÉCTRICO

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Marca | 🟢 Input | Texto libre |
| Tipo de combustible | 🔵 Dropdown | `diésel`, `gasolina`, `gas LP` |
| Transferencia automática | 🟢 Input | Texto libre (código de contactores) |
| Kilowatts | 🔢 Number | Número decimal |

---

### SUPRESOR DE PICOS DE CORRIENTE

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Marca | 🟢 Input | Texto libre |
| Voltaje | 🟢 Input | Texto libre |

---

## 🚪 PUERTAS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de puerta | 🔵 Dropdown | `madera`, `metal`, `MDF`, `otro` |
| Tipo otro (si aplica) | 🟢 Input | Texto libre (aparece si elige "otro") |
| Tipo de bisagra | 🔵 Dropdown | `convencional`, `cartucho`, `pivote` |
| Tipo de llavín | 🔵 Dropdown | `llavín pomo con seguro`, `llavín pomo sin seguro`, `manija con seguro`, `manija sin seguro`, `doble paso`, `pico de lora`, `otro` |
| Brazo hidráulico | 🟢 Input | Texto libre (marca) |

---

## 🏗️ PISOS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de material | 🔵 Dropdown | `cerámica`, `porcelanato`, `PVC`, `laminado`, `alfombra`, `madera`, `vinílico`, `otro` |
| Tipo material otro (si aplica) | 🟢 Input | Texto libre (aparece si elige "otro") |
| Enchapes | 🔵 Dropdown | `azulejo`, `porcelanato`, `lámina PVC`, `mármol`, `cuarzo`, `granito`, `otro` |
| Enchapes otro (si aplica) | 🟢 Input | Texto libre (aparece si elige "otro") |

---

## 🎨 PINTURA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Paredes | 🔵 Dropdown | `Block`, `gipsun`, `Durock` |
| Tipo de pintura | 🔵 Dropdown | `interior`, `exterior` |
| Categoría | 🔵 Dropdown | `aceite`, `acrílica`, `epóxica`, `texturada`, `impermeabilizante`, `otro` |
| Acabado (si es acrílica) | 🔵 Dropdown | `mate`, `satinada` |
| Tipo impermeabilizante (si aplica) | 🔵 Dropdown | `dry coat`, `siliconizer`, `siliconizer1000` |
| Otro (si aplica) | 🟢 Input | Texto libre |

---

## 💧 BOMBAS DE AGUA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de bomba | 🔵 Dropdown | `centrífuga`, `sumergible`, `periférica`, `presurizadora`, `de pozo profundo` |
| Potencia | 🟢 Input | Texto libre (HP o kW) |
| Material del cuerpo | 🔵 Dropdown | `hierro fundido`, `acero inoxidable`, `plástico reforzado` |
| Estado de sello mecánico | 🟢 Input | Texto libre |
| Estado del motor | 🟢 Input | Texto libre (ruido, vibración, temperatura) |
| Presión de salida | 🟢 Input | Texto libre (psi o bar) |
| Fugas visibles | ☑️ Checkbox | Si / No |
| Limpieza del filtro y válvulas | ☑️ Checkbox | Si / No |
| Verificación del control de nivel automático | ☑️ Checkbox | Si / No |

---

## ❄️ AIRE ACONDICIONADO

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo | 🔵 Dropdown | `mini split`, `cassette`, `piso-techo`, `ventana`, `central` |
| Capacidad (BTU) | 🔢 Number | Número entero |
| Gas refrigerante | 🔵 Dropdown | `R410A`, `R22`, `R32`, `otro` |
| Limpieza de filtros | ☑️ Checkbox | Si / No |
| Limpieza de serpentines | ☑️ Checkbox | Si / No |
| Nivel de gas refrigerante | 🟢 Input | Texto libre |
| Estado del drenaje de condensado | 🟢 Input | Texto libre |
| Estado del control remoto y termostato | 🟢 Input | Texto libre |
| Ruido o vibración anormal | 🟢 Input | Texto libre |
| Revisión de consumo eléctrico | 🟢 Input | Texto libre |

---

## 🪟 VENTANAS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo | 🔵 Dropdown | `corrediza`, `abatible`, `fija`, `proyectable`, `celosía` |
| Material | 🔵 Dropdown | `aluminio`, `PVC`, `madera`, `vidrio templado` |
| Estado de rieles y bisagras | 🟢 Input | Texto libre |
| Estado del sello o empaque | 🟢 Input | Texto libre |
| Vidrio fisurado o roto | ☑️ Checkbox | Si / No |
| Mecanismo de apertura funcional | ☑️ Checkbox | Si / No |
| Estado de pintura o recubrimiento | 🟢 Input | Texto libre |

---

## 🛡️ BARANDAS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Material | 🔵 Dropdown | `hierro`, `acero inoxidable`, `aluminio`, `vidrio`, `madera` |
| Altura y fijación conforme a norma | ☑️ Checkbox | Si / No |
| Estado de soldaduras o uniones | 🟢 Input | Texto libre |
| Oxidación o corrosión | ☑️ Checkbox | Si / No |
| Puntos sueltos o flojos | ☑️ Checkbox | Si / No |
| Estado de pintura o recubrimiento | 🟢 Input | Texto libre |
| Seguridad estructural | 🟢 Input | Texto libre |

---

## 💦 HIDRO LAVADOS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Superficie tratada | 🔵 Dropdown | `paredes`, `pisos`, `techos`, `aceras`, `vehículos`, `maquinaria` |
| Presión del equipo (psi) | 🔢 Number | Número entero |
| Uso de detergente/desengrasante | ☑️ Checkbox | Si / No |
| Estado de la boquilla y mangueras | 🟢 Input | Texto libre |
| Resultado visual | 🟢 Input | Texto libre |
| Seguridad del área | 🟢 Input | Texto libre (señalización, drenaje adecuado) |

---

## 📞 TELEFONÍA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de línea | 🔵 Dropdown | `análoga`, `digital`, `IP` |
| Estado de tomas y conectores | 🟢 Input | Texto libre |
| Nivel de tono/señal | 🟢 Input | Texto libre |
| Ruido o interferencia | 🟢 Input | Texto libre |
| Identificación de extensiones | 🟢 Input | Texto libre |
| Revisión de cableado y canalizaciones | 🟢 Input | Texto libre |
| Estado del conmutador o central telefónica | 🟢 Input | Texto libre |

---

## 🌐 DATOS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de red | 🔵 Dropdown | `cableada`, `inalámbrica` |
| Velocidad de conexión (Mbps) | 🔢 Number | Número entero |
| Estado de puertos RJ45 y conectores | 🟢 Input | Texto libre |
| Identificación de puntos de red | 🟢 Input | Texto libre |
| Cableado estructurado | 🔵 Dropdown | `categoría 5e`, `categoría 6`, `categoría 6A` |
| Estado de patch panel y racks | 🟢 Input | Texto libre |
| Pérdida de señal/latencia | 🟢 Input | Texto libre |
| Etiquetado y orden | 🟢 Input | Texto libre |

---

## 🏗️ ESTRUCTURAS DE METAL

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de estructura | 🔵 Dropdown | `viga`, `columna`, `cercha`, `soporte`, `marco` |
| Material | 🔵 Dropdown | `acero galvanizado`, `acero inoxidable`, `acero pintado` |
| Medida (m) | 🔢 Number | Número decimal |
| Estado de soldaduras y uniones | 🟢 Input | Texto libre |
| Oxidación o corrosión | ☑️ Checkbox | Si / No |
| Fijación y anclajes firmes | ☑️ Checkbox | Si / No |
| Pintura protectora o recubrimiento anticorrosivo aplicado | ☑️ Checkbox | Si / No |
| Deformaciones o fisuras | 🟢 Input | Texto libre |

---

## 🔥 SISTEMAS CONTRA INCENDIOS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo de sistema | 🔵 Dropdown | `rociadores`, `gabinetes`, `extintores`, `hidrantes`, `alarma`, `detectores` |
| Fecha de última inspección | 📅 Date | Formato fecha |
| Presión del sistema (si aplica) | 🟢 Input | Texto libre |
| Estado de válvulas y mangueras | 🟢 Input | Texto libre |
| Fecha de recarga de extintores | 📅 Date | Formato fecha |
| Funcionamiento de alarmas/detectores | ☑️ Checkbox | Si / No |
| Señalización visible y accesible | ☑️ Checkbox | Si / No |

---

## ⚡ PLANTA ELÉCTRICA

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Combustible | 🔵 Dropdown | `diésel`, `gasolina`, `gas LP` |
| Potencia (kW) | 🔢 Number | Número decimal |
| Nivel de combustible | 🟢 Input | Texto libre |
| Nivel de aceite y refrigerante | 🟢 Input | Texto libre |
| Prueba de arranque automático exitosa | ☑️ Checkbox | Si / No |
| Estado de baterías | 🟢 Input | Texto libre |
| Tiempo de operación | 🟢 Input | Texto libre |
| Mantenimiento preventivo vigente | ☑️ Checkbox | Si / No |

---

## 🚪 MOTORES DE PORTONES

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo | 🔵 Dropdown | `corredizo`, `abatible`, `enrollable` |
| Voltaje de operación | 🔵 Dropdown | `110V`, `220V` |
| Estado del riel/bisagras | 🟢 Input | Texto libre |
| Fotorresistencias funcionales | ☑️ Checkbox | Si / No |
| Control remoto funcional | ☑️ Checkbox | Si / No |
| Finales de carrera ajustados | ☑️ Checkbox | Si / No |
| Ruido o vibración | ☑️ Checkbox | Si / No |
| Engrase de mecanismos | ☑️ Checkbox | Si / No |

---

## 🛤️ ACERAS

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Material | 🔵 Dropdown | `concreto`, `adoquín`, `piedra`, `cerámica` |
| Nivelación y pendientes adecuadas | 🟢 Input | Texto libre |
| Grietas o hundimientos | ☑️ Checkbox | Si / No |
| Bordes y juntas en buen estado | ☑️ Checkbox | Si / No |
| Limpieza general necesaria | ☑️ Checkbox | Si / No |
| Accesibilidad (rampas, señalización) | 🟢 Input | Texto libre |

---

## 🌊 CORDÓN + CAÑO

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo | 🔵 Dropdown | `concreto`, `prefabricado`, `piedra` |
| Obstrucciones o suciedad | ☑️ Checkbox | Si / No |
| Flujo de agua adecuado | ☑️ Checkbox | Si / No |
| Grietas o roturas | ☑️ Checkbox | Si / No |
| Desnivel o hundimiento | ☑️ Checkbox | Si / No |
| Desagüe correcto | ☑️ Checkbox | Si / No |
| Señalización o pintura (si aplica) | 🟢 Input | Texto libre |

---

## 📹 CÁMARAS DE SEGURIDAD

| Campo | Tipo | Opciones/Formato |
|-------|------|------------------|
| Tipo | 🔵 Dropdown | `analógica`, `IP`, `PTZ`, `domo`, `bala` |
| Resolución (MP) | 🔢 Number | Número decimal |
| Estado del lente y carcasa | 🟢 Input | Texto libre |
| Alimentación eléctrica estable | ☑️ Checkbox | Si / No |
| Conectividad | 🔵 Dropdown | `cable`, `Wi-Fi` |
| Grabación funcional | ☑️ Checkbox | Si / No |
| Estado del DVR/NVR | 🟢 Input | Texto libre |
| Ángulo y cobertura correcta | ☑️ Checkbox | Si / No |

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Campos Condicionales

Algunos campos deben aparecer solo cuando se selecciona cierta opción:

1. **Tipo "otro"**: Cuando el usuario seleccione "otro" en cualquier dropdown, debe aparecer un campo de input adicional
2. **Acabado de pintura**: Solo aparece si se selecciona "acrílica" en categoría
3. **Tipo impermeabilizante**: Solo aparece si se selecciona "impermeabilizante" en categoría

### Validaciones Recomendadas

- Los campos numéricos deben aceptar solo números
- Los campos de fecha deben usar un date picker
- Los checkboxes deben guardar 1 (true) o 0 (false)
- Los inputs de texto deben tener longitud máxima razonable

### Guardado en Base de Datos

- Solo guardar los campos que el usuario llene
- Los campos vacíos se guardan como NULL
- El nombre del campo en la BD corresponde al tipo de inspección + nombre del campo
  - Ejemplo: `ac_tipo`, `ac_capacidad_btu`, `lamina_tipo`, etc.

---

## 🎨 Ejemplo de Formulario Dinámico

Cuando el usuario selecciona un tipo de inspección, el formulario debe mostrar SOLO los campos correspondientes a ese tipo:

**Ejemplo: Si elige "Aire Acondicionado"**
```
┌─────────────────────────────────────────┐
│ INSPECCIÓN DE AIRE ACONDICIONADO        │
├─────────────────────────────────────────┤
│ Tipo: [Dropdown: mini split ▼]         │
│ Capacidad (BTU): [12000]                │
│ Gas refrigerante: [Dropdown: R410A ▼]  │
│ ☑ Limpieza de filtros                  │
│ ☐ Limpieza de serpentines              │
│ Nivel de gas: [Adecuado]               │
│ Estado del drenaje: [Limpio]           │
│ ...                                     │
└─────────────────────────────────────────┘
```

**Ejemplo: Si elige "Electricidad - Iluminación"**
```
┌─────────────────────────────────────────┐
│ INSPECCIÓN DE ILUMINACIÓN               │
├─────────────────────────────────────────┤
│ Ubicación: [Dropdown: interna ▼]       │
│ Bombillo: [Dropdown: LED ▼]            │
│ Tipo de luz: [Dropdown: luz blanca ▼]  │
│ Watts: [12]                             │
│ Apagador - Marca: [Leviton]            │
│ Apagador - Tipo: [Dropdown: doble ▼]   │
└─────────────────────────────────────────┘
```

Esta implementación dinámica mejora la experiencia del usuario y asegura que solo vea los campos relevantes para el tipo de inspección que está realizando.

