require('dotenv').config();
const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_KEY;

 function auth (req,res,next)
{

    const token = req.header('auth-token');
    console.log('token',token);
   
    if(token!==undefined)
    {
        console.log(token)
     const verified=   JWT.verify(token,
            JWT_SECRET);
            req.user = verified;
            req.body.email = verified.email;
            next();
    }else{
        res.send("No token")
    }  
}
/*
async function auth(req,res,next){

    console.log(req.header.Authorization);
        if(req.headers.Authorization!==undefined)
        {
            JWT.verify(req.headers.authorization,
                JWT_SECRET,
                (err,decode)=>{
                    if(decode!==undefined){
                        req.body.email=decode.email;       
                        next();
                    }else{
                        res.status(401).json({message:"invalid token"});
                    }
                });
        }else{
            res.status(401).json({message:"No token"})
        }
  }*/

module.exports = auth;