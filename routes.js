require('dotenv').config();

var express = require('express');
var router = express.Router();

var nodemailer = require('nodemailer')
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const transporter=nodemailer.createTransport({
  service:'gmail',
  auth:{
      user:'nbrisilla@gmail.com',
      pass:process.env.PASSWORD
  }
});

const bcrypt = require('bcryptjs');

const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_KEY;

const querystring = require('querystring');

//Setting up of database
const mongodb = require('mongodb')
const mongoClient = mongodb.MongoClient;
const objectId = mongodb.ObjectID;
const dbUrl = process.env.DB_URL;

//middleware-authentication
const auth = require('./auth.js');

router.get('/' , (req,res)=>{res.send("Welcome to my app")}
            )
//register route
router.post ('/register',async(req,res)=>
{
  const client = await mongoClient.connect(dbUrl);
  if(client)
  {
    try{
  
      let {firstname,lastname,email,password} = req.body;
     
         //validation 
       
         if ( !firstname || !lastname || !email || !password )
           return res.send({ message: "Please enter all required fields." });
          
         if (password.length < 6)
           return res.send({
             message: "Please enter a password of at least 6 characters.",
           });
     
           let db = client.db('helpdesk');
     
         let userFound = await db.collection('users').findOne({"email" : email});
        console.log(userFound)
      
          if(userFound)
          {
            if(userFound.active===1){ return res
              .send({
               message: "An account with this email already exists, kindly login.",
                });}else{
                  const token =  await JWT.sign({email},JWT_SECRET,)
                  console.log(token);
                  let userFirstname = userFound.firstname;
                  let userlastname = userFound.lastname;
                  let username = userFirstname.concat(userlastname);
                 
                   //sending confirmation mail
                  var mailOptions = {
                    from: 'nbrisilla@gmail.com', // sender address
                    to: req.body.email, // list of receivers
                    subject: "Welcome to Help Desk Ticketing :::: Hii,there !", // Subject line
                    html:

                    `<h3> Hello ${username} </h3>
                    <p>Thank you for registering into our Application. Much Appreciated! Just one last step is laying ahead of you...</p>
                    <p>To activate your account please follow this link: <a target="_" href="https://helpdeskticket-client.herokuapp.com/activate-user/${token}">https://helpdeskticket-client.herokuapp.com/activate </a></p>
                    <p>Cheers</p>
                    <p>Your Application Team</p>`
                     
                  };
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                      res.send({
                        message: "Account is inactivate, kindly activate via link send to your mailId.",});
                    }
                  });
                 }  
          }
         else{
             // Hash the password

                let salt = await bcrypt.genSalt();
                let hashedpassword  = await bcrypt.hash(req.body.password,salt);
                req.body.password=hashedpassword;
                req.body.active=0;

             // Insert  new user data to db
             const user = await db.collection('users').insertOne(req.body);
              
                if(user){ 
             
                  const token =  await JWT.sign({email},JWT_SECRET,)
                  console.log(token);
                    var mailOptions = {
                    from: 'nbrisilla@gmail.com', // sender address
                    to: req.body.email, // list of receivers
                    subject: "Welcome to Zen Desk Ticketing :::: Hii,there !", // Subject line
                    html:

                    `<h3> Hello</h3>
                    <p>Thank you for registering into our Application. Much Appreciated! Just one last step is laying ahead of you...</p>
                    <p>To activate your account please follow this link: <a target="_" href="https://helpdeskticket-client.herokuapp.com/activate-user/${token}">https://helpdeskticket-client.herokuapp.com/activate </a></p>
                    <p>Cheers</p>
                    <p>Your Application Team</p>`
                     
                  };
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                      res.send({
                        "message":"Activate your account via link send to your registered mail id."});
                    }
                  });
                 }
         }
         client.close();
         }catch(error)
         {
             console.log(error);
             client.close();
         }
  }
  
});

