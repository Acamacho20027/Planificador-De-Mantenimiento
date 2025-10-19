// Script para verificar usuarios en la base de datos
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'PlanificadorMantenimiento',
    port: parseInt(process.env.DB_PORT) || 1433,
    
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};

async function verificarUsuarios() {
    try {
        console.log('🔄 Conectando a SQL Server...');
        const pool = await sql.connect(config);
        console.log('✅ Conectado exitosamente');
        
        // Ver todos los usuarios (activos e inactivos)
        const todosUsuarios = await pool.request().query(`
            SELECT 
                u.id_usuario,
                u.nombre,
                u.email,
                u.numero_telefono,
                u.activo,
                r.nombre_rol AS rol,
                u.fecha_creacion,
                u.fecha_actualizacion
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            ORDER BY u.fecha_creacion DESC
        `);
        
        console.log('\n📋 TODOS LOS USUARIOS:');
        console.log('=====================================');
        todosUsuarios.recordset.forEach(user => {
            const estado = user.activo ? '✅ ACTIVO' : '❌ INACTIVO';
            console.log(`${user.id_usuario} | ${user.nombre || 'Sin nombre'} | ${user.email} | ${user.numero_telefono || 'Sin teléfono'} | ${estado} | ${user.rol}`);
        });
        
        // Ver solo usuarios activos
        const usuariosActivos = await pool.request().query(`
            SELECT 
                u.id_usuario,
                u.nombre,
                u.email,
                u.numero_telefono,
                r.nombre_rol AS rol
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.activo = 1
            ORDER BY u.nombre, u.email
        `);
        
        console.log('\n📋 USUARIOS ACTIVOS (los que ve el frontend):');
        console.log('=====================================');
        usuariosActivos.recordset.forEach(user => {
            console.log(`${user.id_usuario} | ${user.nombre || 'Sin nombre'} | ${user.email} | ${user.numero_telefono || 'Sin teléfono'} | ${user.rol}`);
        });
        
        await pool.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarUsuarios();
