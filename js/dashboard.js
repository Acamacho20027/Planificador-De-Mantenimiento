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

        // Columna de instrucción
        const instructionTd = document.createElement('td'); 
        instructionTd.style.padding = '8px';
        
        const instructionBtn = document.createElement('button');
        instructionBtn.textContent = t.instruction ? 'Ver Instrucción' : 'Asignar Instrucción';
        instructionBtn.className = 'small';
        instructionBtn.style.backgroundColor = t.instruction ? '#28a745' : '#007bff';
        instructionBtn.style.color = 'white';
        instructionBtn.style.border = 'none';
        instructionBtn.style.padding = '4px 8px';
        instructionBtn.style.borderRadius = '4px';
        instructionBtn.style.cursor = 'pointer';
        
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

// =====================================================
// FUNCIONES PARA MANEJAR INSTRUCCIONES
// =====================================================

// Mostrar modal con detalles de la instrucción y la inspección de la tarea
async function showInstructionModal(instruction, taskId) {
    try {
        // Obtener información de la tarea y su inspección
        const response = await fetch(`/api/tasks/${taskId}/inspection`);
        if (!response.ok) throw new Error('Error al cargar información de la tarea');
        
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
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #333; font-size: 24px; font-weight: 600;">Ver Instrucción</h2>
                <button id="closeModal" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #007bff; font-size: 18px; font-weight: 600; border-left: 4px solid #007bff; padding-left: 10px;">INSPECCIÓN DE LA TAREA</h3>
                <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #000; font-size: 16px;">Tarea: ${task.title}</h4>
                    ${task.description ? `<p style="margin: 0 0 15px 0; color: #000; line-height: 1.5;"><strong>Descripción:</strong> ${task.description}</p>` : ''}
                    ${inspection ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
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
                <h3 style="margin: 0 0 15px 0; color: #28a745; font-size: 18px; font-weight: 600; border-left: 4px solid #28a745; padding-left: 10px;">INSTRUCCIÓN ASIGNADA</h3>
                <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #000; font-size: 18px;">${instruction.title}</h4>
                    <p style="margin: 0 0 10px 0; color: #000; line-height: 1.5;"><strong>Categoría:</strong> ${instruction.category}</p>
                    <p style="margin: 0; color: #000; line-height: 1.5;"><strong>Descripción:</strong> ${instruction.description}</p>
                </div>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Cerrar modal
        document.getElementById('closeModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
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
        if (!response.ok) throw new Error('Error al cargar información de la tarea');
        
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
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #333; font-size: 24px; font-weight: 600;">Asignar Instrucción</h2>
                <button id="closeTaskModal" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px;">✕</button>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #007bff; font-size: 18px; font-weight: 600; border-left: 4px solid #007bff; padding-left: 10px;">INSPECCIÓN DE LA TAREA</h3>
                <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Tarea: ${task.title}</h4>
                    ${task.description ? `<p style="margin: 0 0 15px 0; color: #555; line-height: 1.5;"><strong>Descripción:</strong> ${task.description}</p>` : ''}
                    ${inspection ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                            <p style="margin: 0 0 8px 0; color: #333; line-height: 1.5;"><strong>Inspección:</strong> ${inspection.name}</p>
                            <p style="margin: 0 0 8px 0; color: #333; line-height: 1.5;"><strong>Tipo:</strong> ${inspection.type}</p>
                            ${inspection.building ? `<p style="margin: 0 0 8px 0; color: #333; line-height: 1.5;"><strong>Edificio:</strong> ${inspection.building}</p>` : ''}
                            ${inspection.floor ? `<p style="margin: 0 0 8px 0; color: #333; line-height: 1.5;"><strong>Piso:</strong> ${inspection.floor}</p>` : ''}
                            ${inspection.location ? `<p style="margin: 0 0 8px 0; color: #333; line-height: 1.5;"><strong>Ubicación:</strong> ${inspection.location}</p>` : ''}
                            ${inspection.observations ? `<p style="margin: 0 0 8px 0; color: #333; line-height: 1.5;"><strong>Observaciones:</strong> ${inspection.observations}</p>` : ''}
                            ${inspection.recommendations ? `<p style="margin: 0; color: #333; line-height: 1.5;"><strong>Recomendaciones:</strong> ${inspection.recommendations}</p>` : ''}
                        </div>
                    ` : '<p style="margin: 0; color: #666; font-style: italic;">No hay inspección asociada a esta tarea</p>'}
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #28a745; font-size: 18px; font-weight: 600; border-left: 4px solid #28a745; padding-left: 10px;">CREAR INSTRUCCIÓN PARA ESTA TAREA</h3>
                <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #000;">Título:</label>
                        <input type="text" id="instructionTitle" placeholder="Ej: Reparar sistema eléctrico" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; transition: border-color 0.3s; color: #000;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #000;">Categoría:</label>
                        <select id="instructionCategory" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; transition: border-color 0.3s; color: #000;">
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
                        <textarea id="instructionDescription" placeholder="Describe los pasos específicos para esta tarea..." style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; height: 120px; resize: vertical; font-size: 14px; transition: border-color 0.3s; color: #000;"></textarea>
                    </div>
                    <button id="createInstructionBtn" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">Crear Instrucción</button>
                </div>
            </div>
            
            <div id="instructionPreview" style="display: none;">
                <h3 style="margin: 0 0 15px 0; color: #6f42c1; font-size: 18px; font-weight: 600; border-left: 4px solid #6f42c1; padding-left: 10px;">PREVIEW DE LA INSTRUCCIÓN CREADA</h3>
                <div id="previewContent" style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 4px rgba(0,0,0,0.1); color: #000;">
                    <!-- Contenido de preview se llenará dinámicamente -->
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button id="assignInstructionBtn" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">Asignar a Tarea</button>
                    <button id="cancelBtn" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">Cancelar</button>
                </div>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        let createdInstruction = null;
        
        // Event listeners
        document.getElementById('closeTaskModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
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
                
                if (!response.ok) throw new Error('Error al crear instrucción');
                
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
                
                if (!response.ok) throw new Error('Error al asignar instrucción');
                
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
            }
        });
        
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