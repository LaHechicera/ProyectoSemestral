// preload.js (Asegúrate de que este sea el contenido)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDBStatus: (callback) => ipcRenderer.on('db-status', (event, message) => callback(message))
});

contextBridge.exposeInMainWorld('api', {
    registrarUsuario: (userData) => ipcRenderer.invoke('registrar-usuario', userData),
    guardarOfflineEmergency: (userData) => ipcRenderer.invoke('guardar-offline-emergency')
});

// Exponemos una nueva API para los controles de la ventana
contextBridge.exposeInMainWorld('electronAPI', {
    // Nuevas funciones para los botones personalizados
    restartApp: () => ipcRenderer.send('restart-app'),
    quitApp: () => ipcRenderer.send('quit-app')
});