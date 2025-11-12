// usuario.js - vista para que usuarios vean solo las tareas asignadas y pueda subir fotos / cambiar estado

async function initUserView(){
  const authArea = document.getElementById('auth-area');
  const tasksArea = document.getElementById('tasks-area');

  // Check auth
  let me = await fetch('/auth/me', { credentials: 'include' }).then(r=>r.json()).catch(()=>({ authenticated:false }));

  if (!me.authenticated) {
    // If the user is not authenticated, redirect to the canonical login page
    // (we previously injected an inline login form here; prefer the standalone login view).
    window.location.href = '/Vistas/login.html';
    return;
  }

  // If authenticated, show welcome and list tasks assigned
  authArea.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><div><strong>${me.user.nombre || me.user.email}</strong><div style="color:var(--canva-gray-dark)">${me.user.rol}</div></div><div><button id="logoutBtn" class="small ghost" type="button"><img src="/imagenes/icon-logout.svg" aria-hidden="true" style="height:16px;width:16px;vertical-align:middle;margin-right:8px;filter:invert(1) grayscale(1) contrast(100%);">Cerrar sesión</button></div></div>`;
  document.getElementById('logoutBtn').addEventListener('click', async ()=>{
    const tokenRes = await fetch('/auth/csrf', { credentials: 'include', cache: 'no-store' });
    const token = tokenRes.ok ? (await tokenRes.json()).csrfToken : null;
    try {
      await fetch('/auth/logout', { method:'POST', credentials:'include', headers:{'csrf-token': token}, cache: 'no-store' });
    } catch (e) {
      // ignore network errors for logout, still redirect
    }
    // Redirect to the main login page after logout instead of reloading the same SPA view
    window.location.href = '/Vistas/login.html';
  });

  // load tasks and filter by assignedTo matching user's email or name
  const tasksRes = await fetch('/api/tasks', { credentials: 'include' });
  if (!tasksRes.ok) { tasksArea.innerHTML = '<p>Error al cargar tareas</p>'; return; }
  const tasks = await tasksRes.json();

  const assigned = tasks.filter(t => {
    if (!t.assignedTo) {return false;}
    const lower = String(t.assignedTo).toLowerCase();
    return lower.includes((me.user.email||'').toLowerCase()) || lower.includes((me.user.nombre||'').toLowerCase());
  });

  if (!assigned.length) {
    tasksArea.innerHTML = '<p>No tienes tareas asignadas.</p>';
    return;
  }

  // Render tasks
  tasksArea.innerHTML = '';
  assigned.forEach(t => {
  const box = document.createElement('div');
  box.className = 'usuario-card';

    const title = document.createElement('h4'); title.textContent = t.title; title.style.margin='0 0 8px 0'; title.style.color='var(--canva-blue)';
    // header row: title left, priority pill right
    const headerRow = document.createElement('div'); headerRow.style.display='flex'; headerRow.style.justifyContent='space-between'; headerRow.style.alignItems='center';
    const titleWrap = document.createElement('div'); titleWrap.appendChild(title);
    const rightWrap = document.createElement('div'); rightWrap.style.display='flex'; rightWrap.style.gap='8px'; rightWrap.style.alignItems='center';

    // priority pill
    const priorityText = (t.priority || 'Media').toString();
    const prioritySpan = document.createElement('span');
    prioritySpan.textContent = priorityText;
    function getPriorityClass(p){
      const s = (p||'').toString().toLowerCase();
      if (s.includes('alta') || s.includes('high')) {return 'priority-high';}
      if (s.includes('media') || s.includes('medium')) {return 'priority-medium';}
      return 'priority-low';
    }
    prioritySpan.className = getPriorityClass(priorityText);
    rightWrap.appendChild(prioritySpan);

    headerRow.appendChild(titleWrap);
    headerRow.appendChild(rightWrap);
    box.appendChild(headerRow);

    if (t.instruction) {
      const instr = document.createElement('div'); instr.innerHTML = `<strong>Instrucción:</strong> ${t.instruction.title} <div style="color:var(--canva-gray-dark)">${t.instruction.description||''}</div>`; instr.style.marginBottom='8px'; box.appendChild(instr);
    }

    const desc = document.createElement('p'); desc.textContent = t.description || ''; desc.style.color='var(--canva-gray-dark)'; box.appendChild(desc);

    // status selector
    const statusLabel = document.createElement('label'); statusLabel.textContent = 'Estado: '; statusLabel.style.fontWeight='700';
    const sel = document.createElement('select'); ['not_started','in_progress','done'].forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent = s==='not_started'?'No iniciado':s==='in_progress'?'En proceso':'Finalizado'; if(s===t.status) {o.selected=true;} sel.appendChild(o); });
    sel.style.marginLeft='8px'; sel.style.padding='6px'; sel.style.border='1px solid var(--canva-gray-light)'; sel.style.borderRadius='6px';
    const statusRow = document.createElement('div'); statusRow.style.marginTop='10px'; statusRow.style.display='flex'; statusRow.style.alignItems='center'; statusRow.appendChild(statusLabel); statusRow.appendChild(sel);

    // status badge that mirrors dashboard colors
    const statusSpan = document.createElement('span');
    function getStatusBadgeInfo(status){
      if (status === 'done') {return { cls: 'badge-done', text: 'Finalizado' };}
      if (status === 'in_progress') {return { cls: 'badge-progress', text: 'En proceso' };}
      return { cls: 'badge-notstarted', text: 'No iniciado' };
    }
    const info = getStatusBadgeInfo(t.status);
    statusSpan.className = `task-status-badge ${info.cls}`;
    statusSpan.textContent = info.text;
    statusRow.appendChild(statusSpan);

    // update badge when select changes
    sel.addEventListener('change', ()=>{
      const newInfo = getStatusBadgeInfo(sel.value);
      statusSpan.className = `task-status-badge ${newInfo.cls}`;
      statusSpan.textContent = newInfo.text;
    });

    box.appendChild(statusRow);

    // file input & preview
  const fileInput = document.createElement('input'); fileInput.type='file'; fileInput.accept='image/*'; fileInput.multiple=true; fileInput.style.display='none'; fileInput.id = `files-${t.id}`;
  // hint mobile devices to open camera when possible
  try { fileInput.setAttribute('capture', 'environment'); } catch(e) { void 0; }
  const addBtn = document.createElement('button'); addBtn.className='small ghost'; addBtn.type = 'button'; addBtn.style.marginLeft='10px';
  addBtn.innerHTML = `<img src="/imagenes/icon-upload.svg" aria-hidden="true" style="height:16px;width:16px;vertical-align:middle;margin-right:8px;filter:invert(1) grayscale(1) contrast(100%);">Agregar foto`;
    const preview = document.createElement('div'); preview.style.display='flex'; preview.style.gap='8px'; preview.style.marginTop='10px';

    addBtn.addEventListener('click', ()=> fileInput.click());
    fileInput.addEventListener('change', ()=>{
      preview.innerHTML='';
        Array.from(fileInput.files).forEach(f=>{
        const imgBox = document.createElement('div'); imgBox.style.width='80px'; imgBox.style.height='80px'; imgBox.style.overflow='hidden'; imgBox.style.borderRadius='6px'; imgBox.style.border='1px solid var(--canva-gray-light)';
        const img = document.createElement('img'); img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover';
        const reader = new FileReader(); reader.onload = (ev)=> img.src = ev.target.result; reader.readAsDataURL(f);
        img.loading = 'lazy';
        imgBox.appendChild(img); preview.appendChild(imgBox);
      });
    });

    box.appendChild(fileInput);
    box.appendChild(addBtn);
    box.appendChild(preview);

    // preview area for inspection (before) and task (after) images
    const previewBox = document.createElement('div');
    previewBox.style.marginTop = '12px';
    previewBox.className = 'task-preview-box';
    box.appendChild(previewBox);

    // Fetch inspection details (includes inspection images saved in DB)
    (async function loadInspectionAndImages() {
      try {
        const inspRes = await fetch(`/api/tasks/${t.id}/inspection`, { credentials: 'include' });
        if (inspRes.ok) {
          const inspJson = await inspRes.json();
          const insp = inspJson.inspection;
          const inspWrap = document.createElement('div');
          inspWrap.style.marginTop = '8px';
          inspWrap.innerHTML = `<strong>Inspección:</strong> ${inspJson.inspection ? (inspJson.inspection.name || '') : ''}`;
          // show observations
          if (insp && insp.observations) {
            const obs = document.createElement('div'); obs.style.color = 'var(--canva-gray-dark)'; obs.style.marginTop = '6px'; obs.textContent = insp.observations; inspWrap.appendChild(obs);
          }
          // show inspection images (if any) - these come from DB as data_base64
          if (inspJson.inspection && Array.isArray(inspJson.inspection.imagenes) && inspJson.inspection.imagenes.length) {
            const beforeWrap = document.createElement('div'); beforeWrap.style.marginTop = '8px'; beforeWrap.innerHTML = '<strong>Fotos inspección (antes):</strong>';
            const imgsRow = document.createElement('div'); imgsRow.style.display = 'flex'; imgsRow.style.gap = '8px'; imgsRow.style.marginTop = '6px';
            inspJson.inspection.imagenes.forEach(img => {
              const i = document.createElement('img');
              i.src = img.data_base64 || img.data || '';
              i.loading = 'lazy';
              i.style.width = '120px'; i.style.height = '80px'; i.style.objectFit = 'cover'; i.style.borderRadius = '6px'; i.style.border = '1px solid var(--canva-gray-light)';
              imgsRow.appendChild(i);
            });
            beforeWrap.appendChild(imgsRow);
            inspWrap.appendChild(beforeWrap);
          }
          previewBox.appendChild(inspWrap);
        }
      } catch (err) {
        console.warn('No se pudo cargar inspección para tarea', t.id, err);
      }

      // Fetch task uploaded images (after photos) from new endpoint
      try {
        const imgsRes = await fetch(`/api/tasks/${t.id}/images`, { credentials: 'include' });
        if (imgsRes.ok) {
          const imgsJson = await imgsRes.json();
          if (imgsJson.files && imgsJson.files.length) {
            const afterWrap = document.createElement('div'); afterWrap.style.marginTop = '8px'; afterWrap.innerHTML = '<strong>Fotos de la tarea (después):</strong>';
            const imgsRow = document.createElement('div'); imgsRow.style.display = 'flex'; imgsRow.style.gap = '8px'; imgsRow.style.marginTop = '6px';
            imgsJson.files.forEach(f => {
              const i = document.createElement('img');
              i.src = f.url; i.alt = f.name; i.loading = 'lazy';
              i.style.width = '120px'; i.style.height = '80px'; i.style.objectFit = 'cover'; i.style.borderRadius = '6px'; i.style.border = '1px solid var(--canva-gray-light)';
              imgsRow.appendChild(i);
            });
            afterWrap.appendChild(imgsRow);
            previewBox.appendChild(afterWrap);
          }
        }
      } catch (err) {
        console.warn('No se pudo cargar imágenes de tarea', t.id, err);
      }
    })();

    // update button
    const updateBtn = document.createElement('button'); updateBtn.textContent='Guardar cambios'; updateBtn.className='small'; updateBtn.style.marginTop='12px';
    updateBtn.addEventListener('click', async ()=>{
      const newStatus = sel.value;
      // if setting to done, require at least one photo
      if (newStatus === 'done' && (!fileInput.files || fileInput.files.length === 0)) {
        alert('Al marcar como Finalizado, debes subir al menos una foto de la tarea finalizada.');
        return;
      }

  // If photos present, upload first
      if (fileInput.files && fileInput.files.length > 0) {
        const toSend = [];
        for (const f of Array.from(fileInput.files)) {
          const data = await new Promise((res, rej)=>{
            const r = new FileReader(); r.onload = ()=> res(r.result); r.onerror = rej; r.readAsDataURL(f);
          });
          toSend.push({ name: f.name, type: f.type, data });
        }

        const imgRes = await fetch(`/api/tasks/${t.id}/images`, {
          method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ images: toSend })
        });
    if (!imgRes.ok) { alert('Error subiendo imágenes'); return; }
  await imgRes.json();
      }

      // Update task status
      const res = await fetch(`/api/tasks/${t.id}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) { alert('Error actualizando estado'); return; }

      alert('Tarea actualizada correctamente');
      // reload
      location.reload();
    });

    box.appendChild(updateBtn);

    tasksArea.appendChild(box);
  });
}

document.addEventListener('DOMContentLoaded', initUserView);