//user activation route
router.get('/activate-user',async(req,res)=>{
  const client = await mongoClient.connect(dbUrl);
  if(client){ 
      try{
        let token = req.query.token;
          const db = client.db("helpdesk");
          JWT.verify(token,
              JWT_SECRET,
              async(err,decode)=>{
                  if(decode!==undefined){
                     const  document=await db.collection("users").findOneAndUpdate({email:decode.email},{$set:{active:1}}); 
                      console.log(decode.email);
                      if(document)
                      {
                    console.log("activated")
                         res.send({message:"Activated Sucessfully, kindly login to use our services!!",document});
                     
                      }          
                  }else{
                      res.send({message:"user is already activated, kindly login!!"});
                  }
              });
          
          client.close();
      }
      catch(error)
      {
          console.log(error);
          client.close();
      }
  }else{

      ressend({message:"invalid token"});
  }
})

//login route 
router.post("/login",async(req,res)=>{
  const client=await mongoClient.connect(dbUrl);
  if(client)
  {   const {email}=req.body;
      try{
          let db=client.db("helpdesk");
          let data=await db.collection("users").findOne({email:req.body.email});
          if(data)
          { 
              let isvalid =await bcrypt.compare(req.body.password,data.password);   
              if(isvalid)
              {
                  if(data.active)
                  {
                      let token=await JWT.sign({email},JWT_SECRET);
                      req.header("auth-token",token)
                      let userFirstname = data.firstname;
                      let userlastname = data.lastname;
                      let username = userFirstname.concat(userlastname);
                  
                      let info = await transporter.sendMail({
                          from: 'nbrisilla.com', // sender address
                          to: req.body.email, // list of receivers
                          subject: "ZenDesk Ticketing :::: Welcome!!!", // Subject line
                          html: "<h3>Hello "+username+"</h3><p>Welcome, you have successfully loggedin to HelpDesk.Enjoy our services.</p>", // html body
                      })
                      res.send({message:"Login Successful !!",token,email});
                  }else{
                      res.send({message:"User Not Activated."});
                  }
              }
              else{
                  res.send({message:"Login Unsuccesful!!"})
              }
          }
          else{
              res.send({message:"User Does Not Exists. "});// 401 unauthorized
          }
          client.close();
      }
      catch(error){
          console.log(error);
          client.close();
      }
  }else{

      res.sendStatus(500);
  }
})


//user forgetpassword route
router.post('/forgetpassword',async(req,res)=>{
  const client = await mongoClient.connect(dbUrl);

  if(client){
      const {email}=req.body 
      try{
          let db=client.db("helpdesk");
          let data=await db.collection("users").findOne({email:req.body.email});
          if(data)
          {
          const resetToken =  await JWT.sign({email},JWT_SECRET,)
          let userFirstname = data.firstname;
          let userlastname = data.lastname;
          let username = userFirstname.concat(userlastname);
                      let info = await transporter.sendMail({
                          from: 'nbrisilla@gmail.com', // sender address
                          to: req.body.email, // list of receivers
                          subject: "ZenDesk Ticketing :::: Reset your password", // Subject line
                          html: 
                          `<h3> Hi ${username}, </h3>
                          <p>We are sending you this email because you requested a password reset.</p>
                          <p>Click on the linkto create a new password : <a target="_" href="https://helpdeskticket-client.herokuapp.com/reset-password/${ resetToken}">https://helpdeskticket-client.herokuapp.com/reset-password </a></p>
                          
                          <p> If you didn't request a password reset, you can ignore this email.Your password would not be changed.</p>
                          <p><b> the HelpDesk team</b></p>`
                        })
                      if(resetToken)
                      {
                         res.send({message:"An email is sent for reseting password,check your inbox for the next steps.",resetToken});
                      }
          }else{
              res.send({message:"Email does not exist, kindly register."});
          }

      }
      catch(error)
      {
          console.log(error);
          client.close();
      }
  }else{

      res.sendStatus(500);
  }
})

