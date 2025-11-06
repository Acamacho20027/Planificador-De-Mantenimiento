#!/usr/bin/env node
/**
 * scripts/seed-demo-user.js
 * Crea un usuario demo (demo@empresa.com / Demo123) en la base de datos si no existe.
 * Uso: node scripts/seed-demo-user.js
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        const email = 'demo@empresa.com';
        const password = 'Demo123';
        const nombre = 'Usuario Demo';

        const pool = await db.getConnection();

        // Verificar si ya existe
        const exists = await pool.request()
            .input('email', email)
            .query(`SELECT id_usuario FROM usuarios WHERE email = @email`);

        if (exists.recordset.length > 0) {
            console.log(`Usuario demo ya existe: ${email}. No se realizó ninguna inserción.`);
            process.exit(0);
        }

        // Buscar id_rol para 'Usuario'
        const rolRes = await pool.request()
            .input('rol', 'Usuario')
            .query(`SELECT id_rol FROM roles WHERE nombre_rol = @rol`);

        if (rolRes.recordset.length === 0) {
            console.error('No se encontró el rol "Usuario" en la tabla roles. Por favor crea el rol antes.');
            process.exit(1);
        }

        const id_rol = rolRes.recordset[0].id_rol;

        const passwordHash = await bcrypt.hash(password, 10);

        const insert = await pool.request()
            .input('nombre', nombre)
            .input('email', email)
            .input('numero_telefono', null)
            .input('password_hash', passwordHash)
            .input('id_rol', id_rol)
            .query(`
                INSERT INTO usuarios (nombre, email, numero_telefono, password_hash, id_rol, activo)
                OUTPUT INSERTED.id_usuario, INSERTED.nombre, INSERTED.email
                VALUES (@nombre, @email, @numero_telefono, @password_hash, @id_rol, 1)
            `);

        const newUser = insert.recordset[0];
        console.log('Usuario demo creado correctamente:');
        console.log({ id_usuario: newUser.id_usuario, nombre: newUser.nombre, email: newUser.email, password });
        console.log('Puedes iniciar sesión en la vista de usuario con estas credenciales.');
        process.exit(0);
    } catch (err) {
        console.error('Error creando usuario demo:', err);
        process.exit(1);
    }
}

seed();
