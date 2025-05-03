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

// Función para guardar decisión y luego redirigir
function registrarDecision(usuarioId, decision, url) {
    console.log("Guardando decisión:", decision);

    const ubicacion = "Historia1Hombre"; // Puedes ajustarlo según la página
    const tiempoJuego = Date.now(); // Marca de tiempo

    const query = 'INSERT INTO decisiones (usuario_id, decision, ubicacion, tiempo_lectura) VALUES (?, ?, ?, ?)';

    connection.query(query, [usuarioId, decision, ubicacion, tiempoJuego], (err, results) => {
        if (err) {
            console.error('Error al guardar decisión:', err);
        } else {
            console.log('Decisión guardada con ID:', results.insertId);

            // Aquí puedes confirmar que la redirección realmente se ejecuta
            console.log("Redirigiendo a:", url);
            window.location.href = url;
        }
    });
}

module.exports = { crearTablaSiNoExiste, registrarDecision };