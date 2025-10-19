# 🎨 EJEMPLO PRÁCTICO DE IMPLEMENTACIÓN FRONTEND

Esta guía muestra cómo implementar los formularios de inspección y tareas en el frontend usando JavaScript/HTML.

---

## 📝 Formulario Dinámico de Inspecciones

### HTML Base

```html
<!-- Formulario principal de inspección -->
<form id="formInspeccion">
    <!-- Información General -->
    <div class="seccion-general">
        <h3>Información General</h3>
        
        <label>Nombre de la Inspección:</label>
        <input type="text" name="nombre_inspeccion" required>
        
        <label>Tipo de Inspección:</label>
        <select name="tipo_inspeccion" id="tipoInspeccion" required>
            <option value="">Seleccione...</option>
            <option value="cubierta_techos">Cubierta de Techos</option>
            <option value="electricidad">Electricidad</option>
            <option value="aire_acondicionado">Aire Acondicionado</option>
            <option value="puertas">Puertas</option>
            <option value="pisos">Pisos</option>
            <option value="pintura">Pintura</option>
            <option value="bombas_agua">Bombas de Agua</option>
            <option value="ventanas">Ventanas</option>
            <option value="barandas">Barandas</option>
            <option value="hidrolavados">Hidro Lavados</option>
            <option value="telefonia">Telefonía</option>
            <option value="datos">Datos</option>
            <option value="estructuras_metal">Estructuras de Metal</option>
            <option value="sistemas_incendios">Sistemas Contra Incendios</option>
            <option value="planta_electrica">Planta Eléctrica</option>
            <option value="motores_portones">Motores de Portones</option>
            <option value="aceras">Aceras</option>
            <option value="cordon_cano">Cordón + Caño</option>
            <option value="camaras">Cámaras de Seguridad</option>
        </select>
        
        <label>Edificio:</label>
        <input type="text" name="edificio">
        
        <label>Piso:</label>
        <input type="text" name="piso">
        
        <label>Ubicación:</label>
        <input type="text" name="ubicacion">
    </div>
    
    <!-- Campos dinámicos según tipo -->
    <div id="camposDinamicos"></div>
    
    <!-- Observaciones -->
    <div class="seccion-observaciones">
        <label>Observaciones:</label>
        <textarea name="observaciones" rows="4"></textarea>
        
        <label>Recomendaciones:</label>
        <textarea name="recomendaciones" rows="4"></textarea>
    </div>
    
    <!-- Subir imágenes -->
    <div class="seccion-imagenes">
        <label>Imágenes:</label>
        <input type="file" id="inputImagenes" accept="image/*" multiple>
        <div id="previewImagenes"></div>
    </div>
    
    <button type="submit">Guardar Inspección</button>
</form>
```

---

## 🎯 JavaScript para Formulario Dinámico

### 1. Configuración de Campos por Tipo

