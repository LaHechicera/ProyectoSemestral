const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDBStatus: (callback) => {
        ipcRenderer.on('db-status', (event, message) => callback(message));
    }
});

contextBridge.exposeInMainWorld('api', {
    registrarUsuario: (userData) => ipcRenderer.invoke('registrar-usuario', userData),
    guardarOfflineEmergency: (userData) => ipcRenderer.invoke('guardar-offline-emergency')
});

// Aquí exponemos los controles de la ventana y los botones personalizados
contextBridge.exposeInMainWorld('electronAPI', {
    // Controles de ventana
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeRestoreWindow: () => ipcRenderer.send('maximize-restore-window'),
    closeWindow: () => ipcRenderer.send('close-window'), // Aunque no tengas el botón, la función existe
    doubleClickTitlebar: () => ipcRenderer.send('double-click-titlebar'),
    // Botones de aplicación personalizados
    restartApp: () => ipcRenderer.send('restart-app'),
    quitApp: () => ipcRenderer.send('quit-app'), // Este es el que usa tu botón de salida 'X'
    // Función para guardar decisión (usada por selectStory)
    guardarDecision: (data) => ipcRenderer.send('guardar-decision', data) // ¡Nuevo!
 }
);

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