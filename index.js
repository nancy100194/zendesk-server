const express = require('express');
const app = express();
/*
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.use(allowCrossDomain);
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(application_root, "public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});*/

const cors = require('cors');

// Routes
const getRoute = require('./routes.js');
const registerRoute = require('./routes.js');
const loginRoute = require('./routes.js');
const activateRoute = require('./routes.js');
const ticketsRoute= require('./routes.js');
const addTicketRoute = require('./routes.js');
const deleteTicketRoute = require('./routes.js');
const addContactFormRoute = require('./routes.js');

const port = process.env.PORT|| 5000

//Middleware
app.use(express.json());
app.use(cors());

app.use('/user', getRoute);
app.use('/user', registerRoute);
app.use('/user', loginRoute);
app.use('/user', activateRoute);
app.use('/user', ticketsRoute);
app.use('/user', addTicketRoute);
app.use('/user', deleteTicketRoute);
app.use('/user', addContactFormRoute);


// setting up of port

    app.listen(port,()=>
    {
        console.log(`Connection is established and app started running on port : ${port}!!!`)
  
    })



