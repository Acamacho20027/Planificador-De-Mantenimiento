(async function(){
    try{
        const res = await fetch('/auth/me', { credentials: 'include' });
        const data = await res.json();
        if(!data.authenticated){
            window.location.href = 'login.html';
            return;
        }
    }catch(e){
        window.location.href = 'login.html';
        return;
    }
    // only load the dashboard script when authenticated
    const s = document.createElement('script');
    s.src = 'dashboard.js';
    document.body.appendChild(s);
})();


