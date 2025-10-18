// =====================================================
// ARCHIVO DE EJEMPLO: config/database.js
// Copia este archivo a: config/database.js en la raíz
// =====================================================

const sql = require('mssql');

// Configuración de conexión a SQL Server
const config = {
    user: process.env.DB_USER || 'tu_usuario_sql',
    password: process.env.DB_PASSWORD || 'tu_password_sql',
    server: process.env.DB_SERVER || 'localhost', // o dirección IP
    database: process.env.DB_NAME || 'PlanificadorMantenimiento',
    
    options: {
        encrypt: true, // Usar true para Azure, false para local sin SSL
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
            pool = await sql.connect(config);
            console.log('✅ Conectado a SQL Server:', config.database);
        }
        return pool;
    } catch (err) {
        console.error('❌ Error de conexión a SQL Server:', err.message);
        throw err;
    }
}

/**
 * Ejecutar una consulta SQL con parámetros
 * @param {string} sqlQuery - Query SQL a ejecutar
 * @param {object} params - Parámetros de la query
 * @returns {Promise<sql.IResult>}
 */
async function query(sqlQuery, params = {}) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Agregar parámetros a la request
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(sqlQuery);
        return result;
    } catch (err) {
        console.error('Error ejecutando query:', err.message);
        throw err;
    }
}

/**
 * Ejecutar un procedimiento almacenado
 * @param {string} procedureName - Nombre del procedimiento
 * @param {object} params - Parámetros del procedimiento
 * @returns {Promise<sql.IResult>}
 */
async function execute(procedureName, params = {}) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Agregar parámetros
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        console.error(`Error ejecutando procedimiento ${procedureName}:`, err.message);
        throw err;
    }
}

/**
 * Cerrar el pool de conexiones (útil para testing)
 */
async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('✅ Conexión cerrada');
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

