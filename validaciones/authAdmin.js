const checkLoginAdmin = (req, res, next) => {

    if (req.session.login == true && req.session.rol == 3) {
        return next();
    } else {
        res.redirect('/login');
    }
};

module.exports = checkLoginAdmin;