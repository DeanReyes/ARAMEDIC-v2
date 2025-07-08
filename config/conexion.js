let mysql = require("mysql2");
const { promisify } = require('util');

let conexion;

function handleDisconnect() {
    conexion = mysql.createConnection({
        host: "localhost",
        database: "clinica",
        user: "root",
        password: ""
    });

    conexion.connect(function(error) {
        if (error) {
            console.error("Error al conectar a la base de datos:", error);
            setTimeout(handleDisconnect, 2000); // Intenta reconectar después de 2 segundos
        } else {
            console.log("TRIKA conexion exitosa");
        }
    });

    // Manejar errores de conexión
    conexion.on('error', function(error) {
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log("Conexión perdida, intentando reconectar...");
            handleDisconnect(); // Reconectar automáticamente si la conexión se pierde
        } else {
            throw error;
        }
    });

    // Promisificar el método `query` para usar async/await
    conexion.query = promisify(conexion.query);
}

// Llama la función para establecer la conexión inicial
handleDisconnect();

module.exports = conexion;

