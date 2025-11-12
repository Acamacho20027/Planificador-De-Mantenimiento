// Styles for the login page that were inline before
(function injectStyles(){
    const css = `
    .auth-container { max-width: 420px; margin: 60px auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px; }
    .auth-field { display: flex; flex-direction: column; margin-bottom: 12px; }
    .auth-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .link { color: #1e88e5; cursor: pointer; text-decoration: underline; background: none; border: none; padding: 0; }
    .password-row { display: flex; gap: 8px; align-items: center; }
    .toggle-btn { background: none; border: 1px solid #ccc; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
    #email, #password { color: #000; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
})();

async function getCsrf() {
    const res = await fetch('/auth/csrf', { credentials: 'include' });
    const json = await res.json();
    return json.csrfToken;
}

async function onSubmitLogin(e){
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const csrf = await getCsrf();
    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        credentials: 'include',
        body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(()=>({}));
    const msg = document.getElementById('msg');
    if(res.ok){
        msg.textContent = 'Autenticado';
        window.location.href = '/Vistas/dashboard.html';
    } else {
        msg.textContent = (data && data.error) || 'Error de autenticación';
    }
}

async function onRequestReset(){
    const email = prompt('Introduce tu email para restablecer contraseña:');
    if(!email) {return;}
    const csrf = await getCsrf();
    await fetch('/auth/request-password-reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf }, credentials: 'include',
        body: JSON.stringify({ email })
    });
    alert('Si el correo existe, recibirás un enlace (revisa consola del servidor en modo demo).');
}

function togglePasswordVisibility(){
    const input = document.getElementById('password');
    if(!input) {return;}
    input.type = input.type === 'password' ? 'text' : 'password';
    const t = document.getElementById('toggle-text');
    if(t) {t.textContent = input.type === 'password' ? 'Mostrar' : 'Ocultar';}
}

document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('login-form');
    if(form) {form.addEventListener('submit', onSubmitLogin);}
    const resetBtn = document.getElementById('request-reset');
    if(resetBtn) {resetBtn.addEventListener('click', onRequestReset);}
    const toggleBtn = document.getElementById('toggle-password');
    if(toggleBtn) {toggleBtn.addEventListener('click', togglePasswordVisibility);}
});


