const express = require("express");
const router= express.Router();
const conexion=require("../config/conexion");
const link= require("../config/link");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

function generatePublicKey(length = 64) {
    const randomBytes = crypto.randomBytes(length);
    const base64String = randomBytes.toString('base64');
    const randomKey = base64String.replace(/\+/g, 'A').replace(/\//g, 'B').replace(/=/g, 'C');
    return randomKey.substring(0, length);
}

//MOSTRAR FORMULARIO DE RECUPERAR CUENTA
router.get("/recuperarcuentaU", function(req, res) {
    res.render("verificarcorreo", { 
        link,
        errors: [], 
        oldData: {} 
    });
});

router.get("/cambiar_password", function(req, res){
    const key = req.query.key;
    const validar="SELECT * FROM usuarios_key WHERE `key` = ?";
    conexion.query(validar,[key],async function(error,rows){
        if (error) 
        {
            console.log("TRIKA error en la consulta de verificación", error);
            return res.status(500).send("TRIKA ERROR EN EL SERVIDOR");
        }
        if (rows.length<1) 
        {
            const mensajesError = [];
            mensajesError.push({ msg: "Error, Email no encontrado" });
            return res.render("verificarcorreo", {
                link,
                errors: mensajesError,
                oldData: req.body
            });
        }
        else{
            const user = rows[0];
            const email = user.email;
            const data = {
                'link' : link,
                'email': email
            }
            res.render("recuperarcontraseña", data);       
        }
    })
});

router.post("/cambiar_password", function(req, res){
    const ema = req.body.email;
    const validar="SELECT * FROM pacientes WHERE `email` = ?";
    conexion.query(validar,[ema],async function(error,rows){
        if (error)
        {
            console.log("TRIKA error en la consulta de verificación", error);
            return res.status(500).send("TRIKA ERROR EN EL SERVIDOR");
        }
        if (rows.length<1) 
        {
            const mensajesError = [];
            mensajesError.push({ msg: "Error, Email no encontrado" });
            return res.render("verificarcorreo", {
                link,
                errors: mensajesError,
                oldData: req.body
            });
        }
        else
        {
            const password = req.body.password;
            const updateQuery = `UPDATE usuarios u
                                    JOIN pacientes p ON p.usuario_id = u.id
                                    SET contrasena = ?
                                    WHERE p.email = ?
            `;
            conexion.query(updateQuery, [password, ema], function (error) {
                if (error) {
                    console.log("TRIKA error");
                    throw error;
                } else {
                    const deleteKey = "DELETE FROM usuarios_key WHERE `email` = ?";
                    conexion.query(deleteKey, [ema], function (error) {
                        if (error) {
                            console.log("TRIKA error al eliminar");
                            throw error;
                        } else {
                            console.log("key eliminado de DB");
                        }
                    });
                    console.log("TRIKA datos almacenados correctamente");
                    res.redirect("login");
                }
            });
        }
    })
})

router.post("/recuperarcuentaU", function(req, res){
    const ema = req.body.email;
    const validar="SELECT * FROM pacientes WHERE email = ?";
    conexion.query(validar,[ema],async function(error,rows){
        if (error)
        {
            console.log("TRIKA error en la consulta de verificación", error);
            return res.status(500).send("TRIKA ERROR EN EL SERVIDOR");
        }
        if (rows.length<1) 
        {
            const mensajesError = [];
            mensajesError.push({ msg: "Error, Email no encontrado" });
            return res.render("verificarcorreo", {
                link,
                errors: mensajesError,
                oldData: req.body
            });
        }
        else
        {
            const key = generatePublicKey();
            const email = req.body.email;

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'aramedicperu@gmail.com',
                    pass: 'wjeg zycw qajl liab' 
                }
            });
            // Email options
            const mailOptions = {
                from: 'aramedicperu@gmail.com', 
                to: req.body.email,
                subject: 'Cambiar contraseña',             
                // text: 'Hello! This is a test email sent using Nodemailer.',
                html:
                `
                <h1>Hola!</h1>
                <p>Para cambiar contraseña entra al sgte link.</p>
                <a href="http://localhost:3000/cambiar_password?key=${key}" > Cambiar contraseña</a>
                `
            };
            // Send email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log('Error occurred: ' + error.message);
                }
                const insertar="INSERT INTO usuarios_key(`email`, `key`) VALUES ('"+email+"','"+key+"')";
                conexion.query(insertar,function(error){
                    if (error) {
                        console.log("TRIKA error");
                        throw error;
                    } else {
                        console.log("TRIKA datos almacenados correctamente");
                    }
                });
                console.log('Email sent: ' + info.response);
            });
            res.render("correoenviado"), {
                link,
                oldData: {}
            }
        }
    })
})
module.exports = router;