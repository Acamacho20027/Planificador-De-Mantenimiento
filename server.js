// Servidor Node.js para Planificador de Mantenimiento
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Endpoint para el formulario de contacto
app.post('/api/contact', (req, res) => {
    const { nombre, email, telefono, mensaje } = req.body;
    
    console.log('Nuevo mensaje de contacto:');
    console.log(`Nombre: ${nombre}`);
    console.log(`Email: ${email}`);
    console.log(`Teléfono: ${telefono}`);
    console.log(`Mensaje: ${mensaje}`);
    
    res.json({ 
        success: true, 
        message: 'Mensaje recibido correctamente' 
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📋 Planificador de Mantenimiento`);
});

