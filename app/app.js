// Librerías
const path = require('path');
const express = require("express");
const app = express();
const methodOverride = require('method-override'); // Para usar métodos PUT y DELETE en formularios
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash'); // Para mensajes flash

// Configuraciones
app.set("view engine", "ejs"); // Páginas dinámicas
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method')); // Permite usar métodos PUT y DELETE

// Manejo de sesiones
app.use(session({
    secret: "tu_contraseña", // Cambia esto a algo más seguro
    resave: false,
    saveUninitialized: true
}));

// Configuración de mensajes flash
app.use(flash());

// Middleware para pasar mensajes flash y datos de sesión a las vistas EJS
app.use((req, res, next) => {
    // Mensajes flash
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");

    // Datos del usuario en sesión
    if (req.session.login) {
        res.locals.user = {
            nombre: req.session.nom,
            apellidos: req.session.ape,
            correo: req.session.cor
        };
    } else {
        res.locals.user = null;
    }
    next();
});

// Configuración de CORS
app.use(cors({
    origin: '*', // Cambia esto a tu dominio cliente
    credentials: true // Permite cookies en solicitudes CORS
}));

// Rutas estáticas y vistas
app.use(express.static(path.join(__dirname, '../public')));

// Rutas del sistema
app.use(require("../rutas/login"));
app.use(require("../rutas/registroU"));
app.use(require("../rutas/jmedico"));
app.use(require("../rutas/dpaciente"));
app.use(require("../rutas/admin"));
app.use(require("../rutas/recuperarcuentaU"));
app.use(require("../rutas/calendario"));

// Configuración del puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    if (PORT == 3000) {
        console.log("TRIKA Servidor creado http://localhost:3000");
    } else {
        console.log(PORT);
    }
});

// Comentarios: puedes habilitar estas rutas adicionales si las necesitas
// app.get("/",function(req,res){
//     res.render("index");
// });
// app.get("/registro",function(req,res){
//     res.render("registro");
// });
// app.post("/validar",function(req,res){
//     const datos=req.body;
//     let id_medico=datos.id_med;
//     let nombres=datos.nom;
//     let apellidos=datos.ape;
//     let email=datos.ema;
//     let contrasena=datos.contra;

//     let buscar="SELECT * FROM medico WHERE id_medico ="+id_medico+"";
//     conexion.query(buscar,function(error,row){
//         if (error) {
//             throw error;
//         } else {
//             if(row.length>0){
//                 console.log("TRIKA usuario existente");
//             }else{
//                 let registrar="INSERT INTO medico (id_medico,nombre,apellido,correo,contrasena) VALUES ('"+id_medico+"','"+nombres+"','"+apellidos+"','"+email+"','"+contrasena+"')";
//                 conexion.query(registrar,function(error){
//                     if (error) {
//                         throw error;
//                     } else {
//                         console.log("TRIKA datos almacenados correctamente");
//                     }
//                 });
//             }
//         }
//     });
// });
