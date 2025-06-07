const { agregarUsuario, obtenerUsuarios } = require('../db/database'); // Importar funciones mejoradas

function registrarUsuario(nombre, callback) {
    const usuario = { nombre };

    agregarUsuario(usuario, (err) => {
        if (err) {
            console.error('Error registrando usuario:', err);
            return callback(err, null);
        }
        console.log('Usuario registrado:', nombre);
        callback(null, usuario.nombre); // Devuelve el nombre del usuario (en lugar del ID)
    });
}

function guardarDecision(usuarioId, decision, tiempoJuego, opciones) {
    const decisionData = { usuarioId, decision, tiempoJuego, opciones };

    agregarUsuario(decisionData, (err) => {  // Se usa la misma lógica de almacenamiento
        if (err) {
            console.error('Error guardando decisión:', err);
        } else {
            console.log('Decisión guardada para el usuario:', usuarioId);
        }
    });
}

module.exports = { registrarUsuario, guardarDecision };