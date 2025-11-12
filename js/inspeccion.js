// js/inspeccion.js
// INSPECCION_SCHEMA_FULL -> extraído y expandido desde Inspeccion_final_con_todas_las_opciones.docx
// Cada item: { key, label, fields: [ { key, label, type: 'select'|'input'|'number'|'radio'|'checkbox', options?, required?, placeholder? } ] }

const INSPECCION_SCHEMA_FULL = [
  // Ubicación y generales (Step 1)
  {
    step: 1, title: "Ubicación y generales",
    sections: [
      { key: "ubicacion", label: "Ubicación", fields: [
        { key: "task_name", label: "Nombre de la tarea", type: "input", placeholder: "Nombre breve de la tarea", required:false },
        { key: "edificio", label: "Edificio", type: "input", placeholder: "Nombre o número del edificio", required:true },
        { key: "piso", label: "Piso", type: "select", options: ["PB","1","2","3","4","Otro"], required:true },
        { key: "oficina", label: "Oficina / Aula", type: "input", placeholder:"Número o nombre", required:true }
      ] }
    ]
  },

  // Estructura y cubiertas (Step 2)
  {
    step: 2, title: "Cubierta & Hojalatería & Tornillería",
    sections: [
      { key: "cubierta_techos", label: "Cubierta de techos", fields: [
        { key: "lamina_tipo", label: "Tipo de lámina", type: "select", options: ["ondulada","rectangular"], required:false },
        { key: "lamina_color", label: "Color", type: "select", options: ["galvanizado","blanco","rojo oxido","rojo teja","verde","azul","otro"], required:false },
        { key: "lamina_medida", label: "Medida (m)", type: "select", options: ["3,66","2,84","1,83","otro"], required:false },
        { key: "hojalateria_cumbrera_descripcion", label: "Cumbrera - descripción de lámina", type: "select", options: ["galvanizada","esmaltada"], required:false },
        { key: "hojalateria_cumbrera_ml", label: "Cumbrera - medida (ml)", type: "number", placeholder:"metros lineales", required:false },
        { key: "tornilleria_tipo", label: "Tipo de tornillo", type: "select", options: ["punta broca","punta fina","otro"], required:false },
        { key: "tornilleria_medida", label: "Medida tornillo", type: "select", options: ["1 pulgada","2 pulgadas","3 pulgadas","otro"], required:false }
      ]},

      { key: "estructuras_metal", label: "Estructuras de metal", fields: [
        { key: "estructura_tipo", label: "Tipo de estructura", type:"select", options:["viga","columna","cercha","soporte","marco"], required:false },
        { key: "estructura_material", label: "Material", type:"select", options:["acero galvanizado","acero inoxidable","pintado"], required:false },
        { key: "estructura_medida_m", label: "Medida en m", type:"number", required:false },
  { key: "estructura_soldaduras_estado", label: "Estado de soldaduras/uniones", type: "input", required:false },
  { key: "estructura_corrosion", label: "Oxidación o corrosión", type:"radio", options:["si","no"], required:false }
      ]}
    ]
  },

  // Acabados pisos, enchapes, pintura (Step 3)
  {
    step: 3, title: "Pisos / Enchapes / Pintura",
    sections: [
      { key: "pisos", label: "Pisos", fields: [
        { key: "piso_material", label: "Tipo de material", type: "select", options: ["cerámica","porcelanato","PVC","laminado","alfombra","madera","vinílico","otro"], required:false },
        { key: "piso_estado", label: "Estado general (observaciones)", type:"input", required:false },
        { key: "enchapes_tipo", label: "Enchapes", type: "select", options: ["azulejo","porcelanato","lámina PVC","mármol","cuarzo","granito","otro"], required:false }
      ]},
      { key: "paredes_pintura", label: "Paredes y Pintura", fields: [
        { key: "paredes_material", label: "Paredes - material", type:"select", options:["Block","gipsun","Durock","otro"], required:false },
  { key: "pintura_tipo", label: "Tipo de pintura", type:"select", options:["interior","exterior","aceite","acrilica (mate)","acrilica (satinada)","epóxica","texturada","impermeabilizante","otro"], required:false },
  { key: "pintura_estado", label: "Deterioro pintura", type:"input", required:false }
      ]}
    ]
  },

  // Electricidad y A/C (Step 4)
  {
    step: 4, title: "Electricidad & Aire acondicionado",
    sections: [
      { key: "electricidad", label: "Electricidad - iluminación / tomas", fields: [
        { key: "iluminacion_ubicacion", label: "Iluminación - Ubicación", type:"select", options:["interna","externa"], required:false },
        { key: "iluminacion_bombillo", label: "Tipo de bombillo", type:"select", options:["LED","fluorescente","incandescente","otro"], required:false },
        { key: "iluminacion_tipo_luz", label: "Tipo de luz", type:"select", options:["luz blanca","luz cálida"], required:false },
        { key: "iluminacion_watts", label: "Watts", type:"number", placeholder:"Ej: 12", required:false },
        { key: "tomacorriente_tipo", label: "Tomacorriente tipo", type:"select", options:["sencillo","doble","otro"], required:false },
        { key: "tomacorriente_voltaje", label: "Voltaje", type:"select", options:["110v","220v"], required:false },
        { key: "centros_carga_marca", label: "Centros de carga - marca", type:"input", required:false },
        { key: "centros_carga_circuitos", label: "Cantidad de circuitos", type:"number", required:false }
      ]},

      { key: "aire_acondicionado", label: "Aire acondicionado", fields: [
        { key: "ac_tipo", label: "Tipo", type:"select", options:["mini split","cassette","piso-techo","ventana","central"], required:false },
        { key: "ac_btu", label: "Capacidad (BTU)", type:"number", placeholder:"Ej: 12000", required:false },
        { key: "ac_gas", label: "Gas refrigerante", type:"select", options:["R410A","R22","R32","otro"], required:false },
  { key: "ac_filtros_limpios", label: "Filtros limpios", type:"radio", options:["si","no"], required:false }
      ]}
    ]
  },

  // Datos / Telefonía / Cámaras (Step 5)
  {
    step: 5, title: "Datos / Telefonía / Cámaras",
    sections: [
      { key: "datos_red", label: "Red y Telefonía", fields: [
        { key: "datos_tipo_red", label: "Tipo de red", type:"select", options:["cableada","inalámbrica"], required:false },
  { key: "datos_cableado_estado", label: "Cableado estructurado - estado", type:"radio", options:["si","no"], required:false },
        { key: "telefonia_tipo_linea", label: "Telefonía - tipo de línea", type:"select", options:["análoga","digital","IP","otro"], required:false }
      ]},

      { key: "camaras", label: "Cámaras de seguridad", fields: [
        { key: "camaras_tipo", label: "Tipo", type:"select", options:["analógica","IP","PTZ","domo","bala","otro"], required:false },
        { key: "camaras_resolucion", label: "Resolución (MP)", type:"number", required:false },
  { key: "camaras_estado_lente", label: "Estado del lente y carcasa", type:"radio", options:["si","no"], required:false },
  { key: "camaras_alimentacion_estable", label: "Alimentación eléctrica estable", type:"radio", options:["si","no"], required:false },
        { key: "camaras_conectividad", label: "Conectividad", type:"select", options:["cable","Wi-Fi"], required:false },
  { key: "camaras_grabacion_funcional", label: "Grabación funcional", type:"radio", options:["si","no"], required:false }
      ]}
    ]
  },

  // Bombas, planta eléctrica, sistemas contra incendios, portones (Step 6)
  {
    step: 6, title: "Bombas / Planta eléct / Contra incendios / Portones",
    sections: [
      { key: "bombas_agua", label: "Bombas de agua", fields: [
        { key: "bomba_tipo", label: "Tipo de bomba", type:"select", options:["centrífuga","sumergible","periférica","presurizadora","pozo profundo","otro"], required:false },
        { key: "bomba_potencia", label: "Potencia (HP o kW)", type:"input", placeholder:"Ej: 2 HP / 1.5 kW", required:false },
        { key: "bomba_material", label: "Material del cuerpo", type:"select", options:["hierro fundido","acero inoxidable","plástico reforzado","otro"], required:false },
  { key: "bomba_sello_estado", label: "Estado de sello mecánico", type:"input", required:false }
      ]},

      { key: "sistema_contra_incendios", label: "Sistema contra incendios", fields: [
        { key: "incendios_tipo", label: "Tipo de sistema", type:"select", options:["rociadores","gabinetes","extintores","hidrantes","alarma","detectores"], required:false },
        { key: "incendios_fecha_ultima_inspeccion", label: "Fecha última inspección", type:"input", placeholder:"YYYY-MM-DD", required:false },
        { key: "incendios_presion", label: "Presión del sistema (si aplica)", type:"input", placeholder:"psi / bar", required:false },
  { key: "incendios_estado_valvulas", label: "Estado de válvulas y mangueras", type:"radio", options:["si","no"], required:false }
      ]},

      { key: "planta_electrica", label: "Planta eléctrica", fields: [
        { key: "planta_combustible", label: "Combustible", type:"select", options:["diésel","gasolina","gas LP","otro"], required:false },
        { key: "planta_capacidad_kva", label: "Capacidad (kVA)", type:"input", required:false },
        { key: "planta_fecha_arranque", label: "Fecha última prueba/arranque", type:"input", placeholder:"YYYY-MM-DD", required:false }
      ]},

      { key: "motores_portones", label: "Motores / Portones", fields: [
        { key: "porton_tipo", label: "Tipo portón", type:"select", options:["corredizo","abatible","enrollable"], required:false },
  { key: "porton_motores_estado", label: "Estado motor", type:"radio", options:["si","no"], required:false }
      ]}
    ]
  },

  // Otros & cierre (Step 7) - solo prioridad mantenida
  {
    step: 7, title: "Otros & Prioridad",
    sections: [
      { key: "prioridad", label: "Prioridad de la tarea", fields: [
        { key: "prioridad_tarea", label: "Seleccionar prioridad", type:"select", options:["baja","media","alta"], required:true }
      ]}
    ]
  }
];

