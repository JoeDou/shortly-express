var db = require('../config');
var Link = require('./link.js');
var User = require('./user.js');

var Click = db.Model.extend({
  tableName: 'clicks',
  hasTimestamps: true,
  link: function() {
    return this.belongsTo(Link, 'link_id');
  },
  user: function() {
    return this.belongsTo(User);
  },

});

module.exports = Click;
