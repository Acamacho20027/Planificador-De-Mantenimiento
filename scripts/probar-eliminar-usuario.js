// Script para probar el endpoint DELETE de usuarios
const fetch = require('node-fetch').default;

async function probarEliminarUsuario() {
    try {
        console.log('🔄 Probando endpoint DELETE de usuarios...');
        
        // Primero hacer login para obtener la sesión
        const loginResponse = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@empresa.com',
                password: 'Admin123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error('Error en login: ' + loginResponse.status);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login exitoso:', loginData.user.email);
        
        // Obtener la lista de usuarios
        const usuariosResponse = await fetch('http://localhost:3000/api/usuarios', {
            headers: {
                'Cookie': loginResponse.headers.get('set-cookie') || ''
            }
        });
        
        if (!usuariosResponse.ok) {
            throw new Error('Error obteniendo usuarios: ' + usuariosResponse.status);
        }
        
        const usuarios = await usuariosResponse.json();
        console.log('\n📋 Usuarios disponibles:');
        usuarios.forEach(u => {
            console.log(`ID: ${u.user_id} | ${u.nombre} | ${u.email}`);
        });
        
        // Buscar un usuario que no sea admin para eliminar
        const usuarioParaEliminar = usuarios.find(u => u.user_id !== 1 && u.rol === 'Usuario');
        
        if (!usuarioParaEliminar) {
            console.log('❌ No hay usuarios para eliminar (solo admin disponible)');
            return;
        }
        
        console.log(`\n🎯 Intentando eliminar usuario: ${usuarioParaEliminar.nombre} (ID: ${usuarioParaEliminar.user_id})`);
        
        // Intentar eliminar el usuario
        const deleteResponse = await fetch(`http://localhost:3000/api/usuarios/${usuarioParaEliminar.user_id}`, {
            method: 'DELETE',
            headers: {
                'Cookie': loginResponse.headers.get('set-cookie') || ''
            }
        });
        
        console.log('📡 Status de eliminación:', deleteResponse.status);
        
        if (deleteResponse.ok) {
            const deleteData = await deleteResponse.json();
            console.log('✅ Usuario eliminado:', deleteData);
        } else {
            const errorData = await deleteResponse.json();
            console.log('❌ Error al eliminar:', errorData);
        }
        
        // Verificar que se eliminó
        const usuariosDespuesResponse = await fetch('http://localhost:3000/api/usuarios', {
            headers: {
                'Cookie': loginResponse.headers.get('set-cookie') || ''
            }
        });
        
        const usuariosDespues = await usuariosDespuesResponse.json();
        console.log('\n📋 Usuarios después de eliminar:');
        usuariosDespues.forEach(u => {
            console.log(`ID: ${u.user_id} | ${u.nombre} | ${u.email}`);
        });
        
        const usuarioEliminado = usuariosDespues.find(u => u.user_id === usuarioParaEliminar.user_id);
        if (usuarioEliminado) {
            console.log('❌ PROBLEMA: El usuario sigue apareciendo en la lista');
        } else {
            console.log('✅ CORRECTO: El usuario fue eliminado de la lista');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Esperar un poco para que el servidor esté listo
setTimeout(probarEliminarUsuario, 3000);
