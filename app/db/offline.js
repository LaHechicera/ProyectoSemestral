const fs = require('fs/promises');
const path = require('path');

const OFFLINE_DB_PATH = path.join(__dirname, '..', 'db_local.json');

//Lee los usuarios almacenados en el archivo db_local.json.
async function readOfflineUsers() {
    try {
        const data = await fs.readFile(OFFLINE_DB_PATH, 'utf8');
        const users = JSON.parse(data);
        return users.map(user => {
            let parsedDecision = [];
            if (typeof user.decision === 'string') {
                try {
                    const temp = JSON.parse(user.decision);
                    if (Array.isArray(temp)) {
                        parsedDecision = temp;
                    }
                } catch (e) {
                    // Si hay un error de lectura, se mantiene como array vacío
                }
            }
            user.decision = parsedDecision;
            return user;
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Archivo no encontrado
        }
        return []; 
    }
}

//Guarda un nuevo usuario o actualiza uno existente en el archivo db_local.json.
async function saveUserOffline(userData) {
    try {
        let users = await readOfflineUsers(); 

        const existingUserIndex = users.findIndex(user => user.id_usuario === userData.id_usuario || user.usuarioNombre === userData.usuarioNombre);
        
        let userToSave = {}; // Objeto que contendrá los datos finales a guardar
        if (existingUserIndex > -1) {
            const existingUser = users[existingUserIndex]; // Usuario existente del archivo

            userToSave = {
                ...existingUser,
                ...userData,
                decision: (Array.isArray(userData.decision) && userData.decision.length > 0)
                            ? userData.decision // Usar las decisiones nuevas si son un array no vacío
                            : (Array.isArray(existingUser.decision) ? existingUser.decision : []) // Usar las existentes si las nuevas son vacías/nulas
            };

            // Asegurar que el id_usuario existe, incluso para usuarios antiguos sin él
            if (!userToSave.id_usuario) {
                userToSave.id_usuario = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            users[existingUserIndex] = userToSave; // Actualiza el usuario en el array
        } else {
            // Este es un nuevo usuario, asigna un ID offline si no viene uno ya
            const newOfflineId = userData.id_usuario || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            userToSave = { ...userData, id_usuario: newOfflineId };
            // Asegura que la decisión sea un array vacío si no se proporciona
            if (!Array.isArray(userToSave.decision)) {
                userToSave.decision = [];
            }
            users.push(userToSave); // Añade el nuevo usuario al array
        }

        // Convertir el array de decisiones a string JSON ANTES de escribir al archivo
        const usersToWrite = users.map(user => ({
            ...user,
            decision: JSON.stringify(user.decision)
        }));

        await fs.writeFile(OFFLINE_DB_PATH, JSON.stringify(usersToWrite, null, 2), 'utf8');
        let savedUser = users.find(u => u.id_usuario === userToSave.id_usuario);
        return { success: true, message: 'Usuario guardado/actualizado offline exitosamente.', user: savedUser };
    } catch (error) {
        return { success: false, message: 'Error al guardar usuario offline: ' + error.message, user: null };
    }
}

//Elimina el archivo db_local.json.
async function deleteOfflineFile() {
    try {
        await fs.unlink(OFFLINE_DB_PATH);
        return { success: true, message: 'Archivo offline eliminado.' };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { success: true, message: 'El archivo offline ya no existe.' };
        }
        throw new Error('No se pudo eliminar el archivo offline: ' + error.message);
    }
}

//Añade una nueva decisión al array de decisiones de un usuario offline.
async function appendDecisionOffline(userId, newDecisionText) {
    try {
        let users = await readOfflineUsers();
        const userIndex = users.findIndex(user => user.id_usuario === userId);

        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado offline para añadir decisión.' };
        }

        let user = users[userIndex];
        if (!Array.isArray(user.decision)) {
            user.decision = []; // Asegura que es un array antes de hacer push
        }
        user.decision.push(newDecisionText);

        const saveResult = await saveUserOffline(user);
        if (saveResult.success) {
            return { success: true, message: 'Decisión añadida exitosamente.' };
        }
        return saveResult;
    } catch (error) {
        return { success: false, message: 'Error interno al añadir decisión offline: ' + error.message };
    }
}

//Obtiene todos los datos de un usuario por su ID desde el archivo db_local.json.
async function getUserDataOffline(userId) {
    try {
        const users = await readOfflineUsers();
        const user = users.find(u => u.id_usuario === userId);

        if (user) {
            return { success: true, message: 'Datos de usuario obtenidos exitosamente.', user: user };
        } else {
            return { success: false, message: 'Usuario no encontrado offline.' };
        }
    } catch (error) {
        return { success: false, message: 'Error al obtener datos de usuario offline: ' + error.message };
    }
}

//Actualiza la raza (selectStory) y el género (genero) de un usuario offline.
async function updateUserPreferencesOffline(userId, selectStory, genero) {
    try {
        let users = await readOfflineUsers();
        const userIndex = users.findIndex(user => user.id_usuario === userId);

        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado offline para actualizar preferencias.' };
        }

        users[userIndex].selectStory = selectStory;
        users[userIndex].genero = genero;

        const saveResult = await saveUserOffline(users[userIndex]);

        if (saveResult.success) {
            return { success: true, message: 'Preferencias actualizadas para usuario offline.' };
        }
        return saveResult;
    } catch (error) {
        return { success: false, message: 'Error interno al actualizar preferencias offline: ' + error.message };
    }
}
module.exports = {
    readOfflineUsers,
    saveUserOffline,
    deleteOfflineFile,
    appendDecisionOffline,
    getUserDataOffline,
    updateUserPreferencesOffline
};
