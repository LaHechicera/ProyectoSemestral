const fs = require('fs/promises');
const path = require('path');

const OFFLINE_DB_PATH = path.join(__dirname, '..', 'db_local.json');

//Lee los usuarios almacenados en el archivo db_local.json.
async function readOfflineUsers() {
    try {
        const data = await fs.readFile(OFFLINE_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Offline: Archivo db_local.json no encontrado, devolviendo array vacío.');
            return [];
        }
        console.error('Offline: Error al leer el archivo offline (posiblemente corrupto):', error);
        return [];
    }
}

//Guarda un nuevo usuario o actualiza uno existente en el archivo db_local.json.
async function saveUserOffline(userData) {
    try {
        let users = await readOfflineUsers();

        const existingUserIndex = users.findIndex(user => user.id_usuario === userData.id_usuario || user.usuarioNombre === userData.usuarioNombre);
        let userToReturn;

        if (existingUserIndex > -1) {
            // Actualiza el usuario existente con los nuevos datos
            users[existingUserIndex] = { ...users[existingUserIndex], ...userData };
            console.log(`Offline: Usuario "${userData.usuarioNombre}" (ID: ${userData.id_usuario}) actualizado offline.`);
            userToReturn = users[existingUserIndex];
        } else {
            // Añade un nuevo usuario. Genera un ID temporal si no se proporciona (para modo offline).
            const newUserData = {
                id_usuario: userData.id_usuario || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...userData
            };
            users.push(newUserData);
            console.log(`Offline: Nuevo usuario "${userData.usuarioNombre}" (ID: ${newUserData.id_usuario}) guardado offline.`);
            userToReturn = newUserData;
        }

        // Escribe todo el array de usuarios en el archivo. Esto creará el archivo si no existe.
        await fs.writeFile(OFFLINE_DB_PATH, JSON.stringify(users, null, 2), 'utf8');
        return { success: true, message: 'Usuario guardado/actualizado offline exitosamente.', user: userToReturn };
    } catch (error) {
        console.error('Offline: Error al guardar usuario offline:', error);
        return { success: false, message: 'Error al guardar usuario offline: ' + error.message, user: null };
    }
}

//Elimina el archivo db_local.json.
async function deleteOfflineFile() {
    try {
        await fs.unlink(OFFLINE_DB_PATH);
        console.log('Offline: Archivo db_local.json eliminado.');
        return { success: true, message: 'Archivo offline eliminado.' };
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Offline: El archivo db_local.json ya no existe (no es un error).');
            return { success: true, message: 'El archivo offline ya no existe.' };
        }
        console.error('Offline: Error al eliminar el archivo offline:', error);
        throw new Error('No se pudo eliminar el archivo offline: ' + error.message);
    }
}

module.exports = {
    readOfflineUsers,
    saveUserOffline,
    deleteOfflineFile
};
