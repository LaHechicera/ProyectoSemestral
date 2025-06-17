const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDBStatus: (callback) => {
        ipcRenderer.on('db-status', (event, message) => callback(message));
    }
});

contextBridge.exposeInMainWorld('api', {
    registrarUsuario: (userData) => ipcRenderer.invoke('registrar-usuario', userData),
    guardarOfflineEmergency: (userData) => ipcRenderer.invoke('guardar-offline-emergency', userData),
    saveStoryDecision: (userId, decisionText) => ipcRenderer.invoke('save-story-decision', userId, decisionText),
    updateUserStatus: (userId, status) => ipcRenderer.invoke('update-user-status', userId, status),
    fetchUserData: (userId) => ipcRenderer.invoke('fetch-user-data', userId),
    updateUserPreferences: (userId, selectStory, genero) => ipcRenderer.invoke('update-user-preferences', userId, selectStory, genero)
});