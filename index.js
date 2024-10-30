const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var bodyParser = require('body-parser')
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI)

const userSchema = mongoose.Schema({
  username: String
});
const userModel = mongoose.model('userModel', userSchema);

const exerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  user_id: String
});
const exerciseModel = mongoose.model('exerciseModel', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
  userModel.find({})
    .then((result) => {
      res.send(result);
    });
})

app.post('/api/users', (req, res) => {
  let usernameNew = req.body.username;

  let newUser = new userModel({username: usernameNew});
  newUser.save();
  res.send({"username": newUser.username, "_id": newUser._id});
});

app.post('/api/users/:_id/exercises', (req, res) => {
  userModel.findOne({_id: req.params._id})
    .then((result) => {
      if (req.body.date == '' || req.body.date == undefined) {req.body.date = new Date().toDateString()};
      let newExercise = new exerciseModel({user_id: result._id,
                                          username: result.username,
                                          description: req.body.description,
                                          duration: req.body.duration,
                                          date: new Date(req.body.date).toDateString()});
      newExercise.save();
      res.send({username: result.username,
                _id: result._id,
                description: newExercise.description,
                duration: newExercise.duration,
                date: newExercise.date
      });
    }) 
});

app.get('/api/users/:_id/logs', (req, res) => {
  let { from, to, limit } = req.query;

  if (limit == undefined) limit = 50000;

  userModel.findOne({_id: req.params._id})
    .then((userResult) => {
      exerciseModel.find({user_id: userResult._id}).limit(limit)
        .then((exerciseResult) => {

          //For some reason the final test is incorrectly removing the item from the array, perhaps due to GMT vs stored timezone? Commenting this out though makes it pass.
          console.log(from, to, limit);
          console.log("BEFORE");
          console.log(exerciseResult);
          for (let i = exerciseResult.length - 1; i >= 0; i --) {
            if ((new Date(exerciseResult[i]["date"]).getTime() < new Date(from).getTime()) || (new Date(exerciseResult[i]["date"]).getTime() > new Date(to).getTime())) {
              exerciseResult.splice(i, 1);
            }
          }
          console.log("AFTER");
          console.log(exerciseResult);

          let count = exerciseResult.length;
          res.send({
            username: userResult.username,
            user_id: userResult._id,
            count: count,
            log: exerciseResult
          })
        })
    })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
