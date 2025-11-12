// preview.js - shared preview renderer and simple lightbox
(function(){
  function escapeHtml(unsafe){
    return String(unsafe||'').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]); });
  }
  function formatDate(input){
    if(!input) return '';
    try{ const d = new Date(input); if(isNaN(d)) return String(input); return d.toLocaleString(); }catch(e){ return String(input); }
  }

  async function buildFullPreview(taskId){
    const container = document.createElement('div');
    container.className = 'preview-full-container';
    container.style.padding = '12px';
    container.style.backgroundColor = 'var(--canva-white)';
    container.style.border = '1px solid var(--canva-gray-light)';
    container.style.borderRadius = '4px';

    try{
      const [inspRes, imgsRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}/inspection`, { credentials: 'include' }),
        fetch(`/api/tasks/${taskId}/images`, { credentials: 'include' })
      ]);

        let inspJson = inspRes.ok ? await inspRes.json() : null;
      // If the task-level inspection payload doesn't include inspection images, try fetching the inspection directly
      try {
        if (inspJson && inspJson.inspection && inspJson.inspection.id) {
          const inspId = inspJson.inspection.id;
          const inspDirect = await fetch(`/api/inspections/${inspId}`, { credentials: 'include' });
          if (inspDirect.ok) {
            const inspFull = await inspDirect.json();
            // merge images into the inspection node so the preview builder can use them
            inspJson.inspection.imagenes = inspFull.imagenes || inspJson.inspection.imagenes || [];
          }
        }
      } catch(e) { /* non-fatal */ }
      const imgsJson = imgsRes && imgsRes.ok ? await imgsRes.json() : null;

      // Build left/right columns
  // Use a flex-based two-column layout for better responsiveness
  const contentWrap = document.createElement('div');
  contentWrap.style.display = 'flex';
  contentWrap.style.gap = '18px';
  contentWrap.style.alignItems = 'flex-start';
  contentWrap.style.flexWrap = 'wrap';
  const left = document.createElement('div'); left.style.flex = '1 1 45%'; left.style.boxSizing='border-box';
  const right = document.createElement('div'); right.style.flex = '1 1 45%'; right.style.boxSizing='border-box';

      // Task header/details
      if (inspJson && inspJson.task) {
        const task = inspJson.task;
        const ttitle = document.createElement('h4'); ttitle.textContent = 'Detalles de Inspección'; ttitle.style.marginTop='0';
        left.appendChild(ttitle);
        const tinfo = document.createElement('div');
        tinfo.innerHTML = `<div><strong>Tarea:</strong> ${escapeHtml(task.title || '')}</div>` +
                         (task.description? `<div style="margin-top:6px;color:var(--canva-gray-dark)">${escapeHtml(task.description)}</div>`:'');
        left.appendChild(tinfo);
      }

      // Prefer full inspection object if available
      let insp = inspJson && inspJson.inspection ? inspJson.inspection : null;
      if (insp && insp.id) {
        try {
          const resp = await fetch(`/api/inspections/${insp.id}`, { credentials: 'include' });
          if (resp.ok) {
            const full = await resp.json();
            insp = full;
          }
        } catch(e){ /* ignore */ }
      }

      if (insp) {
        // Render inspection fields (all non-empty primitive fields)
        const details = document.createElement('div'); details.style.marginTop='8px';
        details.innerHTML = `<div><strong>Resumen de inspección</strong></div>`;
        // friendly label mapping for common inspection keys
        const LABELS = {
          nombre_inspeccion: 'Nombre inspección',
          tipo_inspeccion: 'Tipo',
          edificio: 'Edificio',
          piso: 'Piso',
          ubicacion: 'Ubicación',
          lamina_tipo: 'Tipo de lámina',
          lamina_color: 'Color de lámina',
          lamina_medida: 'Medida lámina',
          cumbrera_descripcion_lamina: 'Cumbrera - descripción',
          tornilleria_tipo: 'Tornillería - tipo',
          iluminacion_ubicacion: 'Iluminación - ubicación',
          iluminacion_tipo_luz: 'Tipo de luz',
          iluminacion_watts: 'Watts',
          observaciones: 'Observaciones',
          recomendaciones: 'Recomendaciones'
        };
        const SKIP = new Set(['id_inspeccion','id','imagenes','imagenes_inspeccion','data_base64','created_at','fecha_creacion','creado_por']);
        Object.keys(insp).forEach(k => {
          if (SKIP.has(k)) return;
          const v = insp[k];
          if (v === null || v === undefined || v === '') return;
          if (typeof v === 'object') return;
          const label = LABELS[k] || k.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
          const row = document.createElement('div'); row.style.marginTop='4px'; row.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(v))}`;
          details.appendChild(row);
        });
        if (insp.observaciones) { const obs = document.createElement('div'); obs.style.marginTop='6px'; obs.style.color='var(--canva-gray-dark)'; obs.textContent = insp.observaciones; details.appendChild(obs); }
        if (insp.recomendaciones) { const r = document.createElement('div'); r.style.marginTop='6px'; r.style.color='var(--canva-gray-dark)'; r.innerHTML = `<strong>Recomendaciones:</strong><div>${escapeHtml(insp.recomendaciones)}</div>`; details.appendChild(r); }
        left.appendChild(details);
      } else {
        left.innerHTML = '<h4>Detalles de Inspección</h4><p style="color:var(--canva-gray-dark)">No hay inspección asociada a esta tarea.</p>';
      }

      // Pair before (inspection) and after (task) images side-by-side
      const beforeImgs = (insp && Array.isArray(insp.imagenes)) ? insp.imagenes : [];
      const afterImgs = (imgsJson && Array.isArray(imgsJson.files)) ? imgsJson.files : [];
      if (beforeImgs.length || afterImgs.length) {
        const pairsWrap = document.createElement('div'); pairsWrap.style.marginTop = '12px';
        const pairsHeading = document.createElement('div'); pairsHeading.innerHTML = '<strong>Fotos (Antes → Después)</strong>'; pairsWrap.appendChild(pairsHeading);
        const max = Math.max(beforeImgs.length, afterImgs.length);
        for (let i=0;i<max;i++){
          const row = document.createElement('div'); row.style.display='flex'; row.style.gap='12px'; row.style.alignItems='flex-start'; row.style.marginTop='8px';
          const leftCell = document.createElement('div'); leftCell.style.flex='1 1 50%'; leftCell.style.textAlign='center';
          const rightCell = document.createElement('div'); rightCell.style.flex='1 1 50%'; rightCell.style.textAlign='center';

          if (beforeImgs[i]) {
            const b = beforeImgs[i];
            const bi = document.createElement('img'); bi.className='preview-thumb'; bi.loading='lazy'; bi.style.width='160px'; bi.style.height='120px'; bi.style.objectFit='cover'; bi.style.borderRadius='6px'; bi.style.border='1px solid var(--canva-gray-light)';
            bi.src = b.data_base64 || b.data || b.nombre_archivo || '';
            leftCell.appendChild(bi);
            const cap = document.createElement('div'); cap.style.fontSize='12px'; cap.style.color='var(--canva-gray-dark)'; cap.style.marginTop='6px';
            if (b.fecha_subida) cap.textContent = formatDate(b.fecha_subida);
            else if (b.uploadedAt) cap.textContent = formatDate(b.uploadedAt);
            leftCell.appendChild(cap);
          }

          if (afterImgs[i]) {
            const a = afterImgs[i];
            const ai = document.createElement('img'); ai.className='preview-thumb'; ai.loading='lazy'; ai.style.width='160px'; ai.style.height='120px'; ai.style.objectFit='cover'; ai.style.borderRadius='6px'; ai.style.border='1px solid var(--canva-gray-light)';
            ai.src = a.url || a.data || a.path || '';
            rightCell.appendChild(ai);
            const meta = document.createElement('div'); meta.style.fontSize='12px'; meta.style.color='var(--canva-gray-dark)'; meta.style.marginTop='6px';
            let metaText = a.name || a.nombre_archivo || '';
            if (a.uploadedAt) metaText += ' · ' + formatDate(a.uploadedAt);
            if (a.size) metaText += ' · ' + Math.round((a.size||0)/1024) + ' KB';
            if (a.uploadedBy) metaText += ' · por: ' + a.uploadedBy;
            meta.textContent = metaText;
            rightCell.appendChild(meta);
          }

          row.appendChild(leftCell); row.appendChild(rightCell); pairsWrap.appendChild(row);
        }
        // append columns and pairsWrap into container (after textual details)
        contentWrap.appendChild(left);
        contentWrap.appendChild(right);
        container.appendChild(contentWrap);
        container.appendChild(pairsWrap);
        const cf = document.createElement('div'); cf.style.clear='both'; container.appendChild(cf);
      } else {
        // no images: append columns with messaging
        if (!(beforeImgs.length)) {
          left.appendChild(document.createElement('div'));
        }
        right.innerHTML = '<h4>Fotos de la tarea</h4><p style="color:var(--canva-gray-dark)">No hay fotos subidas aún.</p>';
        contentWrap.appendChild(left);
        contentWrap.appendChild(right);
        container.appendChild(contentWrap);
        const cf = document.createElement('div'); cf.style.clear='both'; container.appendChild(cf);
      }

    } catch (err) {
      container.textContent = 'No se pudieron cargar los detalles de la inspección.';
      console.error('Error cargando detalle de inspección:', err);
    }

    return container;
  }

  function attachLightbox(root){
    if (!document.getElementById('previewLightbox')){
      const overlay = document.createElement('div'); overlay.id = 'previewLightbox'; overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.background='rgba(0,0,0,0.85)'; overlay.style.display='none'; overlay.style.justifyContent='center'; overlay.style.alignItems='center'; overlay.style.zIndex='1200';
      const img = document.createElement('img'); img.style.maxWidth='95%'; img.style.maxHeight='90%'; img.style.borderRadius='6px'; overlay.appendChild(img);
      overlay.addEventListener('click', ()=>{ overlay.style.display='none'; img.src=''; });
      document.body.appendChild(overlay);
      // keyboard close
      document.addEventListener('keydown', (e)=>{ if (e.key==='Escape'){ overlay.style.display='none'; overlay.querySelector('img').src=''; }});
    }
    const overlay = document.getElementById('previewLightbox'); const overlayImg = overlay.querySelector('img');
    const thumbs = (root || document).querySelectorAll('img.preview-thumb');
    thumbs.forEach(t => {
      try {
        t.style.cursor = 'zoom-in';
        if (t.dataset._previewBound) { return; }
        t.dataset._previewBound = '1';
        t.addEventListener('click', (e)=>{
          overlayImg.src = t.src;
          overlay.style.display = 'flex';
        });
      } catch (e) { /* ignore individual thumb errors */ }
    });
  }

  // expose
  window.buildFullPreview = buildFullPreview;
  window.attachLightbox = attachLightbox;
  window._preview_helpers = { escapeHtml, formatDate };
})();
