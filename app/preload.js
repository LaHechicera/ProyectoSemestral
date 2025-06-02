// preload.js (Asegúrate de que este sea el contenido)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Escucha eventos de estado de la DB desde el proceso principal
    onDBStatus: (callback) => ipcRenderer.on('db-status', (event, message) => callback(message))
});

contextBridge.exposeInMainWorld('api', {
    // Envía la solicitud de registro/carga de usuario al proceso principal
    registrarUsuario: (userData) => ipcRenderer.invoke('registrar-usuario', userData),
    // Un método para guardar datos offline en caso de emergencia si la BD falla
    guardarOfflineEmergency: (userData) => ipcRenderer.invoke('guardar-offline-emergency')
});