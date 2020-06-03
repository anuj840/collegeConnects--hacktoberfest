 // requirement of all npm modules
 require('dotenv').config();
 const express = require('express');
 const bodyParser = require('body-parser');
 const ejs = require("ejs");
 const mongoose = require("mongoose");
 const session = require("express-session");
 const passport = require("passport");
 const passportLocalMongoose = require("passport-local-mongoose");
 const findOrCreate = require("mongoose-findorcreate");
 //FOR google authnetcation during login
 const GoogleStrategy = require("passport-google-oauth20").Strategy;




//Initializations for our project
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

//setting up the session
app.use(session({
  secret : "Our little secret",
  resave : false,
  saveUninitialized : false
}));

//for including the cookies
app.use(passport.initialize());
app.use(passport.session());


//connecting to the mongoAtlas database
// collegeUserDB will be the name of database
mongoose.connect("mongodb+srv://admin-collegeConnects:"+process.env.MONGO_PASSWORD+"@collegeconnects-ymog0.mongodb.net/collegeUserDB", {useNewUrlParser : true, useUnifiedTopology:true});
//for removing deprication error
mongoose.set("useCreateIndex", true);


//creating a Schema
const userSchema = new mongoose.Schema({
  email : String,
  password : String,
  googleId : String
});

//including plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


//creating a model based on above Schema
// Users will be the name of collection
const User = mongoose.model("Users", userSchema);


passport.use(User.createStrategy());

//this method of serializeUser/deserializeUser works for every method of authentication
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/loggedin",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//handling all the GET request

app.get("/",function(req,res){
   res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"]
}));

app.get("/auth/google/loggedin",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to userHome page.
    res.redirect("/userHome");
});

app.get("/userHome",function(req,res){
  res.render("userHome");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/getStarted",function(req,res){
  res.render("getStarted");
});



//handling all the POST request

app.post("/login",function(req,res){

  const user = new User({
    email : req.body.userEmail,
    password : req.body.userPassword
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    } else {
       passport.authenticate("local")(req, res, function(){
          console.log("I am Ashu");
          res.redirect("/userHome");
       });
    }
  });
});

app.post("/register",function(req,res){

  User.register( { username : req.body.userEmail}, req.body.userPassword, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
         res.redirect("/userHome");
      });
    }
  });
});



app.listen(3000,function(){
  console.log("Server Started on port 3000");
});
