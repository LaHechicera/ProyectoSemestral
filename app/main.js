const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleUserRegistration, syncOfflineData } = require('./servidor/registro');
const { isDatabaseConnected, updateUserData } = require('./db/database'); // Se necesita updateUserData para guardar decisiones online
const { saveUserOffline, readOfflineUsers } = require('./db/offline'); // Se necesitan ambas para el manejo offline
//
if (typeof updateUserData === 'function') {
    console.log('Main: La función updateUserData ha sido importada correctamente.');
} else {
    console.error('Main: ADVERTENCIA CRÍTICA - La función updateUserData NO ha sido importada o no es una función. Las actualizaciones de DB online podrían fallar.');
}
if (typeof readOfflineUsers === 'function') {
    console.log('Main: La función readOfflineUsers ha sido importada correctamente.');
} else {
    console.error('Main: ADVERTENCIA CRÍTICA - La función readOfflineUsers NO ha sido importada o no es una función. El guardado/sincronización offline podría fallar.');
}
//
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        frame: false, // ¡IMPORTANTE! Esto elimina el marco nativo de la ventana
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.on('did-finish-load', async () => {
        console.log('Main: Contenido de la ventana principal cargado. Verificando conexión a DB...');
        const connected = await isDatabaseConnected();
        const statusMessage = connected ? 'Conectado a la base de datos. Modo Online activo.' : 'No se pudo conectar a la base de datos. Modo Offline activo.';

        mainWindow.webContents.send('db-status', statusMessage);
        console.log(`Main: Estado de DB enviado al renderizador: "${statusMessage}"`);

        if (connected) {
            console.log('Main: DB conectada. Iniciando sincronización de datos offline...');
            const syncResult = await syncOfflineData();
            if (syncResult.success) {
                console.log('Main: Sincronización inicial completa:', syncResult.message);
            } else {
                console.warn('Main: Sincronización inicial fallida:', syncResult.message);
            }
        }
    });
}

app.whenReady().then(() => {
    console.log('Main: Aplicación Electron lista. Creando ventana principal...');
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            console.log('Main: Evento "activate" en macOS. Recreando ventana...');
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log('Main: Todas las ventanas cerradas. Saliendo de la aplicación...');
        app.quit();
    }
});

// Manejadores de Comunicación IPC Main

ipcMain.handle('registrar-usuario', async (event, userData) => {
    console.log('Main: Recibida solicitud IPC "registrar-usuario" con userData:', userData.usuarioNombre);
    try {
        const result = await handleUserRegistration(userData, 'online');
        console.log('Main: Resultado de handleUserRegistration:', result);
        return result;
    } catch (error) {
        console.error('Main: Error en ipcMain "registrar-usuario":', error);
        return { success: false, sincronizado: false, id_usuario: null, message: error.message };
    }
});

ipcMain.handle('guardar-offline-emergency', async (event, userData) => {
    console.log('Main: Recibida solicitud IPC "guardar-offline-emergency" con userData:', userData.usuarioNombre);
    try {
        const result = await saveUserOffline(userData);
        console.log('Main: Resultado de guardar-offline-emergency:', result);
        return result;
    } catch (error) {
        console.error('Main: Error en ipcMain "guardar-offline-emergency":', error);
        return { success: false, message: error.message };
    }
});

//Manejador IPC para guardar el texto de la decisión del usuario.
ipcMain.handle('save-story-decision', async (event, userId, decisionText) => {
    console.log(`Main: Recibida solicitud IPC "save-story-decision" para userId: ${userId}, Decisión: "${decisionText}"`);
    try {
        if (!userId) {
            return { success: false, message: 'ID de usuario no proporcionado para guardar decisión.' };
        }
        if (!decisionText) {
            return { success: false, message: 'Texto de decisión vacío para guardar decisión.' };
        }

        const connected = await isDatabaseConnected();
        let onlineSaveAttemptResult = { success: false, message: 'No se intentó guardar online.' }; // Resultado del intento de guardado online

        if (connected) {
            // Intenta guardar la decisión online SOLO si updateUserData es una función válida
            if (typeof updateUserData === 'function') {
                onlineSaveAttemptResult = await updateUserData(userId, { decision: decisionText });
                if (onlineSaveAttemptResult.success) {
                    console.log(`Main: Decisión guardada online para usuario ${userId}.`);
                } else {
                    console.warn(`Main: Fallo al guardar decisión online para usuario ${userId}: ${onlineSaveAttemptResult.message}.`);
                }
            } else {
                console.error('Main: updateUserData no es una función. No se puede guardar online. Se forzará el guardado offline.');
                onlineSaveAttemptResult.message = 'Función de actualización de DB online no disponible.';
            }
        } else {
            console.warn('Main: DB no conectada. Se forzará el guardado offline.');
            onlineSaveAttemptResult.message = 'Base de datos no conectada para guardar online.';
        }

        // Si el guardado online NO fue exitoso, o si no había conexión, intentar guardar offline
        if (!onlineSaveAttemptResult.success) {
            try {
                if (typeof readOfflineUsers !== 'function') {
                    console.error('Main: FATAL ERROR - readOfflineUsers no es una función, no se puede guardar la decisión offline.');
                    return { success: false, message: 'Función de lectura offline no disponible.' };
                }

                const offlineUsers = await readOfflineUsers();
                const userIndex = offlineUsers.findIndex(u => u.id_usuario === userId);

                if (userIndex > -1) {
                    // Actualizar la decisión del usuario existente offline
                    offlineUsers[userIndex].decision = decisionText;
                    // saveUserOffline se encarga de escribir el array completo de vuelta al archivo
                    const saveResult = await saveUserOffline(offlineUsers[userIndex]);
                    if (saveResult.success) {
                        console.log(`Main: Decisión guardada offline para usuario ${userId}.`);
                        return { success: true, message: 'Decisión guardada offline.' };
                    } else {
                        console.error(`Main: Error al guardar decisión offline para usuario ${userId}: ${saveResult.message}`);
                        return { success: false, message: `Fallo al guardar decisión: ${saveResult.message}` };
                    }
                } else {
                    console.warn(`Main: Usuario ${userId} no encontrado en datos offline. No se pudo guardar la decisión offline.`);

                    return { success: false, message: 'Usuario no encontrado offline para guardar decisión.' };
                }
            } catch (offlineError) {
                console.error(`Main: Error crítico al manejar guardado de decisión offline:`, offlineError);
                return { success: false, message: 'Error interno al guardar la decisión offline.' };
            }
        }
        return onlineSaveAttemptResult; // Devuelve el resultado del guardado online si fue exitoso
    } catch (error) {
        console.error('Main: Error al manejar "save-story-decision":', error);
        return { success: false, message: 'Error interno al procesar la decisión: ' + error.message };
    }
});