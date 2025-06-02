const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleUserRegistration, syncOfflineData } = require('./servidor/registro');
const { isDatabaseConnected } = require('./db/database');
const { saveUserOffline } = require('./db/offline');

let mainWindow;

//Crea la ventana principal de la aplicación.
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

    // Maneja el evento cuando la ventana está lista para enviar mensajes del ESTADO DE CONEXION A LA BASE DE DATOS
    mainWindow.webContents.on('did-finish-load', async () => {
        const connected = await isDatabaseConnected();
        const statusMessage = connected ? 'Modo ONLINE. Conectado a la base de datos' : 'Modo Offline activo, no se encuentra conectado a la base de datos.';
        // Envía el estado a la ventana de renderizado
        mainWindow.webContents.send('db-status', statusMessage);

        // Si se conecta, intentar sincronizar datos offline
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
// Cuando Electron está listo, crea la ventana.
app.whenReady().then(() => {
    createWindow(); // <--- ¡Esta línea es CRUCIAL!

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Cierra la aplicación cuando todas las ventanas están cerradas, excepto en macOS.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('registrar-usuario', async (event, userData) => {
    try {
        const connected = await isDatabaseConnected();
        const mode = connected ? 'online' : 'offline';
        const result = await handleUserRegistration(userData, mode);

        if (result.success && connected) {
            return {
                sincronizado: true,
                id_usuario: result.user ? result.user.id_usuario : null,
                message: result.message
            };
        } else if (result.success && !connected) {
            return {
                sincronizado: false,
                id_usuario: result.user ? result.user.id_usuario : null,
                message: result.message
            };
        } else {
            return {
                sincronizado: false,
                id_usuario: null,
                message: result.message
            };
        }

    } catch (error) {
        console.error('Error al manejar el registro/carga de usuario:', error);
        return { sincronizado: false, id_usuario: null, message: error.message };
    }
});

ipcMain.handle('guardar-offline-emergency', async (event, userData) => {
    try {
        const result = await saveUserOffline(userData);
        return result;
    } catch (error) {
        console.error('Error al guardar offline de emergencia:', error);
        return { success: false, message: error.message };
    }
});