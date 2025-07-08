const express = require("express");
const router = express.Router();
const conexion = require("../config/conexion");
const link = require("../config/link");
const { validateItem } = require('../validaciones/login');
const { validationResult } = require('express-validator');
const bcrypt = require("bcrypt"); // Importamos bcrypt para comparar las contraseñas


// Obtener eventos del calendario
router.get('/eventos', async (req, res) => {
    try {
        const response = await calendar.events.list({
            calendarId: 'primary', // Cambia si usas otro calendario
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const eventos = response.data.items;
        res.status(200).json(eventos);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).send('Error al obtener eventos');
    }
});

// Crear una nueva cita
router.post('/crear-cita', async (req, res) => {
    const { titulo, descripcion, fechaInicio, fechaFin } = req.body;

    const event = {
        summary: titulo,
        description: descripcion,
        start: {
            dateTime: fechaInicio,
            timeZone: 'America/Lima',
        },
        end: {
            dateTime: fechaFin,
            timeZone: 'America/Lima',
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary', // Cambia si usas otro calendario
            resource: event,
        });

        res.status(200).json({ message: 'Cita creada', link: response.data.htmlLink });
    } catch (error) {
        console.error('Error al crear la cita:', error);
        res.status(500).send('Error al crear la cita');
    }
});

module.exports = router;