// user resetpassword route
router.post('/resetpassword',async(req,res)=>{
  const client = await mongoClient.connect(dbUrl);
  if(client){ 
      try{
        let token = req.query.token;
        console.log(token);
        console.log(req.body.password,req.body.cpassword);
        if(req.body.password && req.body.cpassword)
        {
          if(token)
          {
              const db = client.db("helpdesk");
          let salt=await bcrypt.genSalt(10);//key to encrypt password
                      console.log(salt);
          let hash=await bcrypt.hash(req.body.password,salt);
                      req.body.password=hash;
          JWT.verify(token,
              JWT_SECRET,
              async(err,decode)=>{
                  if(decode!==undefined){
                      document=await db.collection("users").findOneAndUpdate({email:decode.email},{$set:{password:req.body.password}}); 
                      if(document)
                      {
                          res.send({message:"Password updated, login now."});
                        //  res.redirect(baseurl+"/password");
                      
                      }          
                  }else{
                      res.send({message:"Error occured in reseting password."});
                  }
              });
          
          client.close();
        }else{
          res.send({message:"No token for Authorization"});
        }
       
        } else{
          res.send({message:"Enter password & confirm password to proceed."});
        }
          
      }
      catch(error)
      {
          console.log(error);
          client.close();
      }
  }else{

      res.sendStatus(500);
  }

})

//tickets route
router.get('/tickets',auth,async (req,res)=>
{
   const client = await mongoClient.connect(dbUrl)
   if(client){
       try{
        const db = client.db('helpdesk');
        const tickets =  await db.collection('tickets').find({email:req.body.email}).toArray();
        if(tickets)
        {
          res.send(tickets);
          console.log(`entered tickets: ${tickets}`);
        }
 
        client.close();
       
       }catch(error)
       {
           console.log(error)
           res.send({"message" : "error occured while getting tickets"});
           client.close();
       }
   }
 
});

// Adding tickets route
router.post('/add-ticket' ,auth,async (req,res)=>
{
   const client = await mongoClient.connect(dbUrl)
   if(client){
       try{

        const db = client.db('helpdesk');
        req.body.ticketno = Math.random().toString(36).slice(2);
        req.body.status =  'open';
        req.body.date =  new Date();
        req.body.updated = "";
        let addTicket = await db.collection('tickets').insertOne(req.body);
        if(addTicket)
        {
          console.log(`Added ticket : ${addTicket}`)
          res.send({"message":"ticket added successfully"});
         
        }
        
        client.close();
       
       }catch(error)
       {
           console.log(error)
           res.send({"message" : "error occured while adding ticket"});
           client.close();
       }
   }
 
});


//deleting ticket route
router.delete('/delete-ticket/:id' , auth,async (req,res)=>
{
   const client = await mongoClient.connect(dbUrl)
   if(client){
       try{
        const {id} = req.params;
        const db = client.db('helpdesk');
        const deleteTicket= await db.collection('tickets').deleteOne({"_id":objectId(id)});
        console.log(deleteTicket)
        if(deleteTicket)
        {
          res.send({"message":"todo deleted successfully",deleteTicket});
   
        }
       client.close();
       }catch(error)
       {
           console.log(error)
           res.send({"message" : "error occured while deleting todo "});
           client.close();
       }
   }
 
});

//contactus route
router.post('/contactus' ,auth,async (req,res)=>
{
   const client = await mongoClient.connect(dbUrl)
   if(client){
       try{
        
        const db = client.db('helpdesk');
        req.body.date =  new Date();
        let addContact = await db.collection('contactForm').insertOne(req.body);
        if(addContact)
        {
          console.log(`Added Contactform details : ${addContact}`)
          res.send({"message":"Your message sent successfully."});
         
        }
        
        client.close();
       
       }catch(error)
       {
           console.log(error)
           res.send({"message" : "error occured while sending message"});
           client.close();
       }
   }
 
});

  module.exports = router;
