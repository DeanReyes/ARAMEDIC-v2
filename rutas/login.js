const express = require("express");
const router = express.Router();
const conexion = require("../config/conexion");
const link = require("../config/link");
const { validateItem } = require('../validaciones/login');
const { validationResult } = require('express-validator');
const bcrypt = require("bcrypt"); // Importamos bcrypt para comparar las contraseñas
const session = require("express-session");

router.get("/login", function(req, res) {
    res.render("login", { mensaje: null,link, oldData: {} });
});

router.post("/login", validateItem, async function(req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Mostrar errores en la vista
        return res.render("login", {
            mensaje: null,
            link,
            errors: errors.array(),
            oldData: req.body
        });
    }

    const DNI = req.body.dni;
    const contrasena = req.body.contra;
    const validar = "SELECT * FROM usuarios WHERE dni = ? and estado = 1";

    try {
        // Verificar si el usuario existe
        const [rows] = await conexion.promise().query(validar, [DNI]);

        if (rows.length < 1) {
            const mensaje = "El usurio no tiene credenciales de accesso o se encuentra inhabilitado.";
            return res.render("login", { mensaje, link, oldData: req.body });
        }

        const usuario = rows[0];

        // Comparar contraseñas con bcrypt
        const match = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!match) {
            const mensaje = "La contraseña ingresada es incorrecta.";
            return res.render("login", { mensaje, link, oldData: req.body });
        }

        // Procedemos con el inicio de sesión
        const loginQuery = "CALL login_procedure(?, ?)";
        const [result] = await conexion.promise().query(loginQuery, [usuario.rol_id, usuario.id]);
        const datos = result[0][0]; // Obtenemos los datos del procedimiento almacenado

        if (!datos) {
            const mensaje = "Error en el inicio de sesión. Intente nuevamente.";
            return res.render("login", { mensaje, link, oldData: req.body });
        }

        // Manejar la sesión según el rol
        req.session.login = true;
        req.session.idusu = usuario.id;
        req.session.dni = usuario.dni;
        req.session.contra = usuario.contrasena;
        req.session.rol = usuario.rol_id;

        if (usuario.rol_id === 1) { // Rol Paciente
            req.session.nom = datos.nombre;
            req.session.tel = datos.telefono;
            req.session.cor = datos.email;
            req.session.paciente_id = datos.paciente_id;
            return res.redirect("dashboard_paciente");
        } else if (usuario.rol_id === 2) { // Rol Médico
            req.session.nom = datos.nombre;
            req.session.tel = datos.telefono;
            req.session.cor = datos.email;
            req.session.medico_id = datos.medico_id;
            return res.redirect("dashboard_jmedico");
        } else if (usuario.rol_id === 3) { // Rol Administrador
            return res.redirect("dashboard_admin");
        }

    } catch (error) {
        console.error("Error en el proceso de inicio de sesión:", error);
        const mensaje = "Error interno. Intente nuevamente más tarde.";
        return res.render("login", { mensaje, link, oldData: req.body });
    }
});

router.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/login");
});

module.exports = router;
