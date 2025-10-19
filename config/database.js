// =====================================================
// CONFIGURACIÓN DE BASE DE DATOS SQL SERVER
// =====================================================

const sql = require('mssql');
require('dotenv').config();

// Configuración de conexión a SQL Server
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'PlanificadorMantenimiento',
    port: parseInt(process.env.DB_PORT) || 1433,
    
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // true para Azure
        trustServerCertificate: true, // true para desarrollo local
        enableArithAbort: true,
        connectTimeout: 30000, // 30 segundos
        requestTimeout: 30000
    },
    
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Pool de conexiones global
let pool = null;

/**
 * Obtener conexión al pool
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getConnection() {
    try {
        if (!pool) {
            console.log('🔄 Conectando a SQL Server...');
            console.log(`   Server: ${config.server}`);
            console.log(`   Database: ${config.database}`);
            console.log(`   User: ${config.user}`);
            
            pool = await sql.connect(config);
            console.log('✅ Conectado exitosamente a SQL Server');
        }
        return pool;
    } catch (err) {
        console.error('❌ Error de conexión a SQL Server:', err.message);
        console.error('   Verifica que SQL Server esté corriendo y las credenciales sean correctas');
        throw err;
    }
}

/**
 * Ejecutar una consulta SQL con parámetros
 * @param {string} sqlQuery - Query SQL a ejecutar
 * @param {object} params - Parámetros de la query { nombre: valor }
 * @returns {Promise<sql.IResult>}
 */
async function query(sqlQuery, params = {}) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Agregar parámetros a la request
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        const result = await request.query(sqlQuery);
        return result;
    } catch (err) {
        console.error('❌ Error ejecutando query:', err.message);
        console.error('   Query:', sqlQuery);
        throw err;
    }
}

/**
 * Ejecutar un procedimiento almacenado
 * @param {string} procedureName - Nombre del procedimiento
 * @param {object} params - Parámetros del procedimiento { nombre: { type: sql.Int, value: 123 } }
 * @returns {Promise<sql.IResult>}
 */
async function execute(procedureName, params = {}) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Agregar parámetros con tipos
        for (const [key, config] of Object.entries(params)) {
            if (config.type && config.value !== undefined) {
                request.input(key, config.type, config.value);
            } else {
                request.input(key, config);
            }
        }
        
        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        console.error(`❌ Error ejecutando procedimiento ${procedureName}:`, err.message);
        throw err;
    }
}

/**
 * Cerrar el pool de conexiones
 */
async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('✅ Conexión a base de datos cerrada');
        }
    } catch (err) {
        console.error('Error cerrando conexión:', err.message);
    }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
});

module.exports = {
    sql,
    getConnection,
    query,
    execute,
    closeConnection
};

