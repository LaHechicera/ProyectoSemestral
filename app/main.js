const { app, BrowserWindow, ipcMain, screen } = require('electron'); // Agregué 'screen' por si acaso, aunque no lo uses directamente ahora
const path = require('path');
const { handleUserRegistration, syncOfflineData } = require('./servidor/registro');
const { isDatabaseConnected, updateUserData, appendDecisionOnline, updateUserStatus, getUserDataOnline, updateUserPreferencesOnline } = require('./db/database');
const { saveUserOffline, readOfflineUsers, appendDecisionOffline, getUserDataOffline, updateUserPreferencesOffline } = require('./db/offline');

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

    // Evento de la página HTML al terminar de cargar
    mainWindow.webContents.on('did-finish-load', async () => {
        const connected = await isDatabaseConnected();
        const statusMessage = connected ? 'Conectado a la base de datos. Modo Online activo.' : 'No se pudo conectar a la base de datos. Modo Offline activo.';
        mainWindow.webContents.send('db-status', statusMessage);

        if (connected) {
            const syncResult = await syncOfflineData();
        }
    });

    // --- Manejadores de IPC para los botones de la barra de título ---
    ipcMain.on('restart-app', () => {
        console.log('Reiniciando aplicación...');
        app.relaunch(); // Reinicia la aplicación
        app.quit();     // Cierra la instancia actual
    });

    ipcMain.on('quit-app', () => {
        console.log('Cerrando aplicación...');
        app.quit(); // Cierra la aplicación
    });

    ipcMain.on('minimize-window', () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });

    ipcMain.on('maximize-restore-window', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.on('close-window', () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });
    // --- Fin de Manejadores de IPC para los botones de la barra de título ---
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Manejo de IPC Main (resto de tu código existente, sin cambios)
ipcMain.handle('registrar-usuario', async (event, userData) => {
    try {
        const result = await handleUserRegistration(userData, 'online');
        return result;
    } catch (error) {
        return { success: false, sincronizado: false, id_usuario: null, message: error.message };
    }
});

ipcMain.handle('guardar-offline-emergency', async (event, userData) => {
    try {
        const result = await saveUserOffline(userData);
        return result;
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('save-story-decision', async (event, userId, decisionText) => {
    try {
        if (!userId) { return { success: false, message: 'ID de usuario no proporcionado para guardar decisión.' }; }
        if (!decisionText) { return { success: false, message: 'Texto de decisión vacío para guardar decisión.' }; }

        const connected = await isDatabaseConnected();
        let result = { success: false, message: 'Operación no realizada.' };

        if (connected) {
            if (typeof appendDecisionOnline === 'function') {
                result = await appendDecisionOnline(userId, decisionText);
                if (result.success) { return result; }
            } else {
                result.message = 'Función de añadir decisión online no disponible.';
            }
        } else {
            result.message = 'Base de datos no conectada para guardar online.';
        }

        if (!result.success) {
            try {
                if (typeof appendDecisionOffline === 'function') {
                    const offlineResult = await appendDecisionOffline(userId, decisionText);
                    return offlineResult;
                } else {
                    return { success: false, message: 'Función de añadir decisión offline no disponible.' };
                }
            } catch (offlineError) {
                return { success: false, message: 'Error interno al guardar la decisión offline.' };
            }
        }
        return result;
    } catch (error) {
        return { success: false, message: 'Error interno al procesar la decisión: ' + error.message };
    }
});

ipcMain.handle('update-user-status', async (event, userId, status) => {
    try {
        if (!userId || !status) { return { success: false, message: 'ID de usuario o estado no proporcionado.' }; }
        const connected = await isDatabaseConnected();
        let result;

        if (connected) {
            if (typeof updateUserStatus === 'function') {
                result = await updateUserStatus(userId, status);
                if (result.success) { return result; }
            } else {
                result = { success: false, message: 'Función de actualización de estado online no disponible.' };
            }
        } else {
            result = { success: false, message: 'Base de datos no conectada para actualizar online.' };
        }

        if (!result.success) {
            try {
                if (typeof readOfflineUsers === 'function' && typeof saveUserOffline === 'function') {
                    const offlineUsers = await readOfflineUsers();
                    const userIndex = offlineUsers.findIndex(u => u.id_usuario === userId);
                    if (userIndex > -1) {
                        offlineUsers[userIndex].estado_final = status;
                        const saveResult = await saveUserOffline(offlineUsers[userIndex]);
                        if (saveResult.success) { return { success: true, message: 'Estado actualizado offline.' }; }
                        else { return { success: false, message: `Fallo al actualizar estado: ${saveResult.message}` }; }
                    } else {
                        return { success: false, message: 'Usuario no encontrado offline para actualizar estado.' };
                    }
                } else {
                    return { success: false, message: 'Funcionalidad offline de actualización de estado no disponible.' };
                }
            } catch (offlineError) {
                return { success: false, message: 'Error interno al actualizar estado offline.' };
            }
        }
        return result;
    } catch (error) {
        return { success: false, message: 'Error interno al actualizar el estado: ' + error.message };
    }
});

ipcMain.handle('fetch-user-data', async (event, userId) => {
    try {
        if (!userId) { return { success: false, message: 'ID de usuario no proporcionado para obtener datos.' }; }

        const connected = await isDatabaseConnected();
        let userResult = { user: null, success: false, message: 'No se encontraron datos.' };

        if (connected) {
            if (typeof getUserDataOnline === 'function') {
                userResult = await getUserDataOnline(userId);
                if (userResult.success) { return userResult; }
            } else {
                userResult.message = 'Función de obtener datos online no disponible.';
            }
        } else {
            userResult.message = 'Base de datos no conectada para obtener datos online.';
        }

        if (!userResult.success) {
            try {
                if (typeof getUserDataOffline === 'function') {
                    const offlineResult = await getUserDataOffline(userId);
                    return offlineResult;
                } else {
                    return { success: false, message: 'Función de obtener datos offline no disponible.' };
                }
            } catch (offlineError) {
                return { success: false, message: 'Error interno al obtener datos offline.' };
            }
        }
        return userResult;
    } catch (error) {
        return { success: false, message: 'Error interno al obtener datos: ' + error.message };
    }
});

//IPC para actualizar la raza y el género del usuario
ipcMain.handle('update-user-preferences', async (event, userId, selectStory, genero) => {
    try {
        if (!userId || !selectStory || !genero) {
            return { success: false, message: 'Datos incompletos para actualizar preferencias.' };
        }

        const connected = await isDatabaseConnected();
        let result;

        if (connected) {
            if (typeof updateUserPreferencesOnline === 'function') {
                result = await updateUserPreferencesOnline(userId, selectStory, genero);
                if (result.success) { return result; }
            } else {
                result = { success: false, message: 'Función de actualización de preferencias online no disponible.' };
            }
        } else {
            result = { success: false, message: 'Base de datos no conectada para actualizar preferencias online.' };
        }

        if (!result.success) { // Si el online falló, intenta offline
            try {
                if (typeof updateUserPreferencesOffline === 'function') {
                    const offlineResult = await updateUserPreferencesOffline(userId, selectStory, genero);
                    return offlineResult;
                } else {
                    return { success: false, message: 'Función de actualización de preferencias offline no disponible.' };
                }
            } catch (offlineError) {
                return { success: false, message: 'Error interno al actualizar preferencias offline.' };
            }
        }
        return result;
    } catch (error) {
        return { success: false, message: 'Error general al actualizar preferencias: ' + error.message };
    }
});