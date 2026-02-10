// Bitácoras view controller (FastAPI integration)
(function(){
    const API_BASE = 'http://127.0.0.1:8000';
    const state = {
        serviceOk: false,
        avanzado: false
    };

    const qs = (sel) => document.querySelector(sel);
    const logBox = () => qs('#bitacora-log');

    function currentPeriod(){
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }

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
        ids.map(qs).filter(Boolean).forEach(btn => { btn.disabled = !!busy; btn.classList.toggle('is-busy', !!busy); });
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
            const res = await fetch(`${API_BASE}/health`, { cache:'no-store' });
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

    async function procesar({ statusTarget }={}){
        const btnId = ['#btn-procesar'];
        setBusyButtons(btnId, true);
        const statusEl = statusTarget || qs('#procesar-status');
        if(statusEl){ statusEl.textContent = 'Actualizando bitácora...'; }
        try{
            const res = await fetch(`${API_BASE}/bitacora/procesar`, {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json().catch(()=>({}));
            if(!res.ok){ throw new Error(data.detail || data.error || 'Error procesando bitácoras'); }
            const archivos = data.generated || [];
            const filas = archivos[0]?.rows || 0;
            const mensaje = data.message || (filas > 0 ? 'Bitácora actualizada correctamente' : 'No hay nuevos registros');
            if(statusEl){ statusEl.textContent = mensaje; }
            pushLog(mensaje, 'success');
            setSimpleStatus(mensaje, 'success');
        }catch(err){
            const msg = err.message || 'Error al procesar bitácora';
            if(statusEl){ statusEl.textContent = msg; }
            pushLog(msg, 'error');
            setSimpleStatus('Error al procesar bitácora', 'error');
        }finally{
            setBusyButtons(btnId, false);
        }
    }

    async function metricas(){
        setBusyButtons(['#btn-metricas'], true);
        qs('#metricas-detalle').textContent = 'Calculando métricas...';
        try{
            const res = await fetch(`${API_BASE}/bitacora/metricas`, { cache:'no-store' });
            const data = await res.json().catch(()=>({}));
            if(!res.ok){ throw new Error(data.detail || data.error || 'Error obteniendo métricas'); }
            const total = data.total_registros || 0;
            const clientes = data.clientes ? Object.keys(data.clientes).length : 0;
            const periodos = data.periodos ? Object.keys(data.periodos).length : 0;
            qs('#metricas-total').textContent = total;
            qs('#metricas-clientes').textContent = clientes;
            qs('#metricas-periodos').textContent = periodos;
            qs('#metricas-detalle').textContent = 'OK: métricas actualizadas';
            pushLog(`Métricas -> registros:${total} clientes:${clientes} periodos:${periodos}`,'info');
        }catch(err){
            qs('#metricas-detalle').textContent = err.message || 'No se pudieron cargar métricas';
            pushLog(err.message || 'Error en métricas','error');
        }finally{
            setBusyButtons(['#btn-metricas'], false);
        }
    }

    async function descargar({ statusTarget }={}){
        const btns = ['#btn-descargar'];
        const statusEl = statusTarget || qs('#descarga-status');
        setBusyButtons(btns, true);
        if(statusEl){ statusEl.textContent = 'Descargando...'; }
        try{
            const res = await fetch(`${API_BASE}/bitacora/excel`);
            if(!res.ok){
                const errJson = await res.json().catch(()=>({}));
                throw new Error(errJson.detail || errJson.error || 'No se encontró el archivo');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bitacora_mantenimiento.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(()=>URL.revokeObjectURL(url), 2000);
            if(statusEl){ statusEl.textContent = 'Excel descargado correctamente'; }
            pushLog('Descarga OK de la bitácora','success');
            setSimpleStatus('Excel descargado correctamente. Revisa tu carpeta de descargas.', 'success');
        }catch(err){
            if(statusEl){ statusEl.textContent = err.message || 'Error al descargar'; }
            pushLog(err.message || 'Error al descargar','error');
            setSimpleStatus(err.message || 'No se pudo descargar el Excel', 'error');
        }finally{
            setBusyButtons(btns, false);
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

    async function init(){
        const isAdmin = await ensureAdmin();
        if(!isAdmin){ return; }
        wireNav();
        const monthInputs = ['#input-periodo-simple'];
        monthInputs.map(qs).filter(Boolean).forEach(inp => { if(!inp.value){ inp.value = currentPeriod(); } });

        // Toggle avanzado visible solo para admins (la página ya exige admin, pero mantenemos la condición)
        const toggle = qs('#toggle-avanzado');
        const zonaAvanzada = qs('#zona-avanzada');
        if(toggle && zonaAvanzada){
            toggle.addEventListener('change', ()=>{
                state.avanzado = toggle.checked;
                zonaAvanzada.hidden = !toggle.checked;
            });
        }

        qs('#btn-check-service')?.addEventListener('click', checkService);
        qs('#btn-procesar')?.addEventListener('click', () => procesar({}));
        qs('#btn-metricas')?.addEventListener('click', metricas);
        qs('#btn-descargar')?.addEventListener('click', () => descargar({}));

        // Flujo simple
        qs('#btn-generar-simple')?.addEventListener('click', async ()=>{
            await procesar({ statusTarget: qs('#simple-status-text') });
        });

        qs('#btn-descargar-simple')?.addEventListener('click', async ()=>{
            await descargar({ statusTarget: qs('#simple-status-text') });
        });

        checkService();
        setSimpleStatus('Actualiza la bitácora y luego descárgala. Todo listo para usar.', 'info');
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
