const mysql = require('mysql2');

/**
 * Clase para gestionar la conexión a la base de datos MySQL.
 */
class Conexion {
    constructor() {
        // Crear un pool de conexiones a la base de datos con los parámetros de conexión
        this.pool = mysql.createPool({
            host: 'localhost',          // Host de la base de datos
            user: 'root',          // Usuario para la conexión
            port: 3306,          // Puerto de conexión
            password: '',  // Contraseña para la conexión
            database:'clinica',      // Nombre de la base de datos
            connectionLimit: 20                 // Límite de conexiones simultáneas
        });
    }

    /**
     * Método para ejecutar una consulta SQL simple.
     * @param {string} sql - La consulta SQL que se va a ejecutar.
     * @param {Array} param - Parámetros para la consulta (si aplica).
     * @returns {Promise} - Resuelve con el resultado de la consulta.
     */
    query(sql, param = []) {
        return new Promise((resolve, reject) => {
            // Obtener una conexión del pool
            this.pool.getConnection((err, connection) => {
                if (err) return reject(err.sqlMessage);  // Rechazar si hay un error en la conexión
                // Ejecutar la consulta SQL
                connection.query(sql, param, (err, result) => {
                    if (err) return reject(err.sqlMessage);  // Rechazar si hay un error en la consulta
                    connection.release();  // Liberar la conexión para que otros puedan usarla
                    return resolve(result);  // Resolver con el resultado de la consulta
                });
            });
        });
    }

    /**
     * Método para ejecutar un procedimiento almacenado y devolver el primer resultado.
     * @param {string} sql - La consulta SQL (procedimiento almacenado).
     * @param {Array} param - Parámetros para el procedimiento.
     * @returns {Promise} - Resuelve con el primer resultado del procedimiento.
     */
    procedure(sql, param = []) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) return reject(err.sqlMessage);  // Rechazar si hay un error en la conexión
                connection.query(sql, param, (err, result) => {
                    if (err) return reject(err.sqlMessage);  // Rechazar si hay un error en la consulta
                    connection.release();  // Liberar la conexión
                    return resolve(result[0]);  // Resolver con el primer resultado del procedimiento
                });
            });
        });
    }

    /**
     * Método para ejecutar un procedimiento almacenado y devolver todos los resultados.
     * @param {string} sql - La consulta SQL (procedimiento almacenado).
     * @param {Array} param - Parámetros para el procedimiento.
     * @returns {Promise} - Resuelve con todos los resultados del procedimiento.
     */
    procedureAll(sql, param = []) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) return reject(err.sqlMessage);  // Rechazar si hay un error en la conexión
                connection.query(sql, param, (err, result) => {
                    if (err) return reject(err.sqlMessage);  // Rechazar si hay un error en la consulta
                    connection.release();  // Liberar la conexión
                    return resolve(result);  // Resolver con todos los resultados del procedimiento
                });
            });
        });
    }

    /**
     * Método para iniciar una transacción.
     * @returns {Promise} - Resuelve con la conexión para ejecutar consultas dentro de la transacción.
     */
    beginTransaction() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    return reject(err.sqlMessage);  // Rechazar si hay un error en la conexión
                }

                // Iniciar la transacción
                connection.beginTransaction(function (err) {
                    if (err) {
                        return reject(err.sqlMessage);  // Rechazar si hay un error al iniciar la transacción
                    }

                    return resolve(connection);  // Resolver con la conexión para ejecutar consultas dentro de la transacción
                });
            });
        });
    }

    /**
     * Método para ejecutar una consulta dentro de una transacción.
     * @param {object} connection - Conexión ya establecida para la transacción.
     * @param {string} sql - La consulta SQL que se va a ejecutar.
     * @param {Array} param - Parámetros para la consulta.
     * @returns {Promise} - Resuelve con el resultado de la consulta.
     */
    execute(connection, sql, param = []) {
        return new Promise((resolve, reject) => {
            connection.query(sql, param, (err, result) => {
                if (err) return reject(err.sqlMessage);  // Rechazar si hay un error en la consulta
                return resolve(result);  // Resolver con el resultado de la consulta
            });
        });
    }

    /**
     * Método para realizar un commit dentro de una transacción.
     * @param {object} connection - Conexión ya establecida para la transacción.
     * @returns {Promise} - Resuelve cuando el commit se haya completado.
     */
    commit(connection) {
        return new Promise((resolve, reject) => {
            connection.commit((err) => {
                if (err) {
                    return connection.rollback((err) => {
                        reject(err.sqlMessage);  // Rechazar si hay un error al hacer el commit
                    });
                };

                connection.release();  // Liberar la conexión después del commit
                return resolve();  // Resolver cuando el commit se haya completado
            });
        });
    }

    /**
     * Método para hacer un rollback dentro de una transacción.
     * @param {object} connection - Conexión ya establecida para la transacción.
     * @returns {Promise} - Resuelve cuando el rollback se haya completado.
     */
    rollback(connection) {
        return new Promise((resolve, reject) => {
            connection.rollback((err) => {
                if (err) {
                    return reject(err.sqlMessage);  // Rechazar si hay un error al hacer el rollback
                }

                connection.release();  // Liberar la conexión después del rollback
                return resolve();  // Resolver cuando el rollback se haya completado
            });
        });
    }
}

module.exports = Conexion;
