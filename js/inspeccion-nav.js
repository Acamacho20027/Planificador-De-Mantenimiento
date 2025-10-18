(function(){
  function wire(){
    const back = document.getElementById('back-dashboard');
    if(back){
      back.addEventListener('click', async function(){
        // Ping /auth/me to ensure the session cookie is fresh (helps with strict environments)
        try{ await fetch('/auth/me', { credentials: 'include' }); }catch(e){}
        window.location.href = '/Vistas/dashboard.html';
      });
    }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();


