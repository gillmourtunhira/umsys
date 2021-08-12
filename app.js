require('dotenv').config();
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

const URI = process.env.DB_URI;

mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware
//app.engine('ejs', ejs({ extname: '.ejs' }));
app.set( 'view engine', 'ejs' );
app.use(express.static(path.join(__dirname, 'public')));
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

// Check if user is logged in
function isLoggedIn(req, res, next){
    if( req.isAuthenticated() ) return next();
    res.redirect('/login');
}

// Check if user is logged out
function isLoggedOut(req, res, next){
    if( !req.isAuthenticated() ) return next();
    res.redirect('/');
}

// Routes
app.get('/', isLoggedIn, (req,res) => {
    res.render("index", {
        title: "Home"
    });
});

app.get('/login', isLoggedOut, (req,res) => {
    const response = {
        title: "Login",
        error: req.query.error
    }
    res.render( "login", response );
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?error=true'
}));

app.get('/logout', function(req,res){
    req.logout();
    res.redirect('/');
});

// Dashboard Routes

app.get('/dashboard',isLoggedIn, (req, res) => {
    res.render("dashboard", {
        title: 'Dashboard'
    });
});

app.get('/recruitment', isLoggedIn, (req, res) => {
    res.render("recruitment", {
        title: 'Recruitment'
    });
});

// Setup our admin user
app.get('/setup', async(req,res) => {
    const exists = await User.exists({ username: "gillmour" });

    if (exists) {
        console.log("User Exists1");
        res.redirect('/login');
        return;
    };

    bcrypt.genSalt(10, function(err, salt) {
        if(err) return next(err);
        bcrypt.hash("tunhira", salt, function(err, hash){
            if(err) return next(err);

            const newAdmin = new User({
                username: "gillmour",
                password: hash
            });

            newAdmin.save();

            res.redirect('/login');
        });
    });
});

app.listen(3000, () => {
    console.log('Server running at post:', 3000);
})