const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDBStatus: (callback) => {
        ipcRenderer.on('db-status', (event, message) => {
            console.log('Evento recibido en preload.js:', message); // Confirmación en consola
            callback(message);
        });
    }
});