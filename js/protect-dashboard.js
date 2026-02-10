(async function(){
    try{
        const res = await fetch('/auth/me', { credentials: 'include' });
            const data = await res.json();
            if(!data.authenticated){
                window.location.href = '/Vistas/login.html';
                return;
            }

            // Only allow Administrators to access the dashboard UI.
            // If the authenticated user is not an admin, redirect to the user view.
            if (!(data.user && data.user.rol === 'Administrador')) {
                window.location.href = '/Vistas/usuario.html';
                return;
            }

            // Inject a logout button into the header for admin users (desktop only).
            try {
                const headerContainer = document.querySelector('header .container-large');
                // Only inject for desktop sizes; mobile uses hamburger menu logout.
                const isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
                if (headerContainer && !isMobile) {
                    const logoutWrap = document.createElement('div');
                    // reduce footprint so it doesn't overlap the big header on desktop
                    logoutWrap.style.cssText = 'position:absolute;right:12px;top:12px;';
                    const btn = document.createElement('button');
                    btn.id = 'dashboardLogoutBtn';
                    btn.className = 'small ghost';
                    btn.type = 'button';
                    btn.style.cursor = 'pointer';
                    btn.innerHTML = `<img src="/imagenes/icon-logout.svg" aria-hidden="true" style="height:14px; width:14px; filter:invert(1) grayscale(1) contrast(100%);">Cerrar sesión`;
                    logoutWrap.appendChild(btn);
                    // ensure header is positioned relatively so absolute works
                    const headerEl = document.querySelector('header');
                    if (headerEl && getComputedStyle(headerEl).position === 'static') {
                        headerEl.style.position = 'relative';
                    }
                    headerContainer.appendChild(logoutWrap);

                    btn.addEventListener('click', async () => {
                        try {
                            const tokenRes = await fetch('/auth/csrf', { credentials: 'include', cache: 'no-store' });
                            const token = tokenRes.ok ? (await tokenRes.json()).csrfToken : null;
                            await fetch('/auth/logout', { method: 'POST', credentials: 'include', headers: { 'csrf-token': token }, cache: 'no-store' });
                            window.location.href = '/Vistas/login.html';
                        } catch (e) {
                            window.location.href = '/Vistas/login.html';
                        }
                    });
                }
            } catch (err) {
                // ignore DOM injection errors
                console.error('Error injecting admin logout button', err);
            }
    }catch(e){
        window.location.href = '/Vistas/login.html';
        return;
    }
    // only load the dashboard script when authenticated; avoid double-load if already present
    if (!window.__dashboardLoaded) {
        const s = document.createElement('script');
        s.src = '../js/dashboard.js';
        document.body.appendChild(s);
    }
})();


