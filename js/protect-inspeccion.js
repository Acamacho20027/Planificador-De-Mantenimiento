// Protege la página de inspección: requiere usuario autenticado
(async function () {
    try {
        const res = await fetch('/auth/me', { credentials: 'include', cache: 'no-store' });
        const data = await res.json();
        if (!data.authenticated) {
            window.location.href = '/Vistas/login.html';
            return;
        }
    } catch (e) {
        window.location.href = '/Vistas/login.html';
    }
})();