```javascript
// Definición de campos para cada tipo de inspección
const camposPorTipo = {
    aire_acondicionado: [
        {
            nombre: 'ac_tipo',
            label: 'Tipo',
            tipo: 'select',
            opciones: ['mini split', 'cassette', 'piso-techo', 'ventana', 'central']
        },
        {
            nombre: 'ac_capacidad_btu',
            label: 'Capacidad (BTU)',
            tipo: 'number'
        },
        {
            nombre: 'ac_gas_refrigerante',
            label: 'Gas refrigerante',
            tipo: 'select',
            opciones: ['R410A', 'R22', 'R32', 'otro']
        },
        {
            nombre: 'ac_limpieza_filtros',
            label: 'Limpieza de filtros',
            tipo: 'checkbox'
        },
        {
            nombre: 'ac_limpieza_serpentines',
            label: 'Limpieza de serpentines',
            tipo: 'checkbox'
        },
        {
            nombre: 'ac_nivel_gas',
            label: 'Nivel de gas refrigerante',
            tipo: 'text'
        },
        {
            nombre: 'ac_estado_drenaje',
            label: 'Estado del drenaje',
            tipo: 'text'
        },
        {
            nombre: 'ac_estado_control_remoto',
            label: 'Estado del control remoto',
            tipo: 'text'
        },
        {
            nombre: 'ac_ruido_vibracion',
            label: 'Ruido o vibración anormal',
            tipo: 'text'
        },
        {
            nombre: 'ac_consumo_electrico',
            label: 'Consumo eléctrico',
            tipo: 'text'
        }
    ],
    
    electricidad: [
        {
            nombre: 'iluminacion_ubicacion',
            label: 'Ubicación',
            tipo: 'select',
            opciones: ['interna', 'externa']
        },
        {
            nombre: 'iluminacion_bombillo',
            label: 'Tipo de bombillo',
            tipo: 'select',
            opciones: ['LED', 'fluorescente']
        },
        {
            nombre: 'iluminacion_tipo_luz',
            label: 'Tipo de luz',
            tipo: 'select',
            opciones: ['luz blanca', 'luz cálida']
        },
        {
            nombre: 'iluminacion_watts',
            label: 'Watts',
            tipo: 'number'
        },
        {
            nombre: 'iluminacion_apagador_marca',
            label: 'Marca del apagador',
            tipo: 'text'
        },
        {
            nombre: 'iluminacion_apagador_tipo',
            label: 'Tipo de apagador',
            tipo: 'select',
            opciones: ['sencillo', 'doble', 'triple']
        }
    ],
    
    puertas: [
        {
            nombre: 'puerta_tipo',
            label: 'Tipo de puerta',
            tipo: 'select',
            opciones: ['madera', 'metal', 'MDF', 'otro']
        },
        {
            nombre: 'puerta_tipo_otro',
            label: 'Especificar tipo (si eligió otro)',
            tipo: 'text',
            mostrarSi: { campo: 'puerta_tipo', valor: 'otro' }
        },
        {
            nombre: 'puerta_tipo_bisagra',
            label: 'Tipo de bisagra',
            tipo: 'select',
            opciones: ['convencional', 'cartucho', 'pivote']
        },
        {
            nombre: 'puerta_tipo_llavin',
            label: 'Tipo de llavín',
            tipo: 'text'
        },
        {
            nombre: 'puerta_brazo_hidraulico',
            label: 'Brazo hidráulico (marca)',
            tipo: 'text'
        }
    ],
    
    // Agregar los demás tipos aquí...
};
```

### 2. Función para Generar Campos Dinámicos

```javascript
// Generar campos dinámicos cuando cambia el tipo de inspección
document.getElementById('tipoInspeccion').addEventListener('change', function(e) {
    const tipo = e.target.value;
    const contenedor = document.getElementById('camposDinamicos');
    
    // Limpiar campos anteriores
    contenedor.innerHTML = '';
    
    if (!tipo || !camposPorTipo[tipo]) return;
    
    // Crear título de sección
    const titulo = document.createElement('h3');
    titulo.textContent = `Datos de ${e.target.options[e.target.selectedIndex].text}`;
    contenedor.appendChild(titulo);
    
    // Generar cada campo
    camposPorTipo[tipo].forEach(campo => {
        const div = document.createElement('div');
        div.className = 'campo-formulario';
        div.dataset.campo = campo.nombre;
        
        const label = document.createElement('label');
        label.textContent = campo.label + ':';
        label.htmlFor = campo.nombre;
        div.appendChild(label);
        
        let input;
        
        switch(campo.tipo) {
            case 'select':
                input = document.createElement('select');
                input.name = campo.nombre;
                input.id = campo.nombre;
                
                // Opción vacía
                const opcionVacia = document.createElement('option');
                opcionVacia.value = '';
                opcionVacia.textContent = 'Seleccione...';
                input.appendChild(opcionVacia);
                
                // Opciones
                campo.opciones.forEach(opcion => {
                    const opt = document.createElement('option');
                    opt.value = opcion;
                    opt.textContent = opcion.charAt(0).toUpperCase() + opcion.slice(1);
                    input.appendChild(opt);
                });
                break;
                
            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.name = campo.nombre;
                input.id = campo.nombre;
                input.value = '1';
                break;
                
            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                input.name = campo.nombre;
                input.id = campo.nombre;
                break;
                
            case 'text':
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.name = campo.nombre;
                input.id = campo.nombre;
                break;
        }
        
        div.appendChild(input);
        
        // Campos condicionales
        if (campo.mostrarSi) {
            div.style.display = 'none';
            
            // Escuchar cambios en el campo padre
            document.addEventListener('change', function(evt) {
                if (evt.target.name === campo.mostrarSi.campo) {
                    if (evt.target.value === campo.mostrarSi.valor) {
                        div.style.display = 'block';
                    } else {
                        div.style.display = 'none';
                        input.value = '';
                    }
                }
            });
        }
        
        contenedor.appendChild(div);
    });
});
```

### 3. Manejo de Imágenes

