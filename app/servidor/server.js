const express = require('express');
const connection = require('../db/database');

const app = express();
app.use(express.json());

app.post('/guardar-decision', (req, res) => {
    const { usuario_id, decision, ubicacion } = req.body;

    const query = 'INSERT INTO decisiones (usuario_id, decision, ubicacion) VALUES (?, ?, ?)';
    connection.query(query, [usuario_id, decision, ubicacion], (err, results) => {
        if (err) {
            console.error('Error al guardar decisión:', err);
            res.status(500).send('Error en el servidor');
        } else {
            console.log('Decisión guardada con ID:', results.insertId);
            res.send('Decisión guardada');
        }
    });
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));