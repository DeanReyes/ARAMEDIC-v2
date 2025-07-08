const checkLoginPaciente = (req, res, next) => {
    if(req.session.login==true && req.session.rol==1){
        return next();
    }
    else{
        res.redirect('/login');
    }
}

module.exports = checkLoginPaciente;