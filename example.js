const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LichessStrategy = require('./lib').Strategy;

passport.use(new LichessStrategy({
  clientID: 'example.com',
  callbackURL: 'http://localhost:5000/auth/lichess/callback'
}, (_accessToken, _refreshToken, profile, cb) => cb(null, profile)));

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));

const app = express();

app.use(session({secret:'some-secret', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/lichess', passport.authenticate('lichess'));

app.get('/auth/lichess/callback',
  passport.authenticate('lichess', {
    successRedirect: '/ok',
    failureRedirect: '/nope'
  }));

app.get('/', (_req, res) => res.send('<a href="http://localhost:5000/auth/lichess">Login</a>'));
app.get('/ok', (req, res) => res.send(`Hello ${req.user.username}!`));
app.get('/nope', (_req, res) => res.send('Authentication failed'));

app.listen(5000, () => console.log('http://localhost:5000/'));