// -------------- Render del wizard --------------

// Do not cache the wizard container at module load time because when the
// page is restored from bfcache the DOM nodes can be different. Fetch it
// lazily inside functions to ensure we operate on the current document.
const totalSteps = 7;
let currentStep = 1;

function createField(sectionKey, f){
  const wrapper = document.createElement('div');
  wrapper.className = 'form-row';
  const label = document.createElement('label');
  label.textContent = f.label;
  wrapper.appendChild(label);

  if(f.type === 'select'){
    const sel = document.createElement('select');
    sel.name = `${sectionKey}__${f.key}`;
    const opt0 = document.createElement('option'); opt0.value=''; opt0.textContent='-- seleccionar --';
    sel.appendChild(opt0);
    (f.options||[]).forEach(o=>{
      const op = document.createElement('option'); op.value=o; op.textContent=o;
      sel.appendChild(op);
    });
    wrapper.appendChild(sel);

    // si existe 'Otro' mostrar input adicional
    const other = document.createElement('input');
    other.name = `${sectionKey}__${f.key}__other`;
    other.placeholder = 'Si otro, especifique';
    other.style.display = 'none';
    other.style.minWidth = '180px';
    sel.addEventListener('change', ()=> {
      other.style.display = sel.value === 'Otro' || sel.value === 'otro' ? 'inline-block' : 'none';
    });
    wrapper.appendChild(other);

  } else if (f.type === 'radio') {
    const container = document.createElement('div');
    (f.options||[]).forEach(o=>{
      const id = `${sectionKey}__${f.key}__${o}`;
      const input = document.createElement('input');
      input.type = 'radio'; input.name = `${sectionKey}__${f.key}`; input.value = o; input.id = id;
      const lab = document.createElement('label'); lab.htmlFor = id; lab.style.marginRight='0.6rem';
      lab.appendChild(document.createTextNode(o));
      container.appendChild(input); container.appendChild(lab);
    });
    wrapper.appendChild(container);

  } else if (f.type === 'number') {
    const inp = document.createElement('input');
    inp.type = 'number'; inp.name = `${sectionKey}__${f.key}`; inp.placeholder = f.placeholder || '';
    wrapper.appendChild(inp);

  } else {
    // default input text
    const inp = document.createElement('input');
    inp.type = 'text'; inp.name = `${sectionKey}__${f.key}`; inp.placeholder = f.placeholder || '';
    wrapper.appendChild(inp);
  }

  return wrapper;
}

