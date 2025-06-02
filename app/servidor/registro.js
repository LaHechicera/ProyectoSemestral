const { handleUserLoginOrRegisterOnline, isDatabaseConnected, updateUserData } = require('../db/database');
const { saveUserOffline, readOfflineUsers, deleteOfflineFile } = require('../db/offline');
const fs = require('fs/promises');

async function handleUserRegistration(userData, mode) {
    if (mode === 'online') {
        const connected = await isDatabaseConnected();
        if (!connected) { 
            return await saveUserOffline(userData); // Si no hay conexión a la BD, intenta guardar offline como fallback
        }
        const result = await handleUserLoginOrRegisterOnline(userData); // Llama a la nueva función que maneja tanto el login como el registro
        if (result.success) {
            // Si hay datos offline y el usuario se conecta online, intenta sincronizar
            await syncOfflineData(); // Intenta sincronizar cualquier dato pendiente
        }
        return result;
    } else if (mode === 'offline') {
        return await saveUserOffline(userData);
    } else {
        return { success: false, message: 'Modo de operación no válido.', user: null };
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

        console.log(`Sincronizando ${offlineUsers.length} usuarios offline...`);
        for (const user of offlineUsers) {
            // Para cada usuario offline, intenta registrarlo/cargarlo en la base de datos y luego actualiza sus campos si es necesario.
            const loginResult = await handleUserLoginOrRegisterOnline({ usuarioNombre: user.usuarioNombre });

            if (loginResult.success && loginResult.user) {
                // Usuario ya existía o fue creado, ahora actualiza sus campos con los datos offline
                const updateResult = await updateUserData(loginResult.user.id_usuario, user);
                if (updateResult.success) {
                    console.log(`Usuario ${user.usuarioNombre} sincronizado/actualizado exitosamente.`);
                } else {
                    console.warn(`Fallo al actualizar usuario ${user.usuarioNombre}: ${updateResult.message}`);
                }
            } else {
                console.warn(`Fallo al registrar/cargar usuario ${user.usuarioNombre} durante la sincronización: ${loginResult.message}`);
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