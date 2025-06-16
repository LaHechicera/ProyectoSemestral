const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDBStatus: (callback) => {
        ipcRenderer.on('db-status', (event, message) => callback(message));
    }
});

contextBridge.exposeInMainWorld('api', {
    registrarUsuario: (userData) => {
        return ipcRenderer.invoke('registrar-usuario', userData);
    },
    guardarOfflineEmergency: (userData) => {
        return ipcRenderer.invoke('guardar-offline-emergency', userData);
    },
    saveStoryDecision: (userId, decisionText) => {
        return ipcRenderer.invoke('save-story-decision', userId, decisionText);
    }
});