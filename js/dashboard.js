// dashboard.js - fetch tasks and stats, render charts and tasks table

// Funciones globales para cargar y renderizar datos
async function loadAndRender() {
    const [statsRes, tasksRes, usersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/tasks'),
        fetch('/api/usuarios', { credentials:'include' }).catch(()=>({ ok:false }))
    ]);
    const stats = statsRes.ok ? await statsRes.json() : null;
    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    const usuarios = usersRes && usersRes.ok ? await usersRes.json() : [];

    renderCharts(stats);
    renderTasks(tasks, usuarios);
}

function renderCharts(stats) {
    if (!stats) {return;}
    // New stats shape: { labels: ['Completadas','En progreso','No iniciadas'], counts: [nDone, nProgress, nNotStarted] }
    const { counts = [] } = stats || {};
    const [nDone = 0, nProgress = 0, nNotStarted = 0] = counts;

    // Hide all cards by default
    ['card-done','card-progress','card-notstarted'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {el.style.display = 'none';}
    });

    // helper to show python image if available
    const showImgIfExists = async (imgId, src) => {
        const img = document.getElementById(imgId);
        if (!img) {return;}
        img.style.display = 'none';
        try{
            const res = await fetch(src, { method: 'HEAD' });
            if(res.ok) {img.style.display = 'block';}
        }catch(e){ void 0; }
    }

    const total = nDone + nProgress + nNotStarted || 1;

    if (nDone > 0) {
        const el = document.getElementById('card-done'); if (el) {el.style.display = 'block';}
        showImgIfExists('img-state-done','/charts/state_done.png');
        const metaCount = document.getElementById('meta-done-count'); if(metaCount) {metaCount.textContent = nDone;}
        const metaPct = document.getElementById('meta-done-pct'); if(metaPct) {metaPct.textContent = Math.round((nDone/total)*100) + '%';}
    }
    if (nProgress > 0) {
        const el = document.getElementById('card-progress'); if (el) {el.style.display = 'block';}
        showImgIfExists('img-state-progress','/charts/state_in_progress.png');
        const metaCount = document.getElementById('meta-progress-count'); if(metaCount) {metaCount.textContent = nProgress;}
        const metaPct = document.getElementById('meta-progress-pct'); if(metaPct) {metaPct.textContent = Math.round((nProgress/total)*100) + '%';}
    }
    if (nNotStarted > 0) {
        const el = document.getElementById('card-notstarted'); if (el) {el.style.display = 'block';}
        showImgIfExists('img-state-notstarted','/charts/state_not_started.png');
        const metaCount = document.getElementById('meta-notstarted-count'); if(metaCount) {metaCount.textContent = nNotStarted;}
        const metaPct = document.getElementById('meta-notstarted-pct'); if(metaPct) {metaPct.textContent = Math.round((nNotStarted/total)*100) + '%';}
    }
}

