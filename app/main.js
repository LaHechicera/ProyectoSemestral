const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow(file) {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 530,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
    }
  });

  mainWindow.loadFile(file);

    ipcMain.on('navigate', (event, page) => {
        console.log('Navigating to page: ', page);
        mainWindow.loadFile(page).catch(err => {
            console.error('Error al cargar la pagina ${page}:', err);
        });
    });
}

app.whenReady().then(() => {
  createWindow('index.html');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow('index.html');
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

//Cerrar conexion de BD
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
//Generar tabla en la BD
const { crearTablaSiNoExiste, registrarDecision } = require('./servidor/registro');
crearTablaSiNoExiste();
registrarDecision();