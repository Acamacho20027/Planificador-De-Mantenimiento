// Planificador de Mantenimiento - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Planificador de Mantenimiento cargado');
    
    // Navegación suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Manejo del formulario
    const form = document.querySelector('.form-component');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Formulario enviado correctamente. Pronto nos pondremos en contacto contigo.');
            form.reset();
        });
    }
});