function renderTasks(tasks, usuarios) {
    const container = document.getElementById('tasks-container');
    if (!container) {return;}
    if (!tasks || !tasks.length) {
        container.innerHTML = '<p>No hay tareas.</p>';
        return;
    }

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '16px';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = 'var(--canva-white)';
    headerRow.innerHTML = `
        <th style="text-align:left;padding:8px">ID</th>
        <th style="text-align:left;padding:8px">Título</th>
        <th style="text-align:left;padding:8px">Estado</th>
        <th style="text-align:left;padding:8px">Asignado</th>
        <th style="text-align:left;padding:8px">Instrucción</th>
        <th style="text-align:left;padding:8px">Fecha</th>
        <th style="text-align:left;padding:8px">Acciones</th>
    `;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tasks.forEach(t => {
        const tr = document.createElement('tr');
        // status selector
        const statusTd = document.createElement('td'); statusTd.style.padding = '8px';
        const sel = document.createElement('select');
        // apply initial badge class for visual state
        sel.className = badgeClass(t.status);
        [['done','Finalizado'],['in_progress','En proceso'],['not_started','No iniciado']].forEach(([val,label])=>{
            const op = document.createElement('option'); op.value = val; op.textContent = label; if(val===t.status) {op.selected = true;} sel.appendChild(op);
        });
        // update badge class when selection changes
        sel.addEventListener('change', ()=>{
            sel.className = badgeClass(sel.value);
        });
        statusTd.appendChild(sel);

        const assignTd = document.createElement('td'); assignTd.style.padding='8px';
        const selUser = document.createElement('select'); selUser.style.minWidth='220px';
        const optNone = document.createElement('option'); optNone.value=''; optNone.textContent='Sin asignar'; selUser.appendChild(optNone);
        (usuarios||[]).forEach(u=>{
            const op = document.createElement('option');
            op.value = u.user_id; op.textContent = u.nombre ? `${u.nombre} (${u.email})` : u.email; op.dataset.userName = u.nombre || u.email;
            if(t.assignedUserId && t.assignedUserId === u.user_id) {op.selected = true;}
            selUser.appendChild(op);
        });
        // fallback to name match if no userId stored
        if(!selUser.value && t.assignedTo){
            const match = (usuarios||[]).find(u => (u.nombre||u.email) === t.assignedTo);
            if(match) {selUser.value = match.user_id;}
        }
        assignTd.appendChild(selUser);

        // Columna de instrucción
        const instructionTd = document.createElement('td'); 
        instructionTd.style.padding = '8px';
        
    const instructionBtn = document.createElement('button');
    instructionBtn.className = 'small';
    // use the design token colors defined in CSS
    instructionBtn.style.backgroundColor = 'var(--canva-blue)';
    instructionBtn.style.color = 'white';
    instructionBtn.style.border = 'none';
    instructionBtn.style.padding = '4px 8px';
    instructionBtn.style.borderRadius = '4px';
    instructionBtn.style.cursor = 'pointer';
    instructionBtn.textContent = t.instruction ? 'Ver instrucción' : 'Crear instrucción';
        
        instructionBtn.addEventListener('click', () => {
            if (t.instruction) {
                showInstructionModal(t.instruction, t.id);
            } else {
                showTaskInstructionModal(t.id);
            }
        });
        
        instructionTd.appendChild(instructionBtn);

        const actionsTd = document.createElement('td'); actionsTd.style.padding='8px';
        const saveBtn = document.createElement('button'); saveBtn.textContent = 'Guardar'; saveBtn.className='small';
        saveBtn.addEventListener('click', async ()=>{
            saveBtn.disabled = true;
            try{
                const payload = { status: sel.value, updatedBy: 'usuario' };
                const selectedId = selUser.value;
                if(selectedId){
                    payload.assignedUserId = selectedId;
                    const selectedOpt = selUser.options[selUser.selectedIndex];
                    payload.assignedTo = selectedOpt ? (selectedOpt.dataset.userName || selectedOpt.textContent) : '';
                } else {
                    payload.assignedTo = '';
                    payload.assignedUserId = null;
                }
                const res = await fetch(`/api/tasks/${t.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
                if(!res.ok) {throw new Error('Error');}
                await loadAndRender();
            }catch(e){ console.error(e); alert('Error al guardar cambios'); }
            saveBtn.disabled = false;
        });
        actionsTd.appendChild(saveBtn);

        const trHtml = document.createElement('td'); trHtml.style.padding='8px'; trHtml.textContent = t.id;
        const titleTd = document.createElement('td'); titleTd.style.padding='8px'; titleTd.textContent = t.title;
        const dateTd = document.createElement('td'); dateTd.style.padding='8px'; dateTd.textContent = t.date;

        tr.appendChild(trHtml);
        tr.appendChild(titleTd);
        tr.appendChild(statusTd);
        tr.appendChild(assignTd);
        tr.appendChild(instructionTd);
        tr.appendChild(dateTd);
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);

        // details row (hidden) with inspection summary
        const detailsTr = document.createElement('tr');
        const detailsTd = document.createElement('td');
        detailsTd.colSpan = 7;
        detailsTd.style.padding = '8px';
        detailsTd.style.display = 'none';
        detailsTd.className = 'task-details-cell';
        detailsTr.appendChild(detailsTd);
        tbody.appendChild(detailsTr);

        // toggle on title click
        titleTd.style.cursor = 'pointer';
        titleTd.addEventListener('click', ()=>{
            (async () => {
                if(detailsTd.style.display === 'none'){
                    detailsTd.innerHTML = '';
                    const preview = await renderInspectionSummary(t.id);
                    detailsTd.appendChild(preview);
                    detailsTd.style.display = 'table-cell';
                    // attach lightbox on inserted preview thumbnails
                    try { if (window && typeof window.attachLightbox === 'function') { window.attachLightbox(detailsTd); } } catch(e){ console.warn('attachLightbox failed', e); }
                } else {
                    detailsTd.style.display = 'none';
                }
            })();
        });
    });
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

function badgeClass(status) {
    if (!status) {return '';}
    if (status === 'done') {return 'badge-done';}
    if (status === 'in_progress') {return 'badge-progress';}
    if (status === 'not_started') {return 'badge-notstarted';}
    return '';
}

// statusLabel removed (unused) to reduce lint warnings

async function renderInspectionSummary(taskId) {
    // prefer the shared preview builder if available
    if (window && typeof window.buildFullPreview === 'function') {
        return await window.buildFullPreview(taskId);
    }
    // fallback minimal element
    const fallback = document.createElement('div'); fallback.textContent = 'Previsualización no disponible.'; return fallback;
}

function escapeHtml(unsafe){
    return String(unsafe).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]); });
}

function formatDate(input){
    if(!input) return '';
    try{
        const d = new Date(input);
        if (isNaN(d)) return String(input);
        return d.toLocaleString();
    }catch(e){ return String(input); }
}

function initDashboard(){
    // Only attach SPA handlers to in-page navigation links (those with data-view)
    const links = document.querySelectorAll('.dashboard-link[data-view]');
    links.forEach(l => l.addEventListener('click', onNavClick));

    // mobile menu toggle (support both ids used in templates)
    const mobileToggle = document.getElementById('mobile-menu-toggle') || document.getElementById('nav-toggle');
    let menuJustOpened = false; // Variable compartida para evitar cierre inmediato
    let isHandlingToggle = false; // Flag para prevenir doble ejecución
    
    if(mobileToggle){
        const handleMenuToggle = function(e){
            // Prevenir doble ejecución
            if (isHandlingToggle) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
            
            isHandlingToggle = true;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('🔍 Menu button clicked');
            
            const nav = document.querySelector('.dashboard-nav');
            if(!nav) {
                console.error('Nav element not found');
                isHandlingToggle = false;
                return;
            }
            
            const isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
            const isOpen = nav.classList.contains('open');
            
            console.log('🔍 Menu state:', { isMobile, isOpen });
            
            if (isMobile) {
                if (!isOpen) {
                    // Abrir menú
                    nav.classList.add('open');
                    nav.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; transform: translateX(0) !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 280px !important; max-width: 85% !important; height: 100vh !important; z-index: 9999 !important; background: #ffffff !important; padding: 22px !important; box-shadow: 2px 0 10px rgba(0,0,0,0.15) !important; overflow-y: auto !important; margin: 0 !important; border-radius: 0 !important;';
                    mobileToggle.setAttribute('aria-expanded', 'true');
                    console.log('🔍 Menu opened');
                    
                    // Marcar que el menú acaba de abrirse para evitar que se cierre inmediatamente
                    menuJustOpened = true;
                    setTimeout(() => { 
                        menuJustOpened = false;
                        isHandlingToggle = false;
                    }, 500);
                } else {
                    // Cerrar menú
                    nav.classList.remove('open');
                    nav.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; transform: translateX(-100%) !important;';
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    console.log('🔍 Menu closed');
                    setTimeout(() => { isHandlingToggle = false; }, 100);
                }
            } else {
                // Desktop behavior
                nav.classList.toggle('open');
                nav.style.cssText = '';
                mobileToggle.setAttribute('aria-expanded', !isOpen);
                setTimeout(() => { isHandlingToggle = false; }, 100);
            }
        };
        
        // Solo usar click, no touchstart (para evitar doble ejecución en móviles)
        mobileToggle.addEventListener('click', handleMenuToggle, { passive: false });
        console.log('🔍 Menu toggle listeners attached');
    } else {
        console.error('🔍 Mobile toggle button NOT found');
    }

    // Ensure nav is closed by default on mobile (defensive: in case CSS or server rendered it open)
    (function ensureNavClosed(){
        const nav = document.querySelector('.dashboard-nav');
        if(!nav) return;
        
        nav.classList.remove('open');
        if(mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
        
        try {
            const isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
            
            if (isMobile) {
                nav.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; transform: translateX(-100%) !important;';
                const hdr = document.getElementById('dashboardLogoutBtn'); if (hdr) hdr.style.display = 'none';
            } else {
                nav.style.cssText = '';
                const hdr = document.getElementById('dashboardLogoutBtn'); if (hdr) hdr.style.display = '';
            }
        } catch (e) { /* ignore */ }

        // Close menu when clicking a link in mobile
        const navLinks = nav.querySelectorAll('.dashboard-link');
        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                const isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
                if (isMobile) {
                    nav.classList.remove('open');
                    nav.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; transform: translateX(-100%) !important;';
                    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // Close menu when clicking outside on small screens
        // Usar setTimeout para que se ejecute DESPUÉS del handler del botón
        document.addEventListener('click', (ev) => {
            setTimeout(() => {
                try {
                    const isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
                    if (!isMobile) return;
                    if (!nav.classList.contains('open')) return;
                    
                    // Si el menú acaba de abrirse, ignorar este click
                    if (menuJustOpened) {
                        return;
                    }
                    
                    // Verificar si el click fue en el botón hamburguesa - si es así, no cerrar
                    const clickedOnToggle = mobileToggle && (mobileToggle.contains(ev.target) || mobileToggle === ev.target);
                    if (clickedOnToggle) {
                        return;
                    }
                    
                    const inside = nav.contains(ev.target);
                    if (!inside) {
                        nav.classList.remove('open');
                        nav.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; transform: translateX(-100%) !important;';
                        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
                    }
                } catch (e) { /* ignore */ }
            }, 0);
        }, { capture: false });
    })();

    // Logout from menu (works both desktop and mobile)
    const menuLogout = document.getElementById('menu-logout');
    if (menuLogout) {
        menuLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const tokenRes = await fetch('/auth/csrf', { credentials: 'include', cache: 'no-store' });
                const token = tokenRes.ok ? (await tokenRes.json()).csrfToken : null;
                await fetch('/auth/logout', { method: 'POST', credentials: 'include', headers: { 'csrf-token': token }, cache: 'no-store' });
            } catch (err) {
                // ignore errors
            }
            window.location.href = '/Vistas/login.html';
        });
    }

    // default view
    showView('home');
    loadAndRender();

    function onNavClick(e) {
        e.preventDefault();
        const view = this.getAttribute('data-view');
        if(!view){ return; }
        showView(view);
        // update active class
        document.querySelectorAll('.dashboard-link').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
    }

    function showView(view){
        // hide all views
        document.querySelectorAll('.dashboard-view').forEach(el => el.style.display = 'none');
        // show selected view
        const el = document.getElementById(`view-${view}`);
        if (el) {el.style.display = 'block';}
        if(view === 'admin') {setupAdminForm();}
    }

    function setupAdminForm(){
        const form = document.getElementById('form-crear-usuario');
        if(!form) {return;}
        
        // Remover event listeners existentes para evitar duplicados
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e)=>{
            e.preventDefault();
            const email = document.getElementById('nuevo-email').value.trim();
            const nombre = document.getElementById('nuevo-nombre').value.trim();
            const telefono = document.getElementById('nuevo-telefono').value.trim();
            const rol = document.getElementById('nuevo-rol').value;
            
            console.log('🔍 Creando usuario:', { email, nombre, telefono, rol });
            
            try{
                const res = await fetch('/api/usuarios', { 
                    method:'POST', 
                    headers:{'Content-Type':'application/json'}, 
                    credentials:'include', 
                    body: JSON.stringify({ email, nombre, telefono, rol }) 
                });
                
                if(!res.ok){ 
                    const errorData = await res.json().catch(()=>({})); 
                    console.error('❌ Error del servidor:', errorData);
                    throw new Error(errorData.error || 'Error al crear usuario'); 
                }
                
                const result = await res.json();
                console.log('✅ Usuario creado:', result);
                
                await loadUsersAdmin();
                newForm.reset();
                alert('Usuario creado exitosamente');
            }catch(err){ 
                console.error('❌ Error:', err);
                alert(err.message || 'Error al crear usuario'); 
            }
        });
    }

    async function loadUsersAdmin(){
        const adminList = document.getElementById('lista-usuarios-admin');
        if(!adminList) {return;}
        const res = await fetch('/api/usuarios', { credentials:'include' });
        const list = res.ok ? await res.json() : [];
        adminList.innerHTML = '';
        
        // Crear tabla para mostrar usuarios
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '16px';
        
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = 'var(--canva-white)';
        headerRow.innerHTML = `
            <th style="text-align:left;padding:8px">Nombre</th>
            <th style="text-align:left;padding:8px">Email</th>
            <th style="text-align:left;padding:8px">Teléfono</th>
            <th style="text-align:left;padding:8px">Rol</th>
            <th style="text-align:left;padding:8px">Acciones</th>
        `;
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        list.forEach(u=>{
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--canva-gray-light)';
            
            const nombreTd = document.createElement('td');
            nombreTd.style.padding = '8px';
            nombreTd.textContent = u.nombre || 'Sin nombre';
            row.appendChild(nombreTd);
            
            const emailTd = document.createElement('td');
            emailTd.style.padding = '8px';
            emailTd.textContent = u.email;
            row.appendChild(emailTd);
            
            const telefonoTd = document.createElement('td');
            telefonoTd.style.padding = '8px';
            telefonoTd.textContent = u.numero_telefono || 'Sin teléfono';
            row.appendChild(telefonoTd);
            
            const rolTd = document.createElement('td');
            rolTd.style.padding = '8px';
            rolTd.textContent = u.rol || 'Usuario';
            row.appendChild(rolTd);
            
            const accionesTd = document.createElement('td');
            accionesTd.style.padding = '8px';
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Eliminar';
            delBtn.className = 'small ghost';
            delBtn.addEventListener('click', async ()=>{
                if(!confirm('¿Eliminar usuario?')) {return;}
                
                console.log('🔍 Eliminando usuario:', u.user_id, u.nombre);
                
                try {
                    const r = await fetch(`/api/usuarios/${u.user_id}`, { 
                        method:'DELETE', 
                        credentials:'include' 
                    });
                    
                    console.log('📡 Status de eliminación:', r.status);
                    
                    if(r.ok){ 
                        const result = await r.json();
                        console.log('✅ Usuario eliminado:', result);
                        await loadUsersAdmin(); 
                    } else { 
                        const error = await r.json().catch(() => ({}));
                        console.error('❌ Error al eliminar:', error);
                        alert('No se pudo eliminar: ' + (error.error || 'Error desconocido')); 
                    }
                } catch (error) {
                    console.error('❌ Error en fetch:', error);
                    alert('Error de conexión');
                }
            });
            accionesTd.appendChild(delBtn);
            row.appendChild(accionesTd);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        adminList.appendChild(table);
    }
}

// =====================================================
// FUNCIONES PARA MANEJAR INSTRUCCIONES
// =====================================================

// Mostrar modal con detalles de la instrucción y la inspección de la tarea
async function showInstructionModal(instruction, taskId) {
    try {
        // Obtener información de la tarea y su inspección
        const response = await fetch(`/api/tasks/${taskId}/inspection`);
        if (!response.ok) {throw new Error('Error al cargar información de la tarea');}
        
        const data = await response.json();
        const { task, inspection } = data;
        
    const modal = document.createElement('div');
        modal.classList.add('app-modal');
    let onKeyDown = null;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
            const modalContent = document.createElement('div');
        modalContent.classList.add('app-modal-content');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
    modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--canva-blue); padding-bottom: 15px; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #333; font-size: 24px; font-weight: 600;">Ver Instrucción</h2>
                <button id="closeModal" style="background: var(--canva-orange); color: var(--canva-white); border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px;">✕</button>
            </div>

            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: var(--canva-blue); font-size: 18px; font-weight: 600; border-left: 4px solid var(--canva-blue); padding-left: 10px;">INSPECCIÓN DE LA TAREA</h3>
                <div style="border: 1px solid var(--canva-gray-light); padding: 20px; border-radius: 8px; background-color: var(--canva-white); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #000; font-size: 16px;">Tarea: ${task.title}</h4>
                    ${task.description ? `<p style="margin: 0 0 15px 0; color: #000; line-height: 1.5;"><strong>Descripción:</strong> ${task.description}</p>` : ''}
                    ${inspection ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--canva-gray-light);">
                            <p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Inspección:</strong> ${inspection.name}</p>
                            <p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Tipo:</strong> ${inspection.type}</p>
                            ${inspection.building ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Edificio:</strong> ${inspection.building}</p>` : ''}
                            ${inspection.floor ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Piso:</strong> ${inspection.floor}</p>` : ''}
                            ${inspection.location ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Ubicación:</strong> ${inspection.location}</p>` : ''}
                            ${inspection.observations ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Observaciones:</strong> ${inspection.observations}</p>` : ''}
                            ${inspection.recommendations ? `<p style="margin: 0; color: #000; line-height: 1.5;"><strong>Recomendaciones:</strong> ${inspection.recommendations}</p>` : ''}
                        </div>
                    ` : '<p style="margin: 0; color: #000; font-style: italic;">No hay inspección asociada a esta tarea</p>'}
                </div>
            </div>

            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: var(--canva-orange); font-size: 18px; font-weight: 600; border-left: 4px solid var(--canva-orange); padding-left: 10px;">INSTRUCCIÓN ASIGNADA</h3>
                <div style="border: 1px solid var(--canva-gray-light); padding: 20px; border-radius: 8px; background-color: var(--canva-white); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #000; font-size: 18px;">${instruction.title}</h4>
                    <p style="margin: 0 0 10px 0; color: #000; line-height: 1.5;"><strong>Categoría:</strong> ${instruction.category}</p>
                    <p style="margin: 0; color: #000; line-height: 1.5;"><strong>Descripción:</strong> ${instruction.description}</p>
                </div>
            </div>
        `;
        
        modal.appendChild(modalContent);
        // Lightbox overlay (one per modal)
        const lightbox = document.createElement('div');
        lightbox.id = 'lightboxOverlay';
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1100;
        `;

        const lightboxImg = document.createElement('img');
        lightboxImg.style.cssText = `
            max-width: 95%;
            max-height: 90%;
            border-radius: 6px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        `;
        lightbox.appendChild(lightboxImg);
        document.body.appendChild(lightbox);
        document.body.appendChild(modal);
        
        // Cerrar modal
        document.getElementById('closeModal').addEventListener('click', () => {
            document.body.removeChild(modal);
            if (lightbox && lightbox.parentNode) {document.body.removeChild(lightbox);}
            try{ document.removeEventListener('keydown', onKeyDown); }catch(e){ void 0; }
        });
        
            modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                if (lightbox && lightbox.parentNode) {document.body.removeChild(lightbox);}
                try{ document.removeEventListener('keydown', onKeyDown); }catch(e){ void 0; }
            }
        });
        
        // Fetch and render image galleries: inspection (before) and task uploads (after)
        try {
            
            // keep a gallery array so lightbox can navigate between images
            const galleryUrls = [];
            let currentIndex = -1;

            const openLightboxAt = (i) => {
                if(i < 0 || i >= galleryUrls.length) {return;}
                currentIndex = i;
                lightboxImg.src = galleryUrls[i];
                lightbox.style.display = 'flex';
            };

            const closeLightbox = () => {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
            };

            const showNext = () => {
                if(galleryUrls.length === 0) {return;}
                openLightboxAt((currentIndex + 1) % galleryUrls.length);
            };

            const showPrev = () => {
                if(galleryUrls.length === 0) {return;}
                openLightboxAt((currentIndex - 1 + galleryUrls.length) % galleryUrls.length);
            };

            // keyboard navigation when lightbox open
            onKeyDown = function(e){
                if(lightbox.style.display !== 'flex') {return;}
                if(e.key === 'Escape') {closeLightbox();}
                if(e.key === 'ArrowRight') {showNext();}
                if(e.key === 'ArrowLeft') {showPrev();}
            };
            document.addEventListener('keydown', onKeyDown);

            // touch swipe support
            let touchStartX = null;
            lightbox.addEventListener('touchstart', (ev)=>{ touchStartX = ev.touches && ev.touches[0] ? ev.touches[0].clientX : null; });
            lightbox.addEventListener('touchend', (ev)=>{
                if(touchStartX === null) {return;}
                const endX = ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0].clientX : null;
                if(endX === null) {return;}
                const diff = touchStartX - endX;
                if(Math.abs(diff) > 50){ if(diff > 0) {showNext();} else {showPrev();} }
                touchStartX = null;
            });
            // inspection images (from /api/inspections/:id)
            if (inspection && inspection.id) {
                const inspResp = await fetch(`/api/inspections/${inspection.id}`);
                if (inspResp.ok) {
                    const inspData = await inspResp.json();
                    if (inspData.imagenes && inspData.imagenes.length) {
                        const galleryWrap = document.createElement('div');
                        galleryWrap.style.marginBottom = '18px';
                        galleryWrap.innerHTML = `<h4 style="margin:0 0 8px 0;color:#000;font-size:16px">Fotos de Inspección (Antes)</h4>`;
                        const row = document.createElement('div');
                        row.style.display = 'flex';
                        row.style.flexWrap = 'wrap';
                        row.style.gap = '10px';

                        inspData.imagenes.forEach(img => {
                            const thumb = document.createElement('img');
                            // img.data_base64 may be data URL or pure base64
                            let src = img.data_base64 || img.data || null;
                            if (!src) {return;}
                            if (!src.startsWith('data:')) {
                                // assume image/png if unknown
                                src = `data:image/png;base64,${src}`;
                            }
                            thumb.src = src;
                            thumb.style.width = '96px';
                            thumb.style.height = '64px';
                            thumb.loading = 'lazy';
                            thumb.style.objectFit = 'cover';
                            thumb.style.borderRadius = '6px';
                            thumb.style.cursor = 'pointer';
                            thumb.title = img.nombre_archivo || '';
                            // add to gallery and open when clicked
                            const idx = galleryUrls.push(src) - 1;
                            thumb.dataset.idx = idx;
                            thumb.addEventListener('click', () => openLightboxAt(parseInt(thumb.dataset.idx, 10)));
                            row.appendChild(thumb);
                        });
                        galleryWrap.appendChild(row);
                        modalContent.appendChild(galleryWrap);
                    }
                }
            }

            // task uploaded images (after) - from /api/tasks/:id/images
            const afterResp = await fetch(`/api/tasks/${taskId}/images`);
            if (afterResp.ok) {
                const afterData = await afterResp.json();
                if (afterData.files && afterData.files.length) {
                    const galleryWrap2 = document.createElement('div');
                    galleryWrap2.style.marginBottom = '18px';
                    galleryWrap2.innerHTML = `<h4 style="margin:0 0 8px 0;color:#000;font-size:16px">Fotos de Tarea (Después)</h4>`;
                    const row2 = document.createElement('div');
                    row2.style.display = 'flex';
                    row2.style.flexWrap = 'wrap';
                    row2.style.gap = '10px';

                        afterData.files.forEach(f => {
                        const thumb = document.createElement('img');
                        thumb.src = f.url;
                            thumb.loading = 'lazy';
                        thumb.style.width = '96px';
                        thumb.style.height = '64px';
                        thumb.style.objectFit = 'cover';
                        thumb.style.borderRadius = '6px';
                        thumb.style.cursor = 'pointer';
                        thumb.title = f.name || '';
                        const idx2 = galleryUrls.push(f.url) - 1;
                        thumb.dataset.idx = idx2;
                        thumb.addEventListener('click', () => openLightboxAt(parseInt(thumb.dataset.idx, 10)));
                        row2.appendChild(thumb);
                    });
                    galleryWrap2.appendChild(row2);
                    modalContent.appendChild(galleryWrap2);
                }
            }

            // Close lightbox when clicked
            lightbox.addEventListener('click', () => {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
            });

        } catch (imgErr) {
            console.warn('No se pudieron cargar las imágenes de inspección/tarea:', imgErr);
        }
        
    } catch (error) {
        console.error('Error cargando información de tarea:', error);
        alert('Error al cargar la información de la tarea');
    }
}

