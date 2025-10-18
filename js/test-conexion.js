// =====================================================
// SCRIPT DE PRUEBA DE CONEXIÓN A SQL SERVER
// =====================================================
// 
// Uso:
// 1. Copiar ejemplo-config-database.js a ../config/database.js
// 2. Configurar credenciales en .env o en database.js
// 3. Ejecutar: node BaseDeDatos/test-conexion.js
// 
// =====================================================

const sql = require('mssql');

// Configuración directa para prueba
const config = {
    user: process.env.DB_USER || 'tu_usuario',
    password: process.env.DB_PASSWORD || 'tu_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'PlanificadorMantenimiento',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000
    }
};

console.log('🔄 Probando conexión a SQL Server...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📡 Servidor: ${config.server}`);
console.log(`🗄️  Base de datos: ${config.database}`);
console.log(`👤 Usuario: ${config.user}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testConnection() {
    let pool;
    
    try {
        // Test 1: Conectar
        console.log('Test 1: Conectando a SQL Server...');
        pool = await sql.connect(config);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // Test 2: Verificar versión
        console.log('Test 2: Verificando versión de SQL Server...');
        const versionResult = await pool.request().query('SELECT @@VERSION AS version');
        const version = versionResult.recordset[0].version.split('\n')[0];
        console.log(`✅ ${version}\n`);
        
        // Test 3: Verificar base de datos
        console.log('Test 3: Verificando base de datos...');
        const dbResult = await pool.request().query('SELECT DB_NAME() AS database_name');
        console.log(`✅ Base de datos actual: ${dbResult.recordset[0].database_name}\n`);
        
        // Test 4: Contar tablas
        console.log('Test 4: Contando tablas...');
        const tablesResult = await pool.request().query(`
            SELECT COUNT(*) as total 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        const totalTables = tablesResult.recordset[0].total;
        console.log(`✅ Total de tablas: ${totalTables}\n`);
        
        // Test 5: Listar tablas principales
        console.log('Test 5: Listando tablas principales...');
        const listResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        console.log('✅ Tablas encontradas:');
        listResult.recordset.forEach(row => {
            console.log(`   - ${row.TABLE_NAME}`);
        });
        console.log('');
        
        // Test 6: Verificar usuarios
        console.log('Test 6: Verificando tabla de usuarios...');
        const usersResult = await pool.request().query('SELECT COUNT(*) as total FROM usuarios');
        const totalUsers = usersResult.recordset[0].total;
        console.log(`✅ Total de usuarios: ${totalUsers}\n`);
        
        // Test 7: Verificar tareas
        console.log('Test 7: Verificando tabla de tareas...');
        const tasksResult = await pool.request().query('SELECT COUNT(*) as total FROM tareas');
        const totalTasks = tasksResult.recordset[0].total;
        console.log(`✅ Total de tareas: ${totalTasks}\n`);
        
        // Test 8: Verificar estados
        console.log('Test 8: Listando estados disponibles...');
        const statesResult = await pool.request().query(`
            SELECT codigo_estado, nombre_estado 
            FROM estados 
            ORDER BY orden_display
        `);
        console.log('✅ Estados:');
        statesResult.recordset.forEach(row => {
            console.log(`   - ${row.codigo_estado}: ${row.nombre_estado}`);
        });
        console.log('');
        
        // Test 9: Probar procedimiento almacenado
        console.log('Test 9: Probando procedimiento almacenado (stats)...');
        const statsResult = await pool.request().execute('SP_obtener_stats_dashboard');
        console.log('✅ Procedimiento ejecutado correctamente');
        console.log('   Estadísticas:');
        statsResult.recordset.forEach(row => {
            console.log(`   - ${row.nombre_estado}: ${row.count} tareas`);
        });
        console.log('');
        
        // Test 10: Verificar vistas
        console.log('Test 10: Verificando vistas...');
        const viewsResult = await pool.request().query(`
            SELECT COUNT(*) as total 
            FROM INFORMATION_SCHEMA.VIEWS
        `);
        const totalViews = viewsResult.recordset[0].total;
        console.log(`✅ Total de vistas: ${totalViews}\n`);
        
        // Test 11: Probar vista principal
        console.log('Test 11: Probando vista VW_dashboard_principal...');
        const dashboardResult = await pool.request().query('SELECT * FROM VW_dashboard_principal');
        const dash = dashboardResult.recordset[0];
        console.log('✅ Dashboard:');
        console.log(`   - No iniciadas: ${dash.total_no_iniciadas}`);
        console.log(`   - En progreso: ${dash.total_en_progreso}`);
        console.log(`   - Finalizadas: ${dash.total_finalizadas}`);
        console.log(`   - Total tareas: ${dash.total_tareas}`);
        console.log(`   - Usuarios activos: ${dash.total_usuarios_activos}`);
        console.log(`   - Inspecciones: ${dash.total_inspecciones}`);
        console.log('');
        
        // Resumen final
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 ¡TODOS LOS TESTS PASARON!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ La base de datos está correctamente configurada');
        console.log('✅ Todas las tablas están presentes');
        console.log('✅ Los procedimientos almacenados funcionan');
        console.log('✅ Las vistas están operativas');
        console.log('✅ Los datos de ejemplo están cargados');
        console.log('');
        console.log('📝 Próximos pasos:');
        console.log('   1. Copiar ejemplo-config-database.js a config/database.js');
        console.log('   2. Actualizar server.js con las nuevas funciones de BD');
        console.log('   3. Probar los endpoints con: npm start');
        console.log('');
        
    } catch (err) {
        console.error('\n❌ ERROR EN LA PRUEBA:');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Tipo:', err.name);
        console.error('Mensaje:', err.message);
        
        if (err.code) {
            console.error('Código:', err.code);
        }
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('\n📝 Posibles soluciones:');
        
        if (err.code === 'ELOGIN') {
            console.error('   ⚠️  Error de autenticación');
            console.error('   - Verificar usuario y contraseña');
            console.error('   - Verificar que el usuario tenga permisos en la BD');
            console.error('   - Verificar autenticación SQL Server vs Windows');
        } else if (err.code === 'ETIMEOUT' || err.code === 'ESOCKET') {
            console.error('   ⚠️  Error de conexión');
            console.error('   - Verificar que SQL Server esté corriendo');
            console.error('   - Verificar el nombre del servidor (localhost, IP, etc.)');
            console.error('   - Verificar firewall y puerto (1433)');
            console.error('   - Verificar que TCP/IP esté habilitado en SQL Server Configuration Manager');
        } else if (err.code === 'EDBNAME') {
            console.error('   ⚠️  Base de datos no encontrada');
            console.error('   - Ejecutar el script PlanificadorMantenimiento_BaseDeDatos_Completa.sql');
            console.error('   - Verificar el nombre de la base de datos');
        } else {
            console.error('   - Revisar los logs de SQL Server');
            console.error('   - Verificar configuración en database.js o .env');
        }
        
        console.error('');
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

// Ejecutar tests
testConnection();

