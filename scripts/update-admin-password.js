// Script para actualizar la contraseña del admin
const bcrypt = require('bcryptjs');
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function updateAdminPassword() {
    try {
        console.log('🔄 Conectando a base de datos...');
        const pool = await sql.connect(config);
        
        // Generar nuevo hash para Admin123
        const password = 'Admin123';
        const hash = await bcrypt.hash(password, 12);
        
        console.log('🔐 Hash generado para: Admin123');
        console.log('   Hash:', hash);
        
        // Actualizar en la base de datos
        await pool.request()
            .input('password_hash', sql.NVarChar, hash)
            .query(`
                UPDATE usuarios 
                SET password_hash = @password_hash 
                WHERE email = 'admin@empresa.com'
            `);
        
        console.log('✅ Contraseña actualizada exitosamente');
        console.log('');
        console.log('Credenciales:');
        console.log('  Email: admin@empresa.com');
        console.log('  Password: Admin123');
        
        await pool.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateAdminPassword();

