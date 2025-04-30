const connection = require('../db/database');

function crearTablaSiNoExiste() {
    const query = `CREATE TABLE IF NOT EXISTS decisiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        decision TEXT NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ubicacion VARCHAR(255),
        tiempo_lectura INT
    );`;

    connection.query(query, (err, result) => {
        if (err) {
            console.error('Error al crear la tabla:', err);
        } else {
            console.log('Tabla "decisiones" lista.');
        }
    });
}

function guardarDecision(usuarioId, decision, ubicacion, tiempoJuego) {
    const query = 'INSERT INTO decisiones (usuario_id, decision, ubicacion, tiempo_juego) VALUES (?, ?, ?, ?)';
    connection.query(query, [usuarioId, decision, ubicacion, tiempoJuego], (err, results) => {
        if (err) {
            console.error('Error al guardar decisión:', err);
        } else {
            console.log('Decisión guardada con ID:', results.insertId);
        }
    });
}

module.exports = { crearTablaSiNoExiste, guardarDecision };