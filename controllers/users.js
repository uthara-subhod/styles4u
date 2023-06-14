function loadSignup(req,res){
    res.render('user/signup')
}

function insertUser(req,res){

}
function loadlogin(req,res){
    res.render('user/login')
}

function verifyUser(req,res){
    
}

function loadHome(req,res){
    res.render('user/home')
}

module.exports={
    loadHome,
    loadlogin,
    loadSignup
}