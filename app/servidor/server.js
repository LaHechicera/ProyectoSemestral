const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { registrarUsuario } = require('./registro');
const { obtenerUsuarios } = require('../db/database'); // Importar función

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Verificar estado de la base de datos al iniciar el servidor
obtenerUsuarios((err, usuarios) => {
    if (err) {
        console.log('Modo offline activado: La aplicación funcionará sin conexión a MySQL.');
    } else {
        console.log('Base de datos activa.');
    }
});

app.post('/registrar-usuario', (req, res) => {
    const { nombre } = req.body;
    if (!nombre || !/^[a-zA-Z0-9_ ]+$/.test(nombre)) {
        return res.status(400).json({ mensaje: 'Nombre inválido.' });
    }

    registrarUsuario(nombre, (err, usuarioId) => {
        if (err) {
            res.status(500).json({ mensaje: 'Error al registrar usuario.' });
        } else {
            res.json({ mensaje: `Usuario registrado: ${usuarioId}`, usuarioId });
        }
    });
});

app.get('/usuarios', (req, res) => {
    obtenerUsuarios((err, usuarios) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener usuarios.' });
        res.json(usuarios);
    });
});

module.exports = app;