// Mostrar modal para crear instrucción específica para una tarea
async function showTaskInstructionModal(taskId) {
    try {
        // Obtener información de la tarea y su inspección
        const response = await fetch(`/api/tasks/${taskId}/inspection`);
        if (!response.ok) {throw new Error('Error al cargar información de la tarea');}

        const data = await response.json();
        const { task, inspection } = data;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--canva-blue); padding-bottom: 15px; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #333; font-size: 24px; font-weight: 600;">Asignar Instrucción</h2>
                <button id="closeTaskModal" style="background: var(--canva-orange); color: var(--canva-white); border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px;">✕</button>
            </div>

            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: var(--canva-blue); font-size: 18px; font-weight: 600; border-left: 4px solid var(--canva-blue); padding-left: 10px;">INSPECCIÓN DE LA TAREA</h3>
                <div style="border: 1px solid var(--canva-gray-light); padding: 20px; border-radius: 8px; background-color: var(--canva-white); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #000; font-size: 16px;">Tarea: ${task.title}</h4>
                    ${task.description ? `<p style="margin: 0 0 15px 0; color: #000; line-height: 1.5;"><strong>Descripción:</strong> ${task.description}</p>` : ''}
                    ${inspection ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--canva-gray-light);">
                            <p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Inspección:</strong> ${inspection.name}</p>
                            <p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Tipo:</strong> ${inspection.type}</p>
                            ${inspection.building ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Edificio:</strong> ${inspection.building}</p>` : ''}
                            ${inspection.floor ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Piso:</strong> ${inspection.floor}</p>` : ''}
                            ${inspection.location ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Ubicación:</strong> ${inspection.location}</p>` : ''}
                            ${inspection.observations ? `<p style="margin: 0 0 8px 0; color: #000; line-height: 1.5;"><strong>Observaciones:</strong> ${inspection.observations}</p>` : ''}
                            ${inspection.recommendations ? `<p style="margin: 0; color: #000; line-height: 1.5;"><strong>Recomendaciones:</strong> ${inspection.recommendations}</p>` : ''}
                        </div>
                    ` : '<p style="margin: 0; color: #000; font-style: italic;">No hay inspección asociada a esta tarea</p>'}
                </div>
            </div>

            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: var(--canva-blue); font-size: 18px; font-weight: 600; border-left: 4px solid var(--canva-blue); padding-left: 10px;">CREAR INSTRUCCIÓN PARA ESTA TAREA</h3>
                <div style="border: 1px solid var(--canva-gray-light); padding: 20px; border-radius: 8px; background-color: var(--canva-white); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #000;">Título:</label>
                        <input type="text" id="instructionTitle" placeholder="Ej: Reparar sistema eléctrico" style="width: 100%; padding: 12px; border: 2px solid var(--canva-gray-light); border-radius: 6px; font-size: 14px; transition: border-color 0.3s; color: #000;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #000;">Categoría:</label>
                        <select id="instructionCategory" style="width: 100%; padding: 12px; border: 2px solid var(--canva-gray-light); border-radius: 6px; font-size: 14px; transition: border-color 0.3s; color: #000;">
                            <option value="">Seleccionar categoría</option>
                            <option value="Electricidad">Electricidad</option>
                            <option value="Plomería">Plomería</option>
                            <option value="Pintura">Pintura</option>
                            <option value="Carpintería">Carpintería</option>
                            <option value="Aire Acondicionado">Aire Acondicionado</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #000;">Descripción:</label>
                        <textarea id="instructionDescription" placeholder="Describe los pasos específicos para esta tarea..." style="width: 100%; padding: 12px; border: 2px solid var(--canva-gray-light); border-radius: 6px; height: 120px; resize: vertical; font-size: 14px; transition: border-color 0.3s; color: #000;"></textarea>
                    </div>
                    <button id="createInstructionBtn" style="background: var(--canva-blue); color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">Crear Instrucción</button>
                </div>
            </div>

            <div id="instructionPreview" style="display: none;">
                <h3 style="margin: 0 0 15px 0; color: var(--canva-blue); font-size: 18px; font-weight: 600; border-left: 4px solid var(--canva-blue); padding-left: 10px;">PREVIEW DE LA INSTRUCCIÓN CREADA</h3>
                <div id="previewContent" style="border: 1px solid var(--canva-gray-light); padding: 20px; border-radius: 8px; background-color: var(--canva-white); box-shadow: 0 2px 4px rgba(0,0,0,0.1); color: #000;">
                    <!-- Contenido de preview se llenará dinámicamente -->
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button id="assignInstructionBtn" style="background: var(--canva-blue); color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">Asignar a Tarea</button>
                    <button id="cancelBtn" style="background: var(--canva-gray-dark); color: var(--canva-white); border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">Cancelar</button>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        // Lightbox overlay (one per modal)
        const lightbox = document.createElement('div');
        lightbox.id = 'lightboxOverlay';
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1100;
        `;

        const lightboxImg = document.createElement('img');
        lightboxImg.style.cssText = `
            max-width: 95%;
            max-height: 90%;
            border-radius: 6px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        `;
        lightbox.appendChild(lightboxImg);
    document.body.appendChild(lightbox);
    let onKeyDown = null;

    let createdInstruction = null;

        // Event listeners
        document.getElementById('closeTaskModal').addEventListener('click', () => {
            document.body.removeChild(modal);
            if (lightbox && lightbox.parentNode) {document.body.removeChild(lightbox);}
            try{ document.removeEventListener('keydown', onKeyDown); }catch(e){ void 0; }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            if (lightbox && lightbox.parentNode) {document.body.removeChild(lightbox);}
            try{ document.removeEventListener('keydown', onKeyDown); }catch(e){ void 0; }
        });

        document.getElementById('createInstructionBtn').addEventListener('click', async () => {
            const title = document.getElementById('instructionTitle').value.trim();
            const category = document.getElementById('instructionCategory').value;
            const description = document.getElementById('instructionDescription').value.trim();

            if (!title || !category || !description) {
                alert('Por favor completa todos los campos');
                return;
            }

            try {
                const response = await fetch('/api/instructions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title, category, description })
                });

                if (!response.ok) {throw new Error('Error al crear instrucción');}

                createdInstruction = await response.json();

                // Mostrar preview
                document.getElementById('previewContent').innerHTML = `
                    <h4 style="margin: 0 0 10px 0;">${createdInstruction.title}</h4>
                    <p style="margin: 0 0 10px 0;"><strong>Categoría:</strong> ${createdInstruction.category}</p>
                    <p style="margin: 0;"><strong>Descripción:</strong> ${createdInstruction.description}</p>
                `;

                document.getElementById('instructionPreview').style.display = 'block';

            } catch (error) {
                console.error('Error creando instrucción:', error);
                alert('Error al crear la instrucción');
            }
        });

        document.getElementById('assignInstructionBtn').addEventListener('click', async () => {
            if (!createdInstruction) {
                alert('Primero debes crear una instrucción');
                return;
            }

            try {
                const response = await fetch(`/api/tasks/${taskId}/instruction`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ instructionId: createdInstruction.id })
                });

                if (!response.ok) {throw new Error('Error al asignar instrucción');}

                // Cerrar modal
                document.body.removeChild(modal);

                // Recargar datos
                await loadAndRender();

                alert(`Instrucción "${createdInstruction.title}" asignada correctamente a la tarea`);

            } catch (error) {
                console.error('Error asignando instrucción:', error);
                alert('Error al asignar la instrucción');
            }
        });

        modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                document.body.removeChild(modal);
                if (lightbox && lightbox.parentNode) {document.body.removeChild(lightbox);}
                try{ document.removeEventListener('keydown', onKeyDown); }catch(e){ void 0; }
            }
        });

        // Fetch and render image galleries: inspection (before) and task uploads (after)
        try {
            // inspection images (from /api/inspections/:id)
            if (inspection && inspection.id) {
                const inspResp = await fetch(`/api/inspections/${inspection.id}`);
                if (inspResp.ok) {
                    const inspData = await inspResp.json();
                    if (inspData.imagenes && inspData.imagenes.length) {
                        const galleryWrap = document.createElement('div');
                        galleryWrap.style.marginBottom = '18px';
                        galleryWrap.innerHTML = `<h4 style="margin:0 0 8px 0;color:#000;font-size:16px">Fotos de Inspección (Antes)</h4>`;
                        const row = document.createElement('div');
                        row.style.display = 'flex';
                        row.style.flexWrap = 'wrap';
                        row.style.gap = '10px';

                        inspData.imagenes.forEach(img => {
                            const thumb = document.createElement('img');
                            let src = img.data_base64 || img.data || null;
                            if (!src) {return;}
                            if (!src.startsWith('data:')) {
                                src = `data:image/png;base64,${src}`;
                            }
                            thumb.src = src;
                            thumb.style.width = '96px';
                            thumb.style.height = '64px';
                            thumb.style.objectFit = 'cover';
                            thumb.style.borderRadius = '6px';
                            thumb.style.cursor = 'pointer';
                            thumb.title = img.nombre_archivo || '';
                            thumb.addEventListener('click', () => {
                                lightboxImg.src = src;
                                lightbox.style.display = 'flex';
                            });
                            row.appendChild(thumb);
                        });
                        galleryWrap.appendChild(row);
                        modalContent.appendChild(galleryWrap);
                    }
                }
            }

            // task uploaded images (after) - from /api/tasks/:id/images
            const afterResp = await fetch(`/api/tasks/${taskId}/images`);
            if (afterResp.ok) {
                const afterData = await afterResp.json();
                if (afterData.files && afterData.files.length) {
                    const galleryWrap2 = document.createElement('div');
                    galleryWrap2.style.marginBottom = '18px';
                    galleryWrap2.innerHTML = `<h4 style="margin:0 0 8px 0;color:#000;font-size:16px">Fotos de Tarea (Después)</h4>`;
                    const row2 = document.createElement('div');
                    row2.style.display = 'flex';
                    row2.style.flexWrap = 'wrap';
                    row2.style.gap = '10px';

                    afterData.files.forEach(f => {
                        const thumb = document.createElement('img');
                        thumb.src = f.url;
                        thumb.style.width = '96px';
                        thumb.style.height = '64px';
                        thumb.style.objectFit = 'cover';
                        thumb.style.borderRadius = '6px';
                        thumb.style.cursor = 'pointer';
                        thumb.title = f.name || '';
                        thumb.addEventListener('click', () => {
                            lightboxImg.src = f.url;
                            lightbox.style.display = 'flex';
                        });
                        row2.appendChild(thumb);
                    });
                    galleryWrap2.appendChild(row2);
                    modalContent.appendChild(galleryWrap2);
                }
            }

            // Close lightbox when clicked
            lightbox.addEventListener('click', () => {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
            });

        } catch (imgErr) {
            console.warn('No se pudieron cargar las imágenes de inspección/tarea:', imgErr);
        }

    } catch (error) {
        console.error('Error cargando información de tarea:', error);
        alert('Error al cargar la información de la tarea');
    }
}

// Ensure initialization whether this script loads before or after DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}