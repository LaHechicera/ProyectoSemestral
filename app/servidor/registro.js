const { handleUserLoginOrRegisterOnline, isDatabaseConnected, updateUserData } = require('../db/database');
const { saveUserOffline, readOfflineUsers, deleteOfflineFile } = require('../db/offline');
const fs = require('fs/promises');

async function handleUserRegistration(userData, preferredMode) {
    const connected = await isDatabaseConnected();
    let finalMode = preferredMode;

    // Si el usuario prefiere online pero no hay conexión, forzamos offline
    if (preferredMode === 'online' && !connected) {
        console.warn('Conexión online solicitada pero no disponible. Cambiando a modo offline.');
        finalMode = 'offline';
    }

    if (finalMode === 'online') {
        const result = await handleUserLoginOrRegisterOnline(userData);
        if (result.success) {
            // Si el login/registro online fue exitoso, intentar sincronizar datos offline pendientes
            await syncOfflineData();
        }
        // Asegúrate de que el resultado siempre contenga `sincronizado: true` si se procesó online
        return { ...result, sincronizado: result.success };
    } else if (finalMode === 'offline') {
        // Guarda los datos del usuario en el archivo JSON local.
        const result = await saveUserOffline(userData);
        // Asegúrate de que el resultado siempre contenga `sincronizado: false` si se procesó offline
        return { ...result, sincronizado: false };
    } else {
        return { success: false, message: 'Modo de operación no válido.', user: null, sincronizado: false };
    }
}

async function syncOfflineData() {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos para sincronizar.' };
    }

    try {
        const offlineUsers = await readOfflineUsers();
        if (offlineUsers.length === 0) {
            return { success: true, message: 'No hay datos offline para sincronizar.' };
        }

        console.log(`Sincronizando ${offlineUsers.length} usuarios offline a la base de datos MySQL...`);
        for (const user of offlineUsers) {
            // Para cada usuario offline, intenta registrarlo/cargarlo en la base de datos
            const loginResult = await handleUserLoginOrRegisterOnline({ usuarioNombre: user.usuarioNombre });

            if (loginResult.success && loginResult.user) {

                const dataToUpdate = { ...user };
                delete dataToUpdate.id_usuario;
                delete dataToUpdate.usuarioNombre;

                if (Object.keys(dataToUpdate).length > 0) { // Solo si hay datos para actualizar
                    const updateResult = await updateUserData(loginResult.user.id_usuario, dataToUpdate);
                    if (updateResult.success) {
                        console.log(`Usuario "${user.usuarioNombre}" sincronizado/actualizado exitosamente.`);
                    } else {
                        console.warn(`Fallo al actualizar datos del usuario "${user.usuarioNombre}": ${updateResult.message}`);
                    }
                } else {
                    console.log(`Usuario "${user.usuarioNombre}" ya sincronizado sin datos adicionales que actualizar.`);
                }
            } else {
                console.warn(`Fallo al registrar/cargar usuario "${user.usuarioNombre}" durante la sincronización: ${loginResult.message}`);
            }
        }

        // Una vez que todos los datos se han intentado sincronizar, elimina el archivo local.
        await deleteOfflineFile();
        return { success: true, message: 'Datos offline sincronizados y archivo local eliminado.' };

    } catch (error) {
        console.error('Error durante la sincronización de datos offline:', error);
        return { success: false, message: 'Error al sincronizar datos offline: ' + error.message };
    }
}

module.exports = {
    handleUserRegistration,
    syncOfflineData
};
module.exports = {
    handleUserRegistration,
    syncOfflineData
};