function renderWizard(){
  // Para cada step genera un contenedor con varias secciones (scroll dentro del paso)
  const container = document.getElementById('wizard-container');
  if(!container) {return;}
  for(let s=1;s<=totalSteps;s++){
    const stepDiv = document.createElement('div');
    stepDiv.className = 'wizard-step';
    stepDiv.dataset.step = s;

    const stepSchema = INSPECCION_SCHEMA_FULL.filter(x=>x.step===s);
    stepSchema.forEach(block => {
      const title = document.createElement('h3');
      title.style.marginTop='0';
      title.style.marginBottom='0.4rem';
      title.textContent = block.title;
      stepDiv.appendChild(title);

      block.sections.forEach(sec => {
        const fs = document.createElement('fieldset');
        const leg = document.createElement('legend');
        leg.textContent = sec.label;
        fs.appendChild(leg);

        sec.fields.forEach(f => {
          const fld = createField(sec.key, f);
          fs.appendChild(fld);
        });

        stepDiv.appendChild(fs);
      });
    });

    container.appendChild(stepDiv);
  }

  // mostrar step inicial
  showStep(currentStep);
}
function showStep(n){
  document.querySelectorAll('.wizard-step').forEach(el=>{
    el.classList.remove('active');
    if(Number(el.dataset.step)===n) {el.classList.add('active');}
  });
  document.getElementById('step-indicator').textContent = `Paso ${n} / ${totalSteps}`;
  // prev/next visibility
  document.getElementById('prev-step').style.display = n===1 ? 'none' : 'inline-block';
  document.getElementById('next-step').textContent = n===totalSteps ? 'Último / Revisar' : 'Siguiente';
  // generar preview parcial
  renderPreviewCard();
}

