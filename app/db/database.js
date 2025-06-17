const mysql = require('mysql2/promise');
const path = require('path');
let pool;

//Inicializa la conexión a la base de datos MySQL.
async function initializeDatabase() {
    try {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'root', // ¡CAMBIA ESTO POR TUS CREDENCIALES REALES!
            password: '', // ¡CAMBIA ESTO POR TU CONTRASEÑA REAL!
            database: 'cronicas',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const connection = await pool.getConnection();
        console.log('Conectado a la base de datos MySQL en:', `mysql://localhost:3306/cronicas`);
        connection.release();

        const createTableSql = `
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                selectStory VARCHAR(20) DEFAULT NULL,
                genero VARCHAR(20) DEFAULT NULL,
                usuarioNombre VARCHAR(15) UNIQUE NOT NULL,
                decision MEDIUMTEXT DEFAULT NULL,
                estado_final VARCHAR(20) DEFAULT NULL
            )
        `;

        await pool.query(createTableSql);
        console.log('Tabla "usuario" verificada/creada exitosamente en MySQL.');
        return true;

    } catch (error) {
        console.error('Error al conectar o crear tabla en MySQL:', error.message);
        pool = null;
        return false;
    }
}

//Verifica si la base de datos está conectada e inicia
async function isDatabaseConnected() {
    if (pool) {
        try {
            const connection = await pool.getConnection();
            connection.release();
            return true;
        } catch (error) {
            console.error('El pool de conexiones MySQL no es funcional o la conexión se perdió:', error.message);
            pool = null;
            console.log('Intentando reinicializar la base de datos...');
            return await initializeDatabase();
        }
    }
    console.log('La base de datos MySQL no está conectada. Intentando inicializar...');
    return await initializeDatabase();
}

//Registra o carga un perfil de usuario en la base de datos MySQL.
async function handleUserLoginOrRegisterOnline(userData) {
    const { usuarioNombre } = userData;
    const connected = await isDatabaseConnected();

    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL.', user: null };
    }

    try {
        const [rows] = await pool.query('SELECT * FROM usuario WHERE usuarioNombre = ?', [usuarioNombre]);

        if (rows.length > 0) {
            const user = rows[0];
            try {
                user.decision = user.decision ? JSON.parse(user.decision) : [];
                if (!Array.isArray(user.decision)) {
                    console.warn(`Database: Decisión para usuario ${user.usuarioNombre} no es un array después de parsear, inicializando.`);
                    user.decision = [];
                }
            } catch (parseError) {
                console.error(`Database: Error al parsear decisión JSON para usuario ${user.usuarioNombre}:`, parseError.message);
                user.decision = [];
            }
            console.log(`Database: Usuario "${usuarioNombre}" cargado exitosamente de MySQL.`);
            return { success: true, message: 'Usuario cargado exitosamente.', user: user };
        } else {
            const insertSql = `
                INSERT INTO usuario (usuarioNombre, selectStory, genero, decision, estado_final)
                VALUES (?, ?, ?, ?, ?)
            `;
            const initialDecision = JSON.stringify([]);
            const [result] = await pool.query(
                insertSql,
                [
                    usuarioNombre,
                    userData.selectStory || null,
                    userData.genero || null,
                    initialDecision,
                    userData.estado_final || null
                ]
            );
            console.log(`Database: Nuevo usuario "${usuarioNombre}" registrado en MySQL con ID: ${result.insertId}`);
            return {
                success: true,
                message: 'Usuario registrado exitosamente.',
                user: {
                    id_usuario: result.insertId,
                    usuarioNombre: usuarioNombre,
                    selectStory: userData.selectStory || null,
                    genero: userData.genero || null,
                    decision: [],
                    estado_final: userData.estado_final || null
                }
            };
        }
    } catch (error) {
        console.error('Database: Error al manejar el registro/carga de usuario en MySQL:', error.message);
        return { success: false, message: 'Error al procesar usuario en MySQL: ' + error.message, user: null };
    }
}

//Método para actualizar datos de usuario en MySQL.
async function updateUserData(id_usuario, dataToUpdate) {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL para actualizar.' };
    }

    try {
        let fields = [];
        let values = [];
        for (const key in dataToUpdate) {
            if (dataToUpdate.hasOwnProperty(key) && key !== 'id_usuario') {
                if (key === 'decision') {
                    if (Array.isArray(dataToUpdate[key])) {
                        fields.push(`${key} = ?`);
                        values.push(JSON.stringify(dataToUpdate[key]));
                    } else if (dataToUpdate[key] === null || dataToUpdate[key] === undefined) {
                        fields.push(`${key} = ?`);
                        values.push(JSON.stringify([]));
                    } else {
                        fields.push(`${key} = ?`);
                        values.push(dataToUpdate[key]);
                    }
                } else {
                    fields.push(`${key} = ?`);
                    values.push(dataToUpdate[key]);
                }
            }
        }
        values.push(id_usuario);

        if (fields.length === 0) {
            return { success: false, message: 'No hay datos para actualizar.' };
        }

        const query = `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`;
        const [result] = await pool.query(query, values);

        if (result.affectedRows > 0) {
            console.log(`Database: Usuario con ID ${id_usuario} actualizado exitosamente en MySQL.`);
            return { success: true, message: 'Usuario actualizado exitosamente.' };
        } else {
            console.warn(`Database: Usuario con ID ${id_usuario} no encontrado o no se realizaron cambios en MySQL.`);
            return { success: false, message: 'Usuario no encontrado o no se realizaron cambios.' };
        }
    } catch (error) {
        console.error('Database: Error al actualizar usuario en MySQL:', error.message);
        return { success: false, message: 'Error al actualizar usuario en MySQL: ' + error.message };
    }
}

