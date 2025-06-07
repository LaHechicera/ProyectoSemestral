const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleUserRegistration, syncOfflineData } = require('./servidor/registro');
const { isDatabaseConnected } = require('./db/database');
const { saveUserOffline } = require('./db/offline'); // Asegúrate de importar saveUserOffline directamente para la emergencia

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('usuario.html');

    mainWindow.webContents.on('did-finish-load', async () => {
        const connected = await isDatabaseConnected();
        const statusMessage = connected ? 'Conectado a la base de datos. Modo Online activo.' : 'No se pudo conectar a la base de datos. Modo Offline activo.';
        mainWindow.webContents.send('db-status', statusMessage);

        if (connected) {
            const syncResult = await syncOfflineData();
            if (syncResult.success) {
                console.log('Sincronización inicial completa:', syncResult.message);
            } else {
                console.warn('Sincronización inicial fallida:', syncResult.message);
            }
        }
    });
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

// --- IPC Main Handlers ---

ipcMain.handle('registrar-usuario', async (event, userData) => {
    try {
        const result = await handleUserRegistration(userData, 'online'); // Asumimos que la intención es online por defecto al usar el formulario
        return result;
    } catch (error) {
        console.error('Error en ipcMain registrar-usuario:', error);
        return { sincronizado: false, id_usuario: null, message: error.message };
    }
});

ipcMain.handle('guardar-offline-emergency', async (event, userData) => {
    // Esta es una llamada directa al guardado offline, usada como fallback desde el frontend
    try {
        const result = await saveUserOffline(userData);
        return result;
    } catch (error) {
        console.error('Error en ipcMain guardar-offline-emergency:', error);
        return { success: false, message: error.message };
    }
});