// ------------- Collect form data -> objeto tarea -------------
function collectAllData(){
  const obj = { location:{}, timestamp: new Date().toISOString(), sections:{}, priority: null };
  // images will be collected separately (file input)
  obj.images = [];
  // collect form elements when needed via querySelector directly; no persistent collection required
  // helper to get value and handle other fields
  function getValue(name){
    const el = document.querySelector(`[name="${name}"]`);
    if(!el) {return '';}
    if(el.type === 'radio'){
      const r = document.querySelector(`[name="${name}"]:checked`);
      return r ? r.value : '';
    }
    return el.value || '';
  }

  // Ubicacion:
  obj.location.edificio = getValue('ubicacion__edificio') || '';
  // `edificio` is now a free-text input, no secondary 'otro' field required
  obj.location.piso = getValue('ubicacion__piso') || '';
  obj.location.oficina = getValue('ubicacion__oficina') || '';
  // optional task name from the form
  obj.task_name = getValue('ubicacion__task_name') || '';

  // recorre el schema y obtiene campos
  INSPECCION_SCHEMA_FULL.forEach(block => {
    block.sections.forEach(sec => {
      if(!obj.sections[sec.key]) {obj.sections[sec.key] = {};}
      sec.fields.forEach(f => {
        const name = `${sec.key}__${f.key}`;
        let val = '';
        if(f.type === 'radio'){
          const checked = document.querySelector(`[name="${name}"]:checked`);
          val = checked ? checked.value : '';
        } else {
          const el = document.querySelector(`[name="${name}"]`);
          if(el) {val = el.value || '';}
          // chequear campo 'other' cuando exista:
          if(val === 'Otro' || val === 'otro'){
            const other = document.querySelector(`[name="${name}__other"]`);
            if(other) {val = other.value || val;}
          }
        }
        obj.sections[sec.key][f.key] = val;
      });
    });
  });

  // prioridad
  const pr = document.querySelector('[name="prioridad__prioridad_tarea"]');
  if(pr) {obj.priority = pr.value || '';}
  // collect selected image file names (actual file bytes will be read when sending)
  const filesInput = document.getElementById('inspection-images');
  if(filesInput && filesInput.files && filesInput.files.length){
    // just store file names here for preview; actual base64 will be attached in sendTask
    obj.images = Array.from(filesInput.files).map(f=>({ name: f.name, size: f.size, type: f.type }));
  }
  return obj;
}

