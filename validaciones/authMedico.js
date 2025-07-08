const checkLoginMedico = (req, res, next) => {
    if(req.session.login==true && req.session.rol==2){
        return next();
    }
    else{
        res.redirect('/login');
    }
}

module.exports = checkLoginMedico;