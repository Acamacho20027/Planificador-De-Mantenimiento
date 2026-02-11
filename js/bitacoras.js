// Controlador de la vista de bitácoras (usa API Node /api/bitacora con auth)
(function(){
    const API_BASE = '/api/bitacora';
    const state = {
        serviceOk: false,
        clientes: [],
        defaultCliente: (document.body?.dataset?.defaultCliente) || 'Cliente Principal'
    };

    const qs = (sel) => document.querySelector(sel);
    const logBox = () => qs('#bitacora-log');

    function setServiceStatus(text, tone){
        const el = qs('#bitacora-service-status');
        if(!el){ return; }
        el.textContent = text;
        el.classList.remove('online','offline','warn');
        if(tone){ el.classList.add(tone); }
    }

    function pushLog(message, tone='info'){
        const box = logBox();
        if(!box){ return; }
        const row = document.createElement('div');
        row.className = `log-line ${tone}`;
        row.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
        box.prepend(row);
    }

    function setSimpleStatus(message, tone='info'){
        const panel = qs('#simple-status');
        const text = qs('#simple-status-text');
        if(!panel || !text){ return; }
        panel.dataset.tone = tone;
        panel.classList.remove('ok','warn','error');
        if(tone === 'success'){ panel.classList.add('ok'); }
        if(tone === 'warn'){ panel.classList.add('warn'); }
        if(tone === 'error'){ panel.classList.add('error'); }
        text.textContent = message;
    }

    function setBusyButtons(ids, busy){
        ids.map(qs).filter(Boolean).forEach(btn => {
            btn.disabled = !!busy;
            btn.classList.toggle('is-busy', !!busy);
        });
    }

    async function ensureAdmin(){
        try{
            const res = await fetch('/auth/me', { credentials:'include', cache:'no-store' });
            const data = res.ok ? await res.json() : null;
            if(!data || !data.authenticated){
                window.location.href = '/Vistas/login.html';
                return false;
            }
            if(!(data.user && data.user.rol === 'Administrador')){
                window.location.href = '/Vistas/usuario.html';
                return false;
            }
            return true;
        }catch(err){
            window.location.href = '/Vistas/login.html';
            return false;
        }
    }

    async function checkService(){
        setServiceStatus('Verificando servicio...', 'warn');
        try{
            const res = await fetch(`${API_BASE}/health`, { credentials:'include', cache:'no-store' });
            if(!res.ok){ throw new Error('sin respuesta'); }
            const data = await res.json();
            setServiceStatus('Servicio activo', 'online');
            state.serviceOk = true;
            pushLog(`Servicio operativo. Origen: ${data.source || 'n/d'}`,'success');
        }catch(err){
            state.serviceOk = false;
            setServiceStatus('Servicio no disponible', 'offline');
            pushLog('No se pudo contactar al microservicio FastAPI','error');
        }
    }

    const getPeriod = (selector) => {
        const val = qs(selector)?.value || '';
        return val.trim() || null;
    };

    async function procesar({ statusTarget, cliente, period, buttons }={}){
        const btnIds = buttons || ['#btn-procesar'];
        setBusyButtons(btnIds, true);
        const statusEl = statusTarget || qs('#procesar-status');
        if(statusEl){ statusEl.textContent = 'Procesando...'; }
        try{
            const payload = { cliente: cliente || state.defaultCliente };
            if(period){ payload.period = period; }
            const res = await fetch(`${API_BASE}/procesar`, {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                credentials:'include',
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(()=>({}));
            if(!res.ok){ throw new Error(data.detail || data.error || 'Error procesando bitácoras'); }
            const newAdded = data.new_records ?? data.generated?.[0]?.new_records_added ?? 0;
            const totalRows = data.total_rows ?? data.generated?.[0]?.total_rows ?? 0;
            const mensaje = data.message || (newAdded > 0 ? `Bitácora actualizada. ${newAdded} nuevo(s). Total: ${totalRows}.` : (totalRows > 0 ? `Sin registros nuevos. Total: ${totalRows}.` : 'No hay nuevos registros'));
            if(statusEl){ statusEl.textContent = mensaje; }
            pushLog(`${mensaje} · Cliente: ${payload.cliente} · Periodo: ${period || 'año actual'}`, newAdded > 0 || totalRows > 0 ? 'success' : 'warn');
            setSimpleStatus(mensaje, newAdded > 0 || totalRows > 0 ? 'success' : 'warn');
        }catch(err){
            const msg = err.message || 'Error al procesar bitácora';
            if(statusEl){ statusEl.textContent = msg; }
            pushLog(msg, 'error');
            setSimpleStatus(msg, 'error');
        }finally{
            setBusyButtons(btnIds, false);
        }
    }

    async function metricas(){
        setBusyButtons(['#btn-metricas'], true);
        const detalle = qs('#metricas-detalle');
        if(detalle){ detalle.textContent = 'Calculando métricas...'; }
        try{
            const res = await fetch(`${API_BASE}/metricas`, { credentials:'include', cache:'no-store' });
            const data = await res.json().catch(()=>({}));
            if(!res.ok){ throw new Error(data.detail || data.error || 'Error obteniendo métricas'); }
            qs('#metricas-total') && (qs('#metricas-total').textContent = data.total_registros || 0);
            qs('#metricas-clientes') && (qs('#metricas-clientes').textContent = data.clientes ? Object.keys(data.clientes).length : 0);
            qs('#metricas-periodos') && (qs('#metricas-periodos').textContent = data.periodos ? Object.keys(data.periodos).length : 0);
            if(detalle){ detalle.textContent = 'OK: métricas actualizadas'; }
            pushLog('Métricas actualizadas','info');
        }catch(err){
            if(detalle){ detalle.textContent = err.message || 'No se pudieron cargar métricas'; }
            pushLog(err.message || 'Error en métricas','error');
        }finally{
            setBusyButtons(['#btn-metricas'], false);
        }
    }

    async function descargar({ statusTarget, cliente, buttons }={}){
        const btns = buttons || ['#btn-descargar'];
        const statusEl = statusTarget || qs('#descarga-status');
        setBusyButtons(btns, true);
        if(statusEl){ statusEl.textContent = 'Descargando...'; }
        try{
            const params = new URLSearchParams();
            if(cliente){ params.append('cliente', cliente); }
            const res = await fetch(`${API_BASE}/excel?${params.toString()}`, { credentials:'include' });
            if(!res.ok){
                const errJson = await res.json().catch(()=>({}));
                throw new Error(errJson.detail || errJson.error || 'No se encontró el archivo');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const cd = res.headers.get('content-disposition') || '';
            const nameMatch = cd.match(/filename="?([^";]+)"?/i);
            const filename = nameMatch ? nameMatch[1] : `bitacora_${(cliente || 'cliente')}.xlsx`;
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(()=>URL.revokeObjectURL(url), 2000);
            if(statusEl){ statusEl.textContent = 'Excel descargado correctamente'; }
            pushLog(`Descarga OK · Cliente: ${cliente || state.defaultCliente}`,'success');
            setSimpleStatus('Excel descargado correctamente. Revisa tu carpeta de descargas.', 'success');
        }catch(err){
            if(statusEl){ statusEl.textContent = err.message || 'Error al descargar'; }
            pushLog(err.message || 'Error al descargar','error');
            setSimpleStatus(err.message || 'No se pudo descargar el Excel', 'error');
        }finally{
            setBusyButtons(btns, false);
        }
    }

    function renderClientesOptions(){
        const selects = ['#select-cliente-simple', '#select-cliente-procesar', '#select-cliente-descarga'];
        selects.map(qs).filter(Boolean).forEach(sel => {
            sel.innerHTML = '';
            state.clientes.forEach(cli => {
                const opt = document.createElement('option');
                opt.value = cli;
                opt.textContent = cli;
                if(cli.toLowerCase() === state.defaultCliente.toLowerCase()){
                    opt.selected = true;
                }
                sel.appendChild(opt);
            });
        });
    }

    async function cargarClientes(){
        try{
            const res = await fetch(`${API_BASE}/clientes`, { credentials:'include', cache:'no-store' });
            const data = await res.json().catch(()=>({ clientes: [] }));
            if(res.ok && Array.isArray(data.clientes)){
                state.clientes = data.clientes.length ? data.clientes : [state.defaultCliente];
                state.defaultCliente = data.default || state.defaultCliente;
            }
            renderClientesOptions();
        }catch(err){
            pushLog('No se pudieron cargar clientes','error');
        }
    }

    async function crearCliente(nombre){
        const clean = (nombre || '').trim();
        if(!clean){
            pushLog('Indica un nombre de cliente','warn');
            return;
        }
        setBusyButtons(['#btn-crear-cliente'], true);
        try{
            const res = await fetch(`${API_BASE}/clientes`, {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                credentials:'include',
                body: JSON.stringify({ nombre: clean })
            });
            const data = await res.json().catch(()=>({}));
            if(!res.ok){ throw new Error(data.detail || 'No se pudo crear el cliente'); }
            if(data.created === false){
                pushLog('El cliente ya existe','warn');
                qs('#nuevo-cliente') && (qs('#nuevo-cliente').value = '');
                return;
            }
            state.clientes = data.clientes || state.clientes;
            renderClientesOptions();
            qs('#nuevo-cliente') && (qs('#nuevo-cliente').value = '');
            pushLog('Cliente creado correctamente','success');
        }catch(err){
            pushLog(err.message || 'No se pudo crear el cliente','error');
        }finally{
            setBusyButtons(['#btn-crear-cliente'], false);
        }
    }

    function wireNav(){
        const toggle = qs('#nav-toggle');
        const nav = document.querySelector('.dashboard-nav');
        if(toggle && nav){
            toggle.addEventListener('click', (e)=>{
                e.preventDefault();
                const isOpen = nav.classList.contains('open');
                nav.classList.toggle('open', !isOpen);
                nav.style.cssText = nav.classList.contains('open') ? 'display:block !important; visibility:visible !important; opacity:1 !important; transform: translateX(0) !important;' : 'display:none !important; visibility:hidden !important; opacity:0 !important; transform: translateX(-100%) !important;';
                toggle.setAttribute('aria-expanded', (!isOpen).toString());
            });
            nav.querySelectorAll('.dashboard-link').forEach(link => {
                link.addEventListener('click', () => {
                    const isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
                    if(!isMobile){ return; }
                    nav.classList.remove('open');
                    nav.style.cssText = 'display:none !important; visibility:hidden !important; opacity:0 !important; transform: translateX(-100%) !important;';
                    toggle.setAttribute('aria-expanded','false');
                });
            });
            document.addEventListener('click', (ev)=>{
                const isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
                if(!isMobile){ return; }
                if(!nav.classList.contains('open')){ return; }
                if(toggle.contains(ev.target) || nav.contains(ev.target)){ return; }
                nav.classList.remove('open');
                nav.style.cssText = 'display:none !important; visibility:hidden !important; opacity:0 !important; transform: translateX(-100%) !important;';
                toggle.setAttribute('aria-expanded','false');
            });
        }

        const logoutBtn = qs('#menu-logout');
        if(logoutBtn){
            logoutBtn.addEventListener('click', async (e)=>{
                e.preventDefault();
                try{ await fetch('/auth/logout', { method:'POST', credentials:'include', cache:'no-store' }); }catch(err){ void 0; }
                window.location.href = '/Vistas/login.html';
            });
        }
    }

    function wireAdvancedToggle(){
        const toggle = qs('#toggle-avanzado');
        const zona = qs('#zona-avanzada');
        if(!toggle || !zona){ return; }
        toggle.addEventListener('change', ()=>{
            zona.hidden = !toggle.checked;
        });
    }

    async function init(){
        const isAdmin = await ensureAdmin();
        if(!isAdmin){ return; }
        wireNav();
        wireAdvancedToggle();
        renderClientesOptions();

        qs('#btn-check-service')?.addEventListener('click', checkService);

        qs('#btn-generar-simple')?.addEventListener('click', async ()=>{
            const period = getPeriod('#input-periodo-simple');
            const cliente = qs('#select-cliente-simple')?.value || state.defaultCliente;
            if(!period){ setSimpleStatus('Elige un periodo (YYYY-MM).', 'warn'); return; }
            await procesar({ cliente, period, statusTarget: qs('#simple-status-text'), buttons:['#btn-generar-simple'] });
        });

        qs('#btn-descargar-simple')?.addEventListener('click', async ()=>{
            const cliente = qs('#select-cliente-simple')?.value || state.defaultCliente;
            await descargar({ cliente, statusTarget: qs('#simple-status-text'), buttons:['#btn-descargar-simple'] });
        });

        qs('#btn-procesar')?.addEventListener('click', ()=>{
            const cliente = qs('#select-cliente-procesar')?.value || state.defaultCliente;
            const period = getPeriod('#input-periodo-procesar');
            procesar({ cliente, period, statusTarget: qs('#procesar-status'), buttons:['#btn-procesar'] });
        });

        qs('#btn-metricas')?.addEventListener('click', metricas);

        qs('#btn-descargar')?.addEventListener('click', ()=>{
            const cliente = qs('#select-cliente-descarga')?.value || state.defaultCliente;
            descargar({ cliente, statusTarget: qs('#descarga-status'), buttons:['#btn-descargar'] });
        });

        qs('#btn-crear-cliente')?.addEventListener('click', ()=>{
            const nombre = qs('#nuevo-cliente')?.value;
            crearCliente(nombre);
        });

        checkService();
        setSimpleStatus('Selecciona periodo, procesa y descarga la bitácora.', 'info');
        cargarClientes();
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
