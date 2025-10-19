// Script para verificar la estructura de la tabla tareas
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

async function verificarTabla() {
    try {
        console.log('🔄 Conectando a SQL Server...');
        const pool = await sql.connect(config);
        console.log('✅ Conectado exitosamente');
        
        // Verificar si la tabla existe
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'tareas' AND TABLE_SCHEMA = 'dbo'
        `);
        
        if (tableExists.recordset[0].count === 0) {
            console.log('❌ La tabla "tareas" NO existe');
            return;
        }
        
        console.log('✅ La tabla "tareas" existe');
        
        // Obtener estructura de la tabla
        const columns = await pool.request().query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tareas' AND TABLE_SCHEMA = 'dbo'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('\n📋 Estructura de la tabla "tareas":');
        console.log('=====================================');
        columns.recordset.forEach(col => {
            console.log(`${col.COLUMN_NAME.padEnd(20)} | ${col.DATA_TYPE.padEnd(15)} | ${col.IS_NULLABLE}`);
        });
        
        // Verificar datos existentes
        const data = await pool.request().query(`
            SELECT TOP 3 * FROM tareas ORDER BY id_tarea DESC
        `);
        
        console.log('\n📊 Datos de ejemplo:');
        console.log('====================');
        if (data.recordset.length > 0) {
            data.recordset.forEach((row, index) => {
                console.log(`\nTarea ${index + 1}:`);
                Object.keys(row).forEach(key => {
                    console.log(`  ${key}: ${row[key]}`);
                });
            });
        } else {
            console.log('No hay datos en la tabla');
        }
        
        await pool.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarTabla();
