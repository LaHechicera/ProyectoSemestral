const mysql = require('mysql2/promise'); //versión mysql2 a usar para la BD
const path = require('path');
let pool; // libreria pool para conexiones para MySQL

async function initializeDatabase() {
    try {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'root', 
            password: '', 
            database: 'cronicas', 
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const connection = await pool.getConnection();
        console.log('Conectado a la base de datos MySQL en:', `mysql://localhost:3306/cronicas`);
        connection.release();

        const createTableSql = `
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                selectStory VARCHAR(20) DEFAULT NULL,
                genero VARCHAR(20) DEFAULT NULL,
                usuarioNombre VARCHAR(15) UNIQUE NOT NULL,
                decision TEXT DEFAULT NULL,
                tiempo_juego INT DEFAULT 0
            )`;

        // Ejecuta la sentencia para crear la tabla
        await pool.query(createTableSql);
        console.log('Tabla "usuario" creada exitosamente.');
        return true;

    } catch (error) {
        console.error('Error al conectar o crear tabla en MySQL:', error.message);
        return false;
    }
}
async function isDatabaseConnected() {
    // Si el pool de conexiones ya existe, asume que está conectado
    if (pool) {
        try {
            // Intenta obtener una conexión para verificar que el pool es funcional
            const connection = await pool.getConnection();
            connection.release();
            return true;
        } catch (error) {
            console.error('El pool de conexiones MySQL no es funcional:', error.message);
            pool = null; // Reinicia el pool si hay un error
            return await initializeDatabase(); // Intenta reinicializar
        }
    }
    // Si no está conectado, intenta inicializarla.
    console.log('La base de datos MySQL no está conectada. Intentando inicializar...');
    return await initializeDatabase();
}

async function handleUserLoginOrRegisterOnline(userData) {
    const { usuarioNombre } = userData;
    const connected = await isDatabaseConnected();

    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL.', user: null };
    }

    try {
        // Primero, intenta buscar el usuario por usuarioNombre.
        const [rows] = await pool.query('SELECT * FROM usuario WHERE usuarioNombre = ?', [usuarioNombre]);

        if (rows.length > 0) {
            // El usuario existe, devolver sus datos (simulando "inicio de sesión").
            console.log(`Usuario "${usuarioNombre}" cargado exitosamente de MySQL.`);
            return { success: true, message: 'Usuario cargado exitosamente.', user: rows[0] };
        } else {
            // El usuario no existe, registrarlo con valores por defecto.
            const insertSql = `
                INSERT INTO usuario (usuarioNombre, selectStory, genero, decision, tiempo_juego)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await pool.query(
                insertSql,
                [
                    usuarioNombre,
                    userData.selectStory || null,
                    userData.genero || null,
                    userData.decision || null,
                    userData.tiempo_juego || 0
                ]
            );
            console.log(`Nuevo usuario "${usuarioNombre}" registrado en MySQL con ID: ${result.insertId}`);
            return {
                success: true,
                message: 'Registro de usuario exitoso.',
                user: {
                    id_usuario: result.insertId,
                    usuarioNombre: usuarioNombre,
                    selectStory: userData.selectStory || null,
                    genero: userData.genero || null,
                    decision: userData.decision || null,
                    tiempo_juego: userData.tiempo_juego || 0
                }
            };
        }
    } catch (error) {
        console.error('Error al manejar el registro/carga de usuario en MySQL:', error.message);
        return { success: false, message: 'Error al procesar usuario en MySQL: ' + error.message, user: null };
    }
}

async function updateUserData(id_usuario, dataToUpdate) {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL para actualizar.' };
    }

    try {
        let fields = [];
        let values = [];
        for (const key in dataToUpdate) {
            if (dataToUpdate.hasOwnProperty(key) && key !== 'id_usuario') {
                fields.push(`${key} = ?`);
                values.push(dataToUpdate[key]);
            }
        }
        values.push(id_usuario);

        if (fields.length === 0) {
            return { success: false, message: 'No hay datos para actualizar.' };
        }

        const query = `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`;
        const [result] = await pool.query(query, values);

        if (result.affectedRows > 0) {
            console.log(`Usuario con ID ${id_usuario} actualizado exitosamente en MySQL.`);
            return { success: true, message: 'Usuario actualizado exitosamente.' };
        } else {
            console.warn(`Usuario con ID ${id_usuario} no encontrado o no se realizaron cambios en MySQL.`);
            return { success: false, message: 'Usuario no encontrado o no se realizaron cambios.' };
        }
    } catch (error) {
        console.error('Error al actualizar usuario en MySQL:', error.message);
        return { success: false, message: 'Error al actualizar usuario en MySQL: ' + error.message };
    }
}

module.exports = {
    initializeDatabase,
    isDatabaseConnected,
    handleUserLoginOrRegisterOnline,
    updateUserData
};