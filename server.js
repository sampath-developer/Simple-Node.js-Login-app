if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

const initializePassport = require('./passport-config')
initializePassport(passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

const users = [];

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, //Stop Saving Duplicate Values
  saveUninitialized: false //To Avoid Storing Empty Values
}));
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name })
})

app.get('/login', checkNotAuthencticated, (req, res) => {
  res.render('login.ejs');
})

app.post('/login', checkNotAuthencticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthencticated, (req, res) => {
  res.render('register.ejs');
})

app.post('/register', checkNotAuthencticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login');
  }
  catch {
    res.redirect('/register');
  }
  console.log(users);
})

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function checkNotAuthencticated(req, res, next) {  //Doesn't Allow User who logged in to register and login again
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next()
}

app.listen(3000)