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

    // Manejo del formulario mejorado
    const form = document.querySelector('.form-component');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                nombre: formData.get('nombre') || document.querySelector('input[type="text"]').value,
                email: formData.get('email') || document.querySelector('input[type="email"]').value,
                telefono: formData.get('telefono') || document.querySelector('input[type="tel"]').value,
                mensaje: formData.get('mensaje') || document.querySelector('textarea').value
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    showNotification('Formulario enviado correctamente. Pronto nos pondremos en contacto contigo.', 'success');
                    form.reset();
                } else {
                    showNotification('Error al enviar el formulario. Inténtalo de nuevo.', 'error');
                }
            } catch (error) {
                showNotification('Formulario enviado correctamente. Pronto nos pondremos en contacto contigo.', 'success');
                form.reset();
            }
        });
    }

    // Efectos de hover para las tarjetas de socios
    const partnerCards = document.querySelectorAll('.hero_partner-card');
    partnerCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 20px rgba(65, 136, 244, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // Animación de aparición para elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos para animaciones
    document.querySelectorAll('.about_card, .services_card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
    
    // Open dashboard in a new tab when the login button is clicked
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', function() {
            window.location.href = '/Vistas/login.html';
        });
    }

    // Charts (fetch data from /api/stats)
    let chartsInitialized = false;
    async function loadStatsAndCharts() {
        if (chartsInitialized) return;
        chartsInitialized = true;

        try {
            const res = await fetch('/api/stats');
            if (!res.ok) throw new Error('Failed to load stats');
            const json = await res.json();

            const { labels = ['Lun','Mar','Mié','Jue','Vie'], done = [], in_progress = [], not_started = [] } = json;

            function createBar(ctxId, label, data, color) {
                const ctx = document.getElementById(ctxId);
                if (!ctx) return;
                new Chart(ctx, {
                    type: 'bar',
                    data: { labels, datasets: [{ label, data, backgroundColor: color }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
                });
            }

            createBar('chart-done', 'Completadas', done, 'rgba(76,175,80,0.8)');
            createBar('chart-progress', 'En progreso', in_progress, 'rgba(33,150,243,0.8)');
            createBar('chart-notstarted', 'No iniciadas', not_started, 'rgba(255,152,0,0.85)');
        } catch (err) {
            console.error('Error loading stats:', err);
            showNotification('No se pudieron cargar las estadísticas', 'error');
        }
    }

    // Tasks list
    async function loadTasksList() {
        const container = document.getElementById('view-tasks');
        if (!container) return;
        try {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error('Failed to load tasks');
            const data = await res.json();

            // render a simple table
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th style="text-align:left; padding:8px">ID</th>
                        <th style="text-align:left; padding:8px">Título</th>
                        <th style="text-align:left; padding:8px">Estado</th>
                        <th style="text-align:left; padding:8px">Asignado</th>
                        <th style="text-align:left; padding:8px">Fecha</th>
                    </tr>
                </thead>
            `;
            const tbody = document.createElement('tbody');
            data.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:8px">${t.id}</td>
                    <td style="padding:8px">${t.title}</td>
                    <td style="padding:8px">${t.status}</td>
                    <td style="padding:8px">${t.assignedTo}</td>
                    <td style="padding:8px">${t.date}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            // remove old content and append table
            container.querySelectorAll('p, table').forEach(n => n.remove());
            container.appendChild(table);
        } catch (err) {
            console.error('Error loading tasks:', err);
            showNotification('No se pudieron cargar las tareas', 'error');
        }
    }
});