```javascript
// Manejar selección de imágenes
const inputImagenes = document.getElementById('inputImagenes');
const previewImagenes = document.getElementById('previewImagenes');
let imagenesBase64 = [];

inputImagenes.addEventListener('change', async function(e) {
    const archivos = Array.from(e.target.files);
    previewImagenes.innerHTML = '';
    imagenesBase64 = [];
    
    for (const archivo of archivos) {
        // Convertir a base64
        const base64 = await convertirABase64(archivo);
        
        imagenesBase64.push({
            nombre: archivo.name,
            tipo: archivo.type,
            data: base64,
            tamaño: archivo.size
        });
        
        // Crear preview
        const div = document.createElement('div');
        div.className = 'preview-imagen';
        
        const img = document.createElement('img');
        img.src = base64;
        img.style.maxWidth = '200px';
        
        const nombre = document.createElement('p');
        nombre.textContent = archivo.name;
        
        div.appendChild(img);
        div.appendChild(nombre);
        previewImagenes.appendChild(div);
    }
});

// Función auxiliar para convertir archivo a base64
function convertirABase64(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(archivo);
    });
}
```

### 4. Enviar Formulario

```javascript
// Enviar formulario
document.getElementById('formInspeccion').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Recopilar datos del formulario
    const formData = new FormData(e.target);
    const datos = {};
    
    for (let [key, value] of formData.entries()) {
        // Convertir checkboxes a boolean
        if (e.target.elements[key]?.type === 'checkbox') {
            datos[key] = e.target.elements[key].checked;
        } else {
            datos[key] = value;
        }
    }
    
    try {
        // Guardar inspección
        const responseInspeccion = await fetch('/api/inspecciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(datos)
        });
        
        if (!responseInspeccion.ok) {
            throw new Error('Error al guardar inspección');
        }
        
        const { id_inspeccion } = await responseInspeccion.json();
        
        // Subir imágenes si hay
        if (imagenesBase64.length > 0) {
            for (const imagen of imagenesBase64) {
                await fetch('/api/imagenes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        id_inspeccion: id_inspeccion,
                        nombre_archivo: imagen.nombre,
                        tipo_mime: imagen.tipo,
                        data_base64: imagen.data,
                        tamaño_bytes: imagen.tamaño,
                        subido_por: obtenerIdUsuarioActual()
                    })
                });
            }
        }
        
        alert('Inspección guardada exitosamente');
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la inspección');
    }
});

function obtenerIdUsuarioActual() {
    // Obtener del token JWT o del localStorage
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id_usuario;
}
```

---

## 📋 Tabla de Tareas con Estados y Colores

### HTML

```html
<div class="tabla-tareas-container">
    <h2>Listado de Tareas</h2>
    
    <!-- Filtros -->
    <div class="filtros">
        <select id="filtroEstado">
            <option value="">Todos los estados</option>
            <option value="No Iniciado">No Iniciado</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Finalizado">Finalizado</option>
        </select>
        
        <select id="filtroPrioridad">
            <option value="">Todas las prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
        </select>
    </div>
    
    <!-- Tabla -->
    <table id="tablaTareas">
        <thead>
            <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Asignado</th>
                <th>Fecha</th>
                <th>Prioridad</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody id="cuerpoTareas">
            <!-- Se llenará dinámicamente -->
        </tbody>
    </table>
</div>
```

### CSS

```css
/* Colores de estado */
.badge-estado {
    padding: 5px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
}

.estado-no-iniciado {
    background-color: #fee;
    color: #c00;
    border: 1px solid #c00;
}

.estado-en-proceso {
    background-color: #ffc;
    color: #990;
    border: 1px solid #990;
}

.estado-finalizado {
    background-color: #efe;
    color: #080;
    border: 1px solid #080;
}

/* Colores de prioridad */
.badge-prioridad {
    padding: 3px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: bold;
}

.prioridad-alta {
    background-color: #f88;
    color: #fff;
}

.prioridad-media {
    background-color: #fc6;
    color: #fff;
}

.prioridad-baja {
    background-color: #8d8;
    color: #fff;
}

/* Botones de acción */
.btn-accion {
    padding: 5px 10px;
    margin: 0 2px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.btn-editar {
    background-color: #4CAF50;
    color: white;
}

.btn-eliminar {
    background-color: #f44336;
    color: white;
}

.btn-ver {
    background-color: #2196F3;
    color: white;
}
```

### JavaScript

