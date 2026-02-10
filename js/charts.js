// Dashboard charts powered by Chart.js
(function(){
    const palette = {
        done: '#3BA372',
        progress: '#3B82F6',
        notStarted: '#F59E0B'
    };

    // Referencias globales únicas para evitar duplicados
    let estadoChart = null;
    let fechaChart = null;
    let tecnicoChart = null;

    function $(id){ return document.getElementById(id); }

    function ensureCharts(){
        const statusCanvas = $('#chart-status');
        const timelineCanvas = $('#chart-evolution');
        const techCanvas = $('#chart-technicians');

        // Inicializar solo si el canvas existe y aún no hay instancia
        if (statusCanvas && !estadoChart) {
            estadoChart = new Chart(statusCanvas, {
                type:'doughnut',
                data:{ labels: ['Finalizado','En Proceso','No Iniciado'], datasets:[{ data:[0,0,0], backgroundColor:[palette.done, palette.progress, palette.notStarted], borderWidth:0, hoverOffset:12 }]},
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    cutout:'62%',
                    plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, padding:14 }}, tooltip:{ backgroundColor:'#0f172a', padding:12, cornerRadius:8 } }
                }
            });
        }

        if (timelineCanvas && !fechaChart) {
            fechaChart = new Chart(timelineCanvas, {
                type:'line',
                data:{ labels: [], datasets:[{ label:'Inspecciones / tareas', data: [], borderColor: palette.progress, backgroundColor:'rgba(59,130,246,0.14)', tension:0.32, fill:true, pointRadius:4, pointBackgroundColor: palette.progress, pointBorderWidth:0 }]},
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:'#0f172a', padding:12, cornerRadius:8 }},
                    scales:{ x:{ grid:{ display:false }, ticks:{ color:'#6b7280' }}, y:{ grid:{ color:'rgba(15,23,42,0.06)' }, ticks:{ precision:0, color:'#6b7280', beginAtZero:true } } }
                }
            });
        }

        if (techCanvas && !tecnicoChart) {
            tecnicoChart = new Chart(techCanvas, {
                type:'bar',
                data:{ labels: [], datasets:[{ label:'Tareas / inspecciones', data: [], backgroundColor:'rgba(59,130,246,0.18)', borderColor: palette.progress, borderWidth:1, borderRadius:10 }]},
                options:{
                    indexAxis:'y',
                    responsive:true,
                    maintainAspectRatio:false,
                    plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:'#0f172a', padding:12, cornerRadius:8 }},
                    scales:{ x:{ grid:{ color:'rgba(15,23,42,0.06)' }, ticks:{ precision:0, color:'#6b7280', beginAtZero:true }}, y:{ grid:{ display:false }, ticks:{ color:'#374151' } } }
                }
            });
        }
    }

    function setKpis(totals){
        const total = totals.totalTasks || 0;
        const done = totals.done || 0;
        const progress = totals.inProgress || 0;
        const notStarted = totals.notStarted || 0;
        const denom = total || (done + progress + notStarted) || 1;
        const pct = (v) => `${Math.round((v/denom)*100)}%`;

        [
            ['kpi-total', total],
            ['kpi-done', done],
            ['kpi-progress', progress],
            ['kpi-notstarted', notStarted],
            ['kpi-done-pct', pct(done)],
            ['kpi-progress-pct', pct(progress)],
            ['kpi-notstarted-pct', pct(notStarted)]
        ].forEach(([id,val])=>{ const el = $(id); if(el){ el.textContent = val; } });
    }

    function fmtDateLabel(label){
        try{
            const d = new Date(label);
            if(!isNaN(d)){
                return d.toLocaleDateString('es-ES', { month:'short', day:'2-digit' });
            }
        }catch(e){ /* ignore */ }
        return label;
    }

    function updateStatus(dist){
        if (!estadoChart) { ensureCharts(); }
        if (!estadoChart) { return; }
        const labels = dist?.labels || ['Finalizado','En Proceso','No Iniciado'];
        const values = dist?.values || [0,0,0];
        estadoChart.data.labels = labels;
        estadoChart.data.datasets[0].data = values;
        estadoChart.update();
    }

    function updateTimeline(timeline){
        if (!fechaChart) { ensureCharts(); }
        if (!fechaChart) { return; }
        const labels = (timeline?.labels || []).map(fmtDateLabel);
        const values = timeline?.values || [];
        fechaChart.data.labels = labels;
        fechaChart.data.datasets[0].data = values;
        fechaChart.update();
    }

    function updateTechnicians(tech){
        if (!tecnicoChart) { ensureCharts(); }
        if (!tecnicoChart) { return; }
        const labels = tech?.labels || [];
        const values = tech?.values || [];
        tecnicoChart.data.labels = labels;
        tecnicoChart.data.datasets[0].data = values;
        tecnicoChart.update();
    }

    function setLastSync(iso){
        const el = $('#label-last-sync');
        const kpi = $('#kpi-updated');
        if(!el){ return; }
        if(!iso){
            el.textContent = 'Sin datos';
            if(kpi){ kpi.textContent = 'Sin datos'; }
            return;
        }
        try{
            const d = new Date(iso);
            el.textContent = `Actualizado ${d.toLocaleString('es-ES')}`;
            if(kpi){ kpi.textContent = d.toLocaleString('es-ES'); }
        }catch(e){ el.textContent = 'Actualizado'; }
    }

    function render(insights){
        ensureCharts();
        if(!insights){
            setKpis({ totalTasks:0, done:0, inProgress:0, notStarted:0 });
            setLastSync(null);
            updateStatus(null);
            updateTimeline(null);
            updateTechnicians(null);
            return;
        }
        setKpis(insights.totals || {});
        setLastSync(insights.generatedAt);
        updateStatus(insights.statusDistribution);
        updateTimeline(insights.timeline);
        updateTechnicians(insights.technicians);
    }

    // Asegurar que el DOM esté listo antes de buscar los canvas
    function ready(fn){
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once:true });
        } else {
            fn();
        }
    }

    ready(ensureCharts);

    // API pública usada por dashboard.js
    window.dashboardCharts = { render };
})();
