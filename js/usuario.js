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
  // create a two-column preview area similar to admin view
  const previewContainer = document.createElement('div');
  previewContainer.style.display = 'flex';
  previewContainer.style.gap = '12px';
  previewContainer.style.alignItems = 'flex-start';
  previewContainer.style.flexWrap = 'wrap';
  const previewLeft = document.createElement('div'); previewLeft.style.flex = '1 1 45%';
  const previewRight = document.createElement('div'); previewRight.style.flex = '1 1 45%';
  previewContainer.appendChild(previewLeft);
  previewContainer.appendChild(previewRight);
  previewBox.appendChild(previewContainer);
  box.appendChild(previewBox);

    // Populate preview area using shared preview builder when available
    (async function populatePreview() {
      try {
        if (window && typeof window.buildFullPreview === 'function') {
          const previewNode = await window.buildFullPreview(t.id);
          if (previewNode) {
            // replace contents of previewBox with the built preview
            previewBox.innerHTML = '';
            previewBox.appendChild(previewNode);
            // attach lightbox to any thumbnails inside the preview
            try { if (window && typeof window.attachLightbox === 'function') { window.attachLightbox(previewBox); } } catch(e){ console.warn('attachLightbox failed', e); }
            return;
          }
        }

        // Fallback: load task images only (best-effort)
        const imgsRes = await fetch(`/api/tasks/${t.id}/images`, { credentials: 'include' });
        if (imgsRes.ok) {
          const imgsJson = await imgsRes.json();
          if (imgsJson.files && imgsJson.files.length) {
            const afterWrap = document.createElement('div'); afterWrap.style.marginTop = '8px'; afterWrap.innerHTML = '<strong>Fotos de la tarea (después):</strong>';
            const imgsRow = document.createElement('div'); imgsRow.style.display = 'flex'; imgsRow.style.gap = '8px'; imgsRow.style.marginTop = '6px';
            imgsJson.files.forEach(f => {
              const wrapper = document.createElement('div'); wrapper.style.display='inline-block'; wrapper.style.textAlign='center';
              const i = document.createElement('img'); i.src = f.url; i.alt = f.name; i.loading='lazy'; i.style.width='120px'; i.style.height='80px'; i.style.objectFit='cover'; i.style.borderRadius='6px'; i.style.border='1px solid var(--canva-gray-light)';
              wrapper.appendChild(i);
              const meta = document.createElement('div'); meta.style.fontSize='12px'; meta.style.color='var(--canva-gray-dark)'; meta.style.marginTop='4px';
              let txt = f.name || '';
              if (f.uploadedAt) txt += ' · ' + formatDate(f.uploadedAt);
              if (f.size) txt += ' · ' + Math.round((f.size||0)/1024) + ' KB';
              if (f.uploadedBy) txt += ' · por: ' + f.uploadedBy;
              meta.textContent = txt;
              wrapper.appendChild(meta);
              imgsRow.appendChild(wrapper);
            });
            afterWrap.appendChild(imgsRow);
            previewRight.appendChild(afterWrap);
            try { if (window && typeof window.attachLightbox === 'function') { window.attachLightbox(previewBox); } } catch(e){ console.warn('attachLightbox failed', e); }
          }
        }
      } catch (err) {
        console.warn('No se pudo cargar previsualización para tarea', t.id, err);
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

      // If photos present, upload first using multipart/form-data (more efficient than base64 JSON)
      if (fileInput.files && fileInput.files.length > 0) {
        // progress UI
        let progressWrap = box.querySelector('.upload-progress-wrap');
        if (!progressWrap) {
          progressWrap = document.createElement('div');
          progressWrap.className = 'upload-progress-wrap';
          progressWrap.style.marginTop = '10px';
          const barOuter = document.createElement('div');
          barOuter.style.width = '100%';
          barOuter.style.background = '#eee';
          barOuter.style.borderRadius = '6px';
          barOuter.style.overflow = 'hidden';
          barOuter.style.height = '10px';
          const barInner = document.createElement('div');
          barInner.className = 'upload-progress-bar';
          barInner.style.width = '0%';
          barInner.style.height = '100%';
          barInner.style.background = 'linear-gradient(90deg, #ff9a00, #ff6a00)';
          barInner.style.transition = 'width 150ms linear';
          barOuter.appendChild(barInner);
          const pct = document.createElement('div');
          pct.className = 'upload-progress-pct';
          pct.style.fontSize = '12px';
          pct.style.marginTop = '6px';
          pct.style.color = 'var(--canva-gray-dark)';
          progressWrap.appendChild(barOuter);
          progressWrap.appendChild(pct);
          box.appendChild(progressWrap);
        }

        // Use XMLHttpRequest to track upload progress
        const form = new FormData();
        for (const f of Array.from(fileInput.files)) {
          form.append('images', f, f.name);
        }

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `/api/tasks/${t.id}/images`, true);
          xhr.withCredentials = true;
          xhr.upload.onprogress = function (e) {
            if (!e.lengthComputable) return;
            const pctVal = Math.round((e.loaded / e.total) * 100);
            const bar = progressWrap.querySelector('.upload-progress-bar');
            const pct = progressWrap.querySelector('.upload-progress-pct');
            if (bar) bar.style.width = pctVal + '%';
            if (pct) pct.textContent = pctVal + '%';
          };
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              let errText = xhr.responseText || `Status ${xhr.status}`;
              try { const j = JSON.parse(errText); errText = j.message || JSON.stringify(j); } catch (e) {}
              reject(new Error(errText));
            }
          };
          xhr.onerror = function () { reject(new Error('Network error during upload')); };
          xhr.send(form);
        }).catch(err => { alert('Error subiendo imágenes: ' + (err && err.message ? err.message : err)); throw err; });
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

function escapeHtml(unsafe){
  return String(unsafe).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]); });
}

function formatDate(input){
  if(!input) return '';
  try{ const d = new Date(input); if(isNaN(d)) return String(input); return d.toLocaleString(); }catch(e){ return String(input); }
}
