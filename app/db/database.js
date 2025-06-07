const mysql = require('mysql');
const fs = require('fs');
const { ipcMain } = require('electron');

// Crear conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cronicas'
});

// Cerrar conexión antes de reconectar
function cerrarConexion() {
    if (connection.state !== 'disconnected') {
        connection.end(err => {
            if (err) {
                console.error('Error al cerrar la conexión:', err);
            } else {
                console.log('Conexión a MySQL cerrada correctamente.');
            }
        });
    }
}

// Intentar conectar a MySQL con verificación de estado
function conectarMySQL() {
    if (connection.state !== 'disconnected') {
        console.log('Conexión ya activa, evitando múltiples intentos.');
        return;
    }

    connection.connect(err => {
        if (err) {
            console.error('Error conectando a MySQL:', err);
            mainWindow.send('Modo offline activado: Usando almacenamiento local.'); //Mensaje en terminal de uso de la app sin base de datos

            if (!fs.existsSync('db_local.json')) {
                fs.writeFileSync('db_local.json', JSON.stringify({ usuarios: [] }, null, 2));
            }

            // Enviar evento a la ventana de Electron
            ipcMain.emit('db-offline', 'Base de datos no disponible.');

            // Intentar nuevamente cada 10 segundos
            setTimeout(conectarMySQL, 10000);
            return;
        }
        mainWindow.send('Conectado a MySQL');
        ipcMain.emit('db-online', 'Base de datos disponible.');
        sincronizarBaseDeDatos();
    });
}

// Función para obtener usuarios (desde MySQL o archivo JSON)
function obtenerUsuarios(callback) {
    if (connection.state === 'disconnected') {
        console.log('Base de datos no disponible, cargando datos locales.'); //Mensaje inicial en terminal si no hay base de datos activado
        fs.readFile('db_local.json', 'utf8', (err, data) => {
            if (err) return callback(err, null);
            callback(null, JSON.parse(data).usuarios);
        });
    } else {
        connection.query('SELECT * FROM usuarios', (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }
}

// Función para agregar usuario (en MySQL o almacenamiento local)
function agregarUsuario(usuario, callback) {
    console.log('Estado de conexión MySQL:', connection.state);
    if (connection.state === 'disconnected') {
        mainWindow.view('Base de datos no disponible, guardando usuario localmente.');
        fs.readFile('db_local.json', 'utf8', (err, data) => {
            let dbLocal = JSON.parse(data || '{ "usuarios": [] }');
            dbLocal.usuarios.push(usuario);
            fs.writeFile('db_local.json', JSON.stringify(dbLocal, null, 2), err => {
                if (err) return callback(err);
                callback(null);
            });
        });
    } else {
        connection.query('INSERT INTO usuarios SET ?', usuario, err => {
            if (err) return callback(err);
            callback(null);
        });
    }
}

// Función para sincronizar datos desde `db_local.json` a MySQL
function sincronizarBaseDeDatos() {
    if (!fs.existsSync('db_local.json')) return;

    const data = fs.readFileSync('db_local.json', 'utf8');
    const dbLocal = JSON.parse(data || '{ "usuarios": [] }');

    if (dbLocal.usuarios.length === 0) return;

    dbLocal.usuarios.forEach(usuario => {
        connection.query('INSERT INTO usuarios (nombre) VALUES (?)', [usuario.nombre], err => {
            if (err) {
                console.error('Error insertando usuario:', err);
            } else {
                console.log(`Usuario '${usuario.nombre}' sincronizado con la base de datos.`);
            }
        });
    });

    fs.writeFileSync('db_local.json', JSON.stringify({ usuarios: [] }, null, 2));
    console.log('Datos locales sincronizados y archivo limpiado.');
}

// Monitorear estado de conexión y enviar eventos a la interfaz
function checkDatabaseConnection(mainWindow) {
    if (connection.state === 'disconnected') {
        console.log('Modo offline activado.');
        if (mainWindow) {
            console.log('Enviando evento a usuario.html: Base de datos no disponible.');
            console.log('db-status', 'Base de datos no disponible.');
        }
    } else {
        console.log('Base de datos conectada.');
        if (mainWindow) {
            console.log('Enviando evento a usuario.html: Base de datos disponible.');
            console.log('db-status', 'Base de datos disponible.');
        }
    }
}

// Iniciar conexión cuando arranca la aplicación
conectarMySQL();

module.exports = { obtenerUsuarios, agregarUsuario, cerrarConexion, connection, sincronizarBaseDeDatos, checkDatabaseConnection };