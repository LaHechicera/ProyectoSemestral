const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { connection, sincronizarBaseDeDatos } = require('./db/database');

// Servidor Express
const expressApp = require('./servidor/server');
expressApp.listen(3000, () => {
  console.log('Servidor Express corriendo en http://localhost:3000');
});

// Crear ventana
let mainWindow;
function createWindow(file) {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(file);

  mainWindow.webContents.once('did-finish-load', () => {
    checkDatabaseConnection(); //Ejecutar la verificación cuando la ventana ya cargó
  });

  return mainWindow;
}

app.whenReady().then(() => {
  mainWindow = createWindow('index.html');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow('index.html');
    }
  });
});

//Enviar eventos de base de datos correctamente
function checkDatabaseConnection() {
  if (!mainWindow) {
    console.error('No hay ventana activa para enviar el evento.');
    return;
  }

  if (connection.state === 'disconnected') {
    console.log('Modo offline activado. Enviando evento...');
    
    ipcMain.emit('db-status', 'Base de datos no disponible.'); //Enviar evento a `preload.js`
    console.log('db-status', 'Base de datos no disponible.'); //Enviar a la ventana
  } else {
    console.log('Base de datos conectada. Enviando evento...');
    
    ipcMain.emit('db-status', 'Base de datos disponible.');
    console.log('db-status', 'Base de datos disponible.');
  }
}