// ------------- Preview / Descargar / Enviar -------------
function renderPreviewCard(){
  const obj = collectAllData();
  const previewEl = document.getElementById('task-preview');
  // Build a clean, professional card showing only filled fields
  const card = document.createElement('div');
  card.className = 'preview-card';
  const title = document.createElement('h4');
  // Show the explicit task name entered by the user. If empty, show a simple placeholder.
  title.textContent = obj.task_name && obj.task_name.trim() ? obj.task_name.trim() : 'Nombre de la tarea';
  card.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'preview-meta';
  meta.innerHTML = `<small>Fecha: ${new Date(obj.timestamp).toLocaleString()}</small>`;
  card.appendChild(meta);

  // sections
  function toTitle(s){
    return String(s)
      .split(/\s+/)
      .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w)
      .join(' ');
  }
  function prettyFieldLabel(key){
    if(key === 'oficina') {return 'Oficina/Aula';}
    return toTitle(String(key).replace(/_/g,' '));
  }

  const sections = obj.sections || {};
  Object.keys(sections).forEach(secKey=>{
    const secObj = sections[secKey];
    // only include if at least one field has a value (skip task_name to avoid redundancy in preview)
    const filled = Object.entries(secObj).filter(([k,v])=>k !== 'task_name' && v !== null && v !== undefined && String(v).trim() !== '');
    if(filled.length){
      const secDiv = document.createElement('div');
      secDiv.className = 'preview-section';
      const secTitle = document.createElement('h5');
      secTitle.textContent = toTitle(secKey.replace(/_/g,' '));
      secDiv.appendChild(secTitle);
      const ul = document.createElement('ul');
      filled.forEach(([k,v])=>{
        const li = document.createElement('li');
        li.innerHTML = `<strong>${prettyFieldLabel(k)}:</strong> ${String(v)}`;
        ul.appendChild(li);
      });
      secDiv.appendChild(ul);
      card.appendChild(secDiv);
    }
  });

  // images preview (only filenames here; images are shown below separately)
  if(obj.images && obj.images.length){
    const imgs = document.createElement('div');
    imgs.className = 'preview-images-info';
    imgs.innerHTML = `<strong>Imágenes:</strong> ${obj.images.map(i=>i.name).join(', ')}`;
    card.appendChild(imgs);
  }

  // replace preview content with card
  previewEl.innerHTML = '';
  previewEl.appendChild(card);
  renderImagesPreview();
}

function renderImagesPreview(){
  const imagesContainer = document.getElementById('images-preview');
  imagesContainer.innerHTML = '';
  const input = document.getElementById('inspection-images');
  if(!input || !input.files || input.files.length===0) {return;}
  Array.from(input.files).forEach((f, idx)=>{
    const box = document.createElement('div');
    box.className = 'img-box';
    box.style.border = '1px solid #ddd';
    box.style.padding = '4px';
    box.style.borderRadius = '6px';
    box.style.background = '#fff';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.alignItems = 'center';
    box.style.width = '120px';

    const img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.height = '80px';
    img.style.objectFit = 'cover';
    const reader = new FileReader();
    reader.onload = ()=>{ img.src = reader.result; };
    reader.readAsDataURL(f);

    const lbl = document.createElement('div'); lbl.textContent = f.name; lbl.style.fontSize='0.8rem'; lbl.style.marginTop='0.25rem'; lbl.style.textAlign='center';
    const del = document.createElement('button'); del.textContent = 'Borrar'; del.className='small ghost'; del.style.marginTop='0.25rem';
    del.addEventListener('click', ()=>{
      // remove this file from the FileList by rebuilding a DataTransfer
      const dt = new DataTransfer();
      Array.from(input.files).forEach((ff,i)=>{ if(i!==idx) {dt.items.add(ff);} });
      input.files = dt.files;
      renderImagesPreview();
      renderPreviewCard();
    });

    box.appendChild(img); box.appendChild(lbl); box.appendChild(del);
    imagesContainer.appendChild(box);
  });
}
// JSON download removed — not needed in this UI
async function sendTask(){
  const inspection = collectAllData();
  // If there are image files, read them as base64 and include them in inspection.images_base64
  const filesInput = document.getElementById('inspection-images');
  if(filesInput && filesInput.files && filesInput.files.length){
    const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = ()=> resolve(r.result);
      r.onerror = ()=> reject(new Error('read_error'));
      r.readAsDataURL(file);
    });
    try {
      const arr = [];
      for(const f of Array.from(filesInput.files)){
        // limit size check: skip > 5MB per image for now
        if(f.size > 5 * 1024 * 1024){
          console.warn('Skipping large image', f.name);
          continue;
        }
        const data = await readFileAsDataURL(f);
        arr.push({ name: f.name, type: f.type, data });
      }
      if(arr.length) {inspection.images_base64 = arr;}
    } catch(e){
      console.error('Error reading images', e);
    }
  }
  // Build payload for inspection
  const oficina = (inspection.location && inspection.location.oficina) ? inspection.location.oficina : '';
  const edificio = (inspection.location && inspection.location.edificio) ? inspection.location.edificio : '';
  // Prefer explicit task name if provided
  const explicitName = inspection.task_name || inspection.sections?.ubicacion?.task_name || '';
  const title = explicitName || `Inspección - ${edificio}${oficina ? ' / ' + oficina : ''}`;
  
  const payload = {
    title,
    assignedTo: '',
    date: new Date().toISOString().split('T')[0],
    inspection
  };

  try {
    const res = await fetch('/api/inspections', {
      method:'POST', 
      headers:{ 'Content-Type':'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if(!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error: ' + res.status);
    }
    const data = await res.json();
    alert(`✅ Inspección guardada exitosamente!\n\nID Inspección: ${data.id_inspeccion}\nID Tarea: ${data.id_tarea}`);
    window.location.href = '/Vistas/dashboard.html';
  } catch(e){
    console.error(e);
    alert('Error al enviar la tarea. Revisa la consola.');
  }
}

// ------------- Validación básica antes de avanzar -------------
function validateStep(step){
  // valida fields con required:true en el esquema para el paso actual
  let valid = true;
  const blocks = INSPECCION_SCHEMA_FULL.filter(x=>x.step===step);
  blocks.forEach(block=>{
    block.sections.forEach(sec=>{
      sec.fields.forEach(f=>{
        if(f.required){
          const name = `${sec.key}__${f.key}`;
          const el = document.querySelector(`[name="${name}"]`);
          if(!el) { valid = false; return; }
          if(el.type === 'radio'){
            const checked = document.querySelector(`[name="${name}"]:checked`);
            if(!checked) {valid = false;}
          } else if(!el.value){
            // if select and other visible then require other
            if(el.tagName.toLowerCase()==='select'){
              if((el.value === 'Otro' || el.value === 'otro')){
                const other = document.querySelector(`[name="${name}__other"]`);
                if(!other || !other.value) {valid = false;}
              } else {valid = false;} // if empty
            } else {valid = false;}
          }
        }
      });
    });
  });
  return valid;
}

// ------------- Initialization (idempotent) -------------
function initInspection(){
  // clear and render wizard (idempotent)
  // reset to first step to ensure UI shows correctly when re-initialized
  currentStep = 1;
  const container = document.getElementById('wizard-container');
  if(container) {container.innerHTML = '';}
  renderWizard();
  renderPreviewCard();

  // helper to safely attach event listener (replace node to avoid duplicate handlers)
  function onceAttach(selector, event, handler){
    const el = document.querySelector(selector);
    if(!el) {return null;}
    try{ const clone = el.cloneNode(true); el.parentNode.replaceChild(clone, el); clone.addEventListener(event, handler); return clone; }catch(e){ el.addEventListener(event, handler); return el; }
  }

  // navigation buttons
  onceAttach('#prev-step', 'click', ()=>{ if(currentStep>1){ currentStep--; showStep(currentStep); window.scrollTo(0,0); } });
  onceAttach('#next-step', 'click', ()=>{
    if(!validateStep(currentStep)){
      if(!confirm('No todos los campos obligatorios en este paso están llenos. ¿Deseas continuar igual?')) {return;}
    }
    if(currentStep < totalSteps){ currentStep++; showStep(currentStep); window.scrollTo(0,0); }
    else { renderPreviewCard(); window.scrollTo(0, document.body.scrollHeight); }
  });

  // photos and send
  onceAttach('#send-task', 'click', sendTask);
  const addPhotoBtn = document.getElementById('add-photo');
  const clearPhotosBtn = document.getElementById('clear-photos');
  const filesInputEl = document.getElementById('inspection-images');
    if(addPhotoBtn && filesInputEl){
    // replace/add click
    try{ addPhotoBtn.replaceWith(addPhotoBtn.cloneNode(true)); }catch(e){ void 0; }
    document.getElementById('add-photo').addEventListener('click', ()=> filesInputEl.click());
  }
  if(clearPhotosBtn && filesInputEl){
    try{ clearPhotosBtn.replaceWith(clearPhotosBtn.cloneNode(true)); }catch(e){ void 0; }
    document.getElementById('clear-photos').addEventListener('click', ()=>{ filesInputEl.value = ''; renderImagesPreview(); renderPreviewCard(); });
  }

  // preview updates
  window.removeEventListener('input', renderPreviewCard);
  window.addEventListener('input', ()=> { renderPreviewCard(); });
  if(filesInputEl){
    try{ filesInputEl.removeEventListener('change', renderImagesPreview); }catch(e){ void 0; }
    filesInputEl.addEventListener('change', ()=> { renderImagesPreview(); renderPreviewCard(); });
  }
}

// call on initial load
initInspection();

// Ensure wizard is re-initialized when the page becomes visible again
// (covers bfcache and normal navigation back/forward flows)
window.addEventListener('pageshow', ()=>{
  initInspection();
});
