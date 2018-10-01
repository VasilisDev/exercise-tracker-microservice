const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const User = require('./models/user');
const Exercise = require('./models/exercise');
const mongoose = require('mongoose')
const ip=require('ip')
const Regex = require("regex");
const moment = require('moment');
// db connection
var mongoDB = 'mongodb://<username>:<password>@ds119072.mlab.com:19072/<dbname>';
mongoose.connect(mongoDB, {
  useMongoClient: true
});
// Get the default connection
var db = mongoose.connection;
// error in binding connection
db.on('error', (err) => { console.log('Mongo DB connection error', err); });
//success connection
db.once('open', () => { console.log('Mongo DB connected.'); });
//enable cors
app.use(cors())
//body parsing for post requests
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
//index page
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//add new user endpoint
app.post('/api/exercise/new-user', (req, res) => {
const username = req.body.username;
var regex = new Regex("^[a-zA-Z0-9.-_$@*!#&^%/]{4,12}$");// regular expression to validate the username
//not empty username
  if (username === '') {
res.json({"error": "Username cannot be empty!"});
}
else if (username.length > 12 ) {//username cannot be greater than 12 characters
    res.json({"error": "Username must not be greater than 12 characters"});
  }

  else if (username.length < 4 ) {//username cannot be lesser than 4 characters
    res.json({"error": "Username must be at least 4 characters"});
  }

    else if (regex.test(username !== 1)){//check if the username is valid according to regular expression
      res.json({"error": "Not valid username.Use alphabet letter (Upper-case or Lower-case),digits or the alphanumerics .-_$@*!#&^%/"});
    }

  else {// create a new schema for a user
    const newUser = new User({
      username,
    });

//if there aren't errors save the new user in the db
    newUser.save((err, data) => {
      console.log(err)
      console.log(data)
      if (err) {
          res.json({"error": 'Username already exists!'});
        }
       else {//fetch the data after complete saving in db
        res.json({
      _id: newUser._id,
      username: newUser.username
    });
  }
    });
  }
});

//exercise add endpoint
app.post('/api/exercise/add', (req, res,next) => {
  //query to find the id that user given
    User.findById(req.body.userId, function(err, user) {
    if(err) return next(err);
    //if user_id doesn't exist
    if (!user) return next({
      status: 400,
      message: 'unknown userId'
    });
    //the date must valid
    let givenDate   = req.body.date;
    givenDate   = new Date(req.body.date);
    let currentDate = new Date();
    if( givenDate < currentDate ){
    return next({
      message: 'invalid date'
    });
}
else{
    const exercise = new Exercise({// exercise schema
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date ? req.body.date : undefined //if date is empty
    });
// save the data in db
     exercise.save((err,data) => err ? console.log(err) :     res.json({
            _id: user._id,
            username: user.username,
            description: exercise.description,
            duration: parseInt(exercise.duration),
            date: exercise.date.toDateString()// convert string object to date string
          }));
        }
      });
});
//get log of exercise
app.get('/api/exercise/log',  (req, res,next) => {
    let { userId, from, to, limit } = req.query;
    console.log(req.queruy)
    from = moment(from, 'YYYY-MM-DD').isValid() ? moment(from, 'YYYY-MM-DD') : 0;
      to = moment(to, 'YYYY-MM-DD').isValid()  ? moment(to, 'YYYY-MM-DD') : moment().add(1000000000000);
    User.findById(userId).then(user => {
           if (!user) throw new Error('Unknown user _id');
           Exercise.find({ userId })
               .where('date').gte(from).lte(to)
               .limit(+limit).exec()
               .then(log => res.status(200).send({
                   _id: userId,
                   username: user.username,
                   count: log.length,
                   log: log.map(o => ({
                       description: o.description,
                       duration: o.duration,
                       date: moment(o.date).format('ddd MMMM DD YYYY')
                   }))
               }))
       })
   })

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: '404 not found'})
})
// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  }
  else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || '500 Internal Server Error'
  }
//response the error message
  res.status(errCode).type('txt')
    .send(errMessage)
})
//app's listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('App is starting...')//app starts
  console.log('Port:' + listener.address().port+'\t'+ 'IP:' +ip.address())// port and ip address of host
})