//Añade una nueva decisión al array de decisiones de un usuario online.
async function appendDecisionOnline(id_usuario, newDecisionText) {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL para añadir decisión.' };
    }

    try {
        const [rows] = await pool.query('SELECT decision FROM usuario WHERE id_usuario = ?', [id_usuario]);
        if (rows.length === 0) {
            return { success: false, message: 'Usuario no encontrado para añadir decisión.' };
        }
        let currentDecisions = [];
        const storedDecision = rows[0].decision;

        if (storedDecision) {
            try {
                currentDecisions = JSON.parse(storedDecision);
                if (!Array.isArray(currentDecisions)) {
                    console.warn(`Database: Decisión almacenada para usuario ${id_usuario} no es un array, inicializando.`);
                    currentDecisions = [];
                }
            } catch (parseError) {
                console.error(`Database: Error al parsear decisión JSON para usuario ${id_usuario}:`, parseError.message);
                currentDecisions = [];
            }
        }
        currentDecisions.push(newDecisionText);
        const updateResult = await updateUserData(id_usuario, { decision: currentDecisions });
        if (updateResult.success) {
            console.log(`Database: Decisión "${newDecisionText}" añadida para usuario ${id_usuario} en MySQL.`);
            return { success: true, message: 'Decisión añadida exitosamente.' };
        } else {
            return { success: false, message: `Fallo al añadir decisión: ${updateResult.message}` };
        }
    } catch (error) {
        console.error('Database: Error al añadir decisión en MySQL:', error.message);
        return { success: false, message: 'Error interno al añadir decisión en MySQL: ' + error.message };
    }
}

//Actualiza el estado final de un usuario en la base de datos.
async function updateUserStatus(id_usuario, estado) {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL para actualizar el estado.' };
    }

    try {
        const result = await updateUserData(id_usuario, { estado_final: estado });
        if (result.success) {
            console.log(`Database: Estado final de usuario ${id_usuario} actualizado a "${estado}".`);
        } else {
            console.warn(`Database: Fallo al actualizar estado final de usuario ${id_usuario}: ${result.message}`);
        }
        return result;
    } catch (error) {
        console.error('Database: Error al actualizar el estado final del usuario en MySQL:', error.message);
        return { success: false, message: 'Error interno al actualizar el estado final: ' + error.message };
    }
}

//Obtiene todos los datos de un usuario por su ID desde la base de datos online.
async function getUserDataOnline(id_usuario) {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL para obtener datos de usuario.' };
    }

    try {
        console.log(`Database: Buscando usuario con ID ${id_usuario} en MySQL.`);
        const [rows] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [id_usuario]);

        if (rows.length > 0) {
            const user = rows[0];
            try {
                user.decision = user.decision ? JSON.parse(user.decision) : [];
                if (!Array.isArray(user.decision)) {
                    console.warn(`Database: Decisión para usuario ${id_usuario} no es un array después de parsear, inicializando.`);
                    user.decision = [];
                }
            } catch (parseError) {
                console.error(`Database: Error al parsear decisión JSON para usuario ${id_usuario}:`, parseError.message);
                user.decision = [];
            }
            console.log(`Database: Datos de usuario ${id_usuario} obtenidos exitosamente online.`);
            return { success: true, message: 'Datos de usuario obtenidos exitosamente.', user: user };
        } else {
            console.warn(`Database: Usuario con ID ${id_usuario} no encontrado en MySQL.`);
            return { success: false, message: 'Usuario no encontrado.' };
        }
    } catch (error) {
        console.error('Database: Error al obtener datos de usuario desde MySQL:', error.message);
        return { success: false, message: 'Error al obtener datos de usuario: ' + error.message };
    }
}

//Actualiza la raza (selectStory) y el género (genero) de un usuario online.
async function updateUserPreferencesOnline(userId, selectStory, genero) {
    const connected = await isDatabaseConnected();
    if (!connected) {
        return { success: false, message: 'No hay conexión a la base de datos MySQL para actualizar preferencias.' };
    }
    try {
        const result = await updateUserData(userId, { selectStory: selectStory, genero: genero });
        if (result.success) {
            console.log(`Database: Preferencias (raza: ${selectStory}, genero: ${genero}) actualizadas para usuario ${userId}.`);
        } else {
            console.warn(`Database: Fallo al actualizar preferencias para usuario ${userId}: ${result.message}`);
        }
        return result;
    } catch (error) {
        console.error('Database: Error al actualizar preferencias de usuario en MySQL:', error.message);
        return { success: false, message: 'Error interno al actualizar preferencias: ' + error.message };
    }
}
module.exports = {
    initializeDatabase,
    isDatabaseConnected,
    handleUserLoginOrRegisterOnline,
    updateUserData,
    appendDecisionOnline,
    updateUserStatus,
    getUserDataOnline,
    updateUserPreferencesOnline
};
