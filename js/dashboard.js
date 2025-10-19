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
    if (!stats) return;
    // New stats shape: { labels: ['Completadas','En progreso','No iniciadas'], counts: [nDone, nProgress, nNotStarted] }
    const { labels = [], counts = [] } = stats || {};
    const [nDone = 0, nProgress = 0, nNotStarted = 0] = counts;

    // Hide all cards by default
    ['card-done','card-progress','card-notstarted'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // helper to show python image if available
    const showImgIfExists = async (imgId, src) => {
        const img = document.getElementById(imgId);
        if (!img) return;
        img.style.display = 'none';
        try{
            const res = await fetch(src, { method: 'HEAD' });
            if(res.ok) img.style.display = 'block';
        }catch(e){}
    }

    const total = nDone + nProgress + nNotStarted || 1;

    if (nDone > 0) {
        const el = document.getElementById('card-done'); if (el) el.style.display = 'block';
        showImgIfExists('img-state-done','/charts/state_done.png');
        const metaCount = document.getElementById('meta-done-count'); if(metaCount) metaCount.textContent = nDone;
        const metaPct = document.getElementById('meta-done-pct'); if(metaPct) metaPct.textContent = Math.round((nDone/total)*100) + '%';
    }
    if (nProgress > 0) {
        const el = document.getElementById('card-progress'); if (el) el.style.display = 'block';
        showImgIfExists('img-state-progress','/charts/state_in_progress.png');
        const metaCount = document.getElementById('meta-progress-count'); if(metaCount) metaCount.textContent = nProgress;
        const metaPct = document.getElementById('meta-progress-pct'); if(metaPct) metaPct.textContent = Math.round((nProgress/total)*100) + '%';
    }
    if (nNotStarted > 0) {
        const el = document.getElementById('card-notstarted'); if (el) el.style.display = 'block';
        showImgIfExists('img-state-notstarted','/charts/state_not_started.png');
        const metaCount = document.getElementById('meta-notstarted-count'); if(metaCount) metaCount.textContent = nNotStarted;
        const metaPct = document.getElementById('meta-notstarted-pct'); if(metaPct) metaPct.textContent = Math.round((nNotStarted/total)*100) + '%';
    }
}

function renderTasks(tasks, usuarios) {
    const container = document.getElementById('tasks-container');
    if (!container) return;
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
    headerRow.style.backgroundColor = '#f5f5f5';
    headerRow.innerHTML = `
        <th style="text-align:left;padding:8px">ID</th>
        <th style="text-align:left;padding:8px">Título</th>
        <th style="text-align:left;padding:8px">Estado</th>
        <th style="text-align:left;padding:8px">Asignado</th>
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
            const op = document.createElement('option'); op.value = val; op.textContent = label; if(val===t.status) op.selected = true; sel.appendChild(op);
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
            if(t.assignedUserId && t.assignedUserId === u.user_id) op.selected = true;
            selUser.appendChild(op);
        });
        // fallback to name match if no userId stored
        if(!selUser.value && t.assignedTo){
            const match = (usuarios||[]).find(u => (u.nombre||u.email) === t.assignedTo);
            if(match) selUser.value = match.user_id;
        }
        assignTd.appendChild(selUser);

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
                if(!res.ok) throw new Error('Error');
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
        tr.appendChild(dateTd);
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);

        // details row (hidden) with inspection summary
        const detailsTr = document.createElement('tr');
        const detailsTd = document.createElement('td');
        detailsTd.colSpan = 6;
        detailsTd.style.padding = '8px';
        detailsTd.style.display = 'none';
        detailsTd.className = 'task-details-cell';
        detailsTr.appendChild(detailsTd);
        tbody.appendChild(detailsTr);

        // toggle on title click
        titleTd.style.cursor = 'pointer';
        titleTd.addEventListener('click', ()=>{
            if(detailsTd.style.display === 'none'){
                // render summary into detailsTd
                detailsTd.innerHTML = '';
                detailsTd.appendChild(renderInspectionSummary(t));
                detailsTd.style.display = 'table-cell';
            } else {
                detailsTd.style.display = 'none';
            }
        });
    });
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

function badgeClass(status) {
    if (!status) return '';
    if (status === 'done') return 'badge-done';
    if (status === 'in_progress') return 'badge-progress';
    if (status === 'not_started') return 'badge-notstarted';
    return '';
}

function statusLabel(status) {
    if (!status) return '';
    if (status === 'done') return 'Completada';
    if (status === 'in_progress') return 'En progreso';
    if (status === 'not_started') return 'No iniciada';
    return status;
}

function renderInspectionSummary(task) {
    const container = document.createElement('div');
    container.style.padding = '12px';
    container.style.backgroundColor = '#f9f9f9';
    container.style.border = '1px solid #ddd';
    container.style.borderRadius = '4px';
    
    if (task.inspection && typeof task.inspection === 'object') {
        const left = document.createElement('div');
        left.style.float = 'left';
        left.style.width = '50%';
        
        const right = document.createElement('div');
        right.style.float = 'right';
        right.style.width = '50%';
        
        // Add inspection details here if needed
        left.innerHTML = '<h4>Detalles de Inspección</h4><p>Información de la inspección asociada...</p>';
        right.innerHTML = '<h4>Estado</h4><p>Estado actual de la tarea...</p>';
        
        container.appendChild(left);
        container.appendChild(right);
    } else {
        container.textContent = 'No hay detalle de inspección disponible para esta tarea.';
    }
    return container;
}

function initDashboard(){
    // Only attach SPA handlers to in-page navigation links (those with data-view)
    const links = document.querySelectorAll('.dashboard-link[data-view]');
    links.forEach(l => l.addEventListener('click', onNavClick));

    // mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if(mobileToggle){
        mobileToggle.addEventListener('click', ()=>{
            const nav = document.querySelector('.dashboard-nav');
            if(nav) nav.classList.toggle('open');
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
        if (el) el.style.display = 'block';
        if(view === 'admin') setupAdminForm();
    }

    function setupAdminForm(){
        const form = document.getElementById('form-crear-usuario');
        if(!form) return;
        
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
        if(!adminList) return;
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
        headerRow.style.backgroundColor = '#f5f5f5';
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
            row.style.borderBottom = '1px solid #ddd';
            
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
                if(!confirm('¿Eliminar usuario?')) return;
                
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

// Ensure initialization whether this script loads before or after DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}