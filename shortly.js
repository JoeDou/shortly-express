var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

var checkAuth = function (req, res, next) {
  if (req.session.user){
    next();
  }else{
    res.redirect('/login');
  }
};

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  // include the following to be able to generate cookies
  app.use(express.cookieParser('secrete'));
  app.use(express.session());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.get('/', checkAuth, function(req, res) {
  res.render('index');
});

app.get('/create', checkAuth, function(req, res) {
  res.render('index');
});

// app.post('/create', checkAuth, function(req, res){
//   var username = req.session.user;
//   var url = req.body.url;


//   console.log(req.body.url);
//   var link = new Link({url: url});
//   link.save();

//   Links.add(link);

//   // new User({username: username})
//   //   .fetch()
//   //   .then(function(model){
//   //     var link = new Link({url: url, user_id: model.get('id')});
//   //     link.save();

//   //     Links.add(link);
//   //   });
// });

app.get('/links', checkAuth, function(req, res) {
  Links.reset().fetch().then(function (links) {
    res.send(200, links.models);
  });
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/signup', function(req, res) {
  //console.log('get request');
  res.render('signup');
});

app.post('/signup', function(req, res){

  var username = req.body.username;
  var password = req.body.password;
  //var salt = "1234";

  new User({username: username}).fetch().then(function(found){
    if(found){
      res.redirect('/login');
    } else {
      var user = new User({
        username: username,
        password: password
      });
      user.save().then(function(user){
        Users.add(user);
        res.redirect('/login');
      });
    }
  });
});

app.get('/login', function(req, res) {
  //console.log('get request');
  res.render('login');
});

app.post('/login', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  var qb = Users.query;

  Users.query(function(qb) {
    qb.where('username', '=', username)
      .andWhere('password', '=', password);
  }).fetchOne()
  .then(function(model) {
    req.session.regenerate(function(){
      req.session.user = username;
      res.redirect('/links');
    });
  })
  .catch(function (err) {
    console.log('login: ', err);
    res.render('login');
  });

});

app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
