var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Click = require('./click.js');
var Link = require('./link.js');

var User = db.Model.extend({

  tableName: 'users',
  hasTimestamps: true,
  auth: false,
  links: function() {
    return this.hasMany(Link, 'link_id');
  },
  clicks: function() {
    return this.hasMany(Click, 'click_id');
  }
});

module.exports = User;
