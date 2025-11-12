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

            // Inject a logout button into the header for admin users
            try {
                const headerContainer = document.querySelector('header .container-large');
                if (headerContainer) {
                    const logoutWrap = document.createElement('div');
                    logoutWrap.style.cssText = 'position:absolute;right:18px;top:18px;';
                    const btn = document.createElement('button');
                    btn.id = 'dashboardLogoutBtn';
                    btn.className = 'small ghost';
                    btn.type = 'button';
                    btn.style.cursor = 'pointer';
                    // Use SVG icon + label for clearer visual
                    btn.innerHTML = `<img src="/imagenes/icon-logout.svg" aria-hidden="true" style="height:18px; width:18px; vertical-align:middle; margin-right:8px; filter:invert(1) grayscale(1) contrast(100%);">Cerrar sesión`;
                    logoutWrap.appendChild(btn);
                    // ensure header is positioned relatively so absolute works
                    const headerEl = document.querySelector('header');
                    if (headerEl && getComputedStyle(headerEl).position === 'static') {
                        headerEl.style.position = 'relative';
                    }
                    headerContainer.appendChild(logoutWrap);

                    btn.addEventListener('click', async () => {
                        try {
                            // get fresh csrf token (include credentials)
                            const tokenRes = await fetch('/auth/csrf', { credentials: 'include', cache: 'no-store' });
                            const token = tokenRes.ok ? (await tokenRes.json()).csrfToken : null;
                            // call logout
                            await fetch('/auth/logout', { method: 'POST', credentials: 'include', headers: { 'csrf-token': token }, cache: 'no-store' });
                            // Redirect to login regardless of response (handles odd 304 behavior)
                            window.location.href = '/Vistas/login.html';
                        } catch (e) {
                            // If anything fails, still redirect to login
                            window.location.href = '/Vistas/login.html';
                        }
                    });
                }
            } catch (e) {
                // ignore DOM injection errors
                console.error('Error injecting admin logout button', e);
            }
    }catch(e){
        window.location.href = '/Vistas/login.html';
        return;
    }
    // only load the dashboard script when authenticated
    const s = document.createElement('script');
    s.src = '../js/dashboard.js';
    document.body.appendChild(s);
})();