```javascript
// Cargar tareas al iniciar
async function cargarTareas() {
    try {
        const response = await fetch('/api/tareas', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar tareas');
        
        const tareas = await response.json();
        mostrarTareas(tareas);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar las tareas');
    }
}

// Mostrar tareas en la tabla
function mostrarTareas(tareas) {
    const tbody = document.getElementById('cuerpoTareas');
    tbody.innerHTML = '';
    
    tareas.forEach(tarea => {
        const tr = document.createElement('tr');
        
        // Clase de color según estado
        let claseEstado = '';
        switch(tarea.estado) {
            case 'No Iniciado':
                claseEstado = 'estado-no-iniciado';
                break;
            case 'En Proceso':
                claseEstado = 'estado-en-proceso';
                break;
            case 'Finalizado':
                claseEstado = 'estado-finalizado';
                break;
        }
        
        // Clase de color según prioridad
        let clasePrioridad = '';
        switch(tarea.prioridad) {
            case 'Alta':
                clasePrioridad = 'prioridad-alta';
                break;
            case 'Media':
                clasePrioridad = 'prioridad-media';
                break;
            case 'Baja':
                clasePrioridad = 'prioridad-baja';
                break;
        }
        
        tr.innerHTML = `
            <td>${tarea.id_tarea}</td>
            <td>${tarea.titulo}</td>
            <td>
                <span class="badge-estado ${claseEstado}">
                    ${tarea.estado}
                </span>
            </td>
            <td>${tarea.asignado_a || 'Sin asignar'}</td>
            <td>${formatearFecha(tarea.fecha)}</td>
            <td>
                <span class="badge-prioridad ${clasePrioridad}">
                    ${tarea.prioridad}
                </span>
            </td>
            <td>
                <button class="btn-accion btn-ver" onclick="verTarea(${tarea.id_tarea})">
                    Ver
                </button>
                <button class="btn-accion btn-editar" onclick="editarTarea(${tarea.id_tarea})">
                    Editar
                </button>
                <button class="btn-accion btn-eliminar" onclick="eliminarTarea(${tarea.id_tarea})">
                    Eliminar
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Función auxiliar para formatear fecha
function formatearFecha(fecha) {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

// Editar tarea
async function editarTarea(id) {
    const nuevoEstado = prompt('Nuevo estado (No Iniciado/En Proceso/Finalizado):');
    
    if (!nuevoEstado) return;
    
    if (!['No Iniciado', 'En Proceso', 'Finalizado'].includes(nuevoEstado)) {
        alert('Estado inválido');
        return;
    }
    
    try {
        const response = await fetch(`/api/tareas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                estado: nuevoEstado
            })
        });
        
        if (!response.ok) throw new Error('Error al actualizar tarea');
        
        alert('Tarea actualizada exitosamente');
        cargarTareas();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar la tarea');
    }
}

// Filtros
document.getElementById('filtroEstado').addEventListener('change', filtrarTareas);
document.getElementById('filtroPrioridad').addEventListener('change', filtrarTareas);

async function filtrarTareas() {
    const estado = document.getElementById('filtroEstado').value;
    const prioridad = document.getElementById('filtroPrioridad').value;
    
    try {
        let url = '/api/tareas';
        const params = new URLSearchParams();
        
        if (estado) params.append('estado', estado);
        if (prioridad) params.append('prioridad', prioridad);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const tareas = await response.json();
        mostrarTareas(tareas);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', cargarTareas);
```

---

## 🎯 Consejos de Implementación

### 1. Validaciones del Cliente

```javascript
// Validar antes de enviar
function validarFormulario(datos) {
    if (!datos.nombre_inspeccion) {
        alert('El nombre de la inspección es requerido');
        return false;
    }
    
    if (!datos.tipo_inspeccion) {
        alert('Debe seleccionar un tipo de inspección');
        return false;
    }
    
    return true;
}
```

### 2. Manejo de Errores

```javascript
// Wrapper para fetch con manejo de errores
async function hacerPeticion(url, opciones) {
    try {
        const response = await fetch(url, opciones);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        throw error;
    }
}
```

### 3. Loading States

```javascript
// Mostrar loading durante peticiones
function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = mostrar ? 'block' : 'none';
    }
}

// Usar en las peticiones
async function guardarInspeccion(datos) {
    mostrarLoading(true);
    try {
        const resultado = await hacerPeticion('/api/inspecciones', {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        return resultado;
    } finally {
        mostrarLoading(false);
    }
}
```

---

## 🎉 Resultado Final

Con esta implementación tendrás:

- ✅ Formulario dinámico que muestra solo los campos relevantes
- ✅ Subida de imágenes en base64
- ✅ Tabla de tareas con colores según estado y prioridad
- ✅ Filtros para tareas
- ✅ Manejo de errores
- ✅ Estados visuales (loading, etc.)

---

**¡Listo para implementar!** 🚀

