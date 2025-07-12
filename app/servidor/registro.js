const { handleUserLoginOrRegisterOnline, isDatabaseConnected, updateUserData } = require('../db/database');
const { saveUserOffline, readOfflineUsers, deleteOfflineFile } = require('../db/offline');
const fs = require('fs/promises'); // Esta línea ya debería estar, si no, agrégala.

async function handleUserRegistration(userData, preferredMode) {
    const connected = await isDatabaseConnected();
    let finalMode = preferredMode;

    if (preferredMode === 'online' && !connected) {
        console.warn('Conexión online solicitada pero no disponible. Cambiando a modo offline.');
        finalMode = 'offline';
    }

    if (finalMode === 'online') {
        const result = await handleUserLoginOrRegisterOnline(userData);
        if (result.success) {
            // Si el login/registro online fue exitoso, intentar sincronizar datos offline pendientes
            await syncOfflineData(); // Llama a la función de sincronización aquí
        }
        return { ...result, sincronizado: result.success };
    } else if (finalMode === 'offline') {
        const result = await saveUserOffline(userData);
        return { ...result, sincronizado: false };
    } else {
        return { success: false, message: 'Modo de operación no especificado o inválido.' };
    }
}

//Sincroniza los datos de usuarios almacenados offline a la base de datos MySQL.
async function syncOfflineData() {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos para sincronizar.' };
    }

    try {
        const offlineUsers = await readOfflineUsers();
        if (offlineUsers.length === 0) {
            console.log('No hay datos offline para sincronizar.');
            return { success: true, message: 'No hay datos offline para sincronizar.' };
        }

        console.log(`Sincronizando ${offlineUsers.length} usuarios offline a la base de datos MySQL...`);

        for (const user of offlineUsers) {
            console.log(`Intentando sincronizar usuario: ${user.usuarioNombre}`);

            const loginOrRegisterResult = await handleUserLoginOrRegisterOnline({
                usuarioNombre: user.usuarioNombre,

            });

            if (loginOrRegisterResult.success && loginOrRegisterResult.user) {
                const onlineUserId = loginOrRegisterResult.user.id_usuario;
                console.log(`Usuario "${user.usuarioNombre}" encontrado/registrado online con ID: ${onlineUserId}.`);

                const dataToUpdate = {
                    selectStory: user.selectStory,
                    genero: user.genero,
                    decision: user.decision,      // Ya debe estar parseado como array/objeto en readOfflineUsers
                    estado_final: user.estado_final
                };

                const filteredDataToUpdate = Object.fromEntries(
                    Object.entries(dataToUpdate).filter(([_, value]) => value !== undefined)
                );

                if (Object.keys(filteredDataToUpdate).length > 0) {
                    const updateResult = await updateUserData(onlineUserId, filteredDataToUpdate);

                    if (updateResult.success) {
                        console.log(`Datos adicionales del usuario "${user.usuarioNombre}" actualizados exitosamente.`);
                    } else {
                        console.warn(`Fallo al actualizar datos adicionales del usuario "${user.usuarioNombre}": ${updateResult.message}`);
                    }
                } else {
                    console.log(`No hay datos adicionales para actualizar para el usuario "${user.usuarioNombre}".`);
                }
            } else {
                console.warn(`Fallo al registrar/cargar usuario "${user.usuarioNombre}" durante la sincronización: ${loginOrRegisterResult.message}`);
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