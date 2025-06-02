const fs = require('fs/promises'); // Usar la versión de promesas para operaciones asíncronas
const path = require('path');

const OFFLINE_DB_PATH = path.join(__dirname, '..', 'db_local.json');

/**
 * Lee los usuarios almacenados en el archivo db_local.json.
 * @returns {Promise<Array<object>>} - Un array de objetos de usuario.
 */
async function readOfflineUsers() {
    try {
        const data = await fs.readFile(OFFLINE_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // El archivo no existe, devuelve un array vacío.
            return [];
        }
        console.error('Error al leer el archivo offline:', error);
        throw new Error('No se pudieron leer los datos offline.');
    }
}

/**
 * Guarda un nuevo usuario en el archivo db_local.json.
 * @param {object} userData - Los datos del usuario a guardar (username, password).
 * @returns {Promise<object>} - Un objeto con el estado de éxito y un mensaje.
 */
async function saveUserOffline(userData) {
    try {
        const users = await readOfflineUsers();
        // Evitar duplicados (opcional, puedes ajustar la lógica según tus necesidades)
        const userExists = users.some(user => user.username === userData.username);
        if (userExists) {
            return { success: false, message: 'El usuario ya existe en modo offline.' };
        }

        users.push(userData);
        await fs.writeFile(OFFLINE_DB_PATH, JSON.stringify(users, null, 2), 'utf8');
        return { success: true, message: 'Usuario guardado offline exitosamente.' };
    } catch (error) {
        console.error('Error al guardar usuario offline:', error);
        return { success: false, message: 'Error al guardar usuario offline: ' + error.message };
    }
}

/**
 * Elimina el archivo db_local.json.
 * @returns {Promise<object>} - Un objeto con el estado de éxito y un mensaje.
 */
async function deleteOfflineFile() {
    try {
        await fs.unlink(OFFLINE_DB_PATH);
        console.log('Archivo db_local.json eliminado.');
        return { success: true, message: 'Archivo offline eliminado.' };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // El archivo ya no existe, lo consideramos un éxito.
            return { success: true, message: 'El archivo offline ya no existe.' };
        }
        console.error('Error al eliminar el archivo offline:', error);
        throw new Error('No se pudo eliminar el archivo offline: ' + error.message);
    }
}

module.exports = {
    readOfflineUsers,
    saveUserOffline,
    deleteOfflineFile
};