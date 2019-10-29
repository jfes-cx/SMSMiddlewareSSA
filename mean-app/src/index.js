// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt    = require('jsonwebtoken');
const config = require('./configurations/config');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const {startDatabase} = require('./database/mongo');
const {insertAd, getAds} = require('./database/ads');
const  ProtectedRoutes = express.Router(); 

// defining the Express app
const app = express();

// defining protected routes
app.use('/api', ProtectedRoutes);

//set secret
app.set('Secret', config.secret);

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

ProtectedRoutes.use((req, res, next) =>{
    // check header for the token
    var token = req.headers['access-token'];
    // decode token
    if (token) {
      // verifies secret and checks if the token is expired
      jwt.verify(token, app.get('Secret'), (err, decoded) =>{      
        if (err) {
          return res.json({ message: 'invalid token' });    
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;    
          next();
        }
      });
    } else {
      // if there is no token  
      res.send({ 
          message: 'No token provided.' 
      });
    }
  });

  
// defining an array to work as the database (temporary solution)
app.get('/getAds', async (req, res) => {
    res.send(await getAds());
});

app.post('/sendSMS', async (req, res) => {
    
    //Conexión obtener token

    var ajax_url = "https://servicios.saludsa.com.ec/ServicioAutorizacion/oauth2/token";
    var params = "grant_type=password&client_id=2803e0c47d7d4c32ac5fef7df77f7edb&username=usrzendesk&password=Z3nd3sk";
    var ajax_request = new XMLHttpRequest();
    ajax_request.open("POST", ajax_url, true);
    ajax_request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    ajax_request.send(params);
    ajax_request.onreadystatechange = function(){
      if(ajax_request.readyState == 4)
      {
        var jsonObj = JSON.parse(ajax_request.responseText);
        //Ver token 
        console.log("Token obtenido");
        console.log(jsonObj.access_token);
        var valor_token = jsonObj.access_token;
        res.send({ message: valor_token});
      }else{
          console.log("Fallo al obtener el token de SaludSA");
      }
    }

    // const newAd = req.body;
    // var insStat = await insertAd(newAd).catch(function () {
    //     console.log("Error on inserting post");
    // });;
    // res.send({ message: insStat});
});

app.post('/authenticate',(req,res)=>{
    if(req.body.username==="zerviz"){
        if(req.body.password==="zerviz2756"){
            //if eveything is okey let's create our token 
            const payload = {
                check:  true
            };
            var token = jwt.sign(payload, app.get('Secret'), {
                // expiresIn: 1440 // expires in 24 hours
            });
            res.json({
                message: 'authentication done ',
                token: token
            });
        }else{
            res.json({message:"please check your password !"})
        }
    }else{
        res.json({message:"user not found !"})
    }
});

// start the in-memory MongoDB instance
startDatabase().then(async () => {
    await insertAd({title: 'Hello, now from the in-memory database3!'});
    
    // start the server
    app.listen(3001, async () => {
        console.log('listening on port 3001');
    });
});