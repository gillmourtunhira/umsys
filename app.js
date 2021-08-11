const User = require('./models/user');

const express       = require('express');
const session       = require('express-session');
const mongoose      = require('mongoose');
const passport      = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt        = require('bcrypt');
const ejs           = require('ejs');
const path          = require('path');
const app           = express();

mongoose.connect("mongodb://localhost:27017/umsys-db", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware
//app.engine('ejs', ejs({ extname: '.ejs' }));
app.set( 'view engine', 'ejs' );
app.use(express.static('public'));
app.use(session({
    secret: "hit_key",
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Passport.js Stuff
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done){
    done(null, user.id);
});

passport.deserializeUser(function (id, done){
    // setup user model
    User.findById( id, function (err, user){
        done(err, user);
    } );
});

passport.use(new localStrategy(function (username, password, done){
    User.findOne({ username }, function (err, user){
        if(err){ return done(err); }
        if (!user){
            return done(null, false, { message: 'Incorrect username.' });
        }
        bcrypt.compare(password, user.password, function(err,res){
            if(err) return done(err);
            if(res === false){
                return done(null, false, { message: 'Incorrect password'});
            }

            return done(null, user);
        });
    });
}));

app.get('/', (req,res) => {
    res.render("index", {
        title: "Home"
    });
});

app.listen(5000, () => {
    console.log('Server running at post:', 5000);
})