const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDBStatus: (callback) => ipcRenderer.on('db-status', (event, message) => callback(message))
});

contextBridge.exposeInMainWorld('api', {
    registrarUsuario: (userData) => ipcRenderer.invoke('registrar-usuario', userData),
    guardarOfflineEmergency: (userData) => ipcRenderer.invoke('guardar-offline-emergency')
});