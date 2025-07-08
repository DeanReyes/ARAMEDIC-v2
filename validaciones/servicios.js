// validaciones/servicios.js
const { check } = require('express-validator');

module.exports = {
    validarServicio: (servicio) => {
        const { nombre_servicio, costo, tipo_procedimiento } = servicio;

        // Validación para que el nombre no contenga números
        const nombreValido = /^[a-zA-Z\s]+$/.test(nombre_servicio);
        if (!nombreValido) {
            return { valido: false, mensaje: "El nombre del servicio no debe contener números." };
        }

        // Validación para que el costo sea un número y mayor a 0
        const costoValido = /^[1-9]\d*$/.test(costo); // Número entero positivo mayor a 0
        if (!costoValido) {
            return { valido: false, mensaje: "El costo debe ser un número mayor a 0 y no debe contener letras." };
        }

        // Validación para que el tipo de procedimiento no contenga números
        const tipoValido = /^[a-zA-Z\s]+$/.test(tipo_procedimiento);
        if (!tipoValido) {
            return { valido: false, mensaje: "El tipo de procedimiento no debe contener números." };
        }

        return { valido: true };
    }
};
