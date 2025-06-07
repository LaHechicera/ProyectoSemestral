const fs = require('fs/promises'); // Usar la versión de promesas para operaciones asíncronas
const path = require('path');

const OFFLINE_DB_PATH = path.join(__dirname, '..', 'db_local.json');

async function readOfflineUsers() {
    try {
        const data = await fs.readFile(OFFLINE_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // El archivo no existe, devuelve un array vacío para empezar fresco.
            console.log('Archivo db_local.json no encontrado, creando uno nuevo.');
            return [];
        }
        console.error('Error al leer el archivo offline:', error);
        // Podrías lanzar el error o devolver un array vacío dependiendo del comportamiento deseado
        throw new Error('No se pudieron leer los datos offline: ' + error.message);
    }
}

async function saveUserOffline(userData) {
    try {
        let users = [];
        try {
            users = await readOfflineUsers(); // Intenta leer los usuarios existentes
        } catch (readError) {
            // Si hay un error al leer (ej. JSON malformado, no solo ENOENT), empezamos con un array vacío
            console.warn('Advertencia: Error al leer el archivo db_local.json, creando uno nuevo:', readError.message);
            users = [];
        }

        const existingUserIndex = users.findIndex(user => user.usuarioNombre === userData.usuarioNombre);
        let userToReturn;

        if (existingUserIndex > -1) {
            // Actualiza el usuario existente con los nuevos datos
            users[existingUserIndex] = { ...users[existingUserIndex], ...userData };
            console.log(`Usuario "${userData.usuarioNombre}" actualizado offline.`);
            userToReturn = users[existingUserIndex];
        } else {
            // Añade un nuevo usuario. Genera un ID temporal si no se proporciona (para modo offline puro).
            const newUserData = { id_usuario: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...userData };
            users.push(newUserData);
            console.log(`Nuevo usuario "${userData.usuarioNombre}" guardado offline.`);
            userToReturn = newUserData;
        }

        // Escribe todo el array de usuarios en el archivo. Esto creará el archivo si no existe.
        await fs.writeFile(OFFLINE_DB_PATH, JSON.stringify(users, null, 2), 'utf8');
        return { success: true, message: 'Usuario guardado/actualizado offline exitosamente.', user: userToReturn };
    } catch (error) {
        console.error('Error al guardar usuario offline:', error);
        return { success: false, message: 'Error al guardar usuario offline: ' + error.message, user: null };
    }
}

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