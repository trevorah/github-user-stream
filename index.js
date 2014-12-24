var util = require('util');
var request = require('request');
var parse = require('parse-link-header');
var Readable = require('stream').Readable

var UserStream = function(options) {
  var self = this;
  options = options || {};
  options.objectMode = true;
  Readable.call(this, options);

  this.recursiveGet('https://api.github.com/users', function(err) {
    if (err) return console.error(err);
    
    self.push(null);
  });
};

util.inherits(UserStream, Readable);

UserStream.prototype._read = function() {};

UserStream.prototype.recursiveGet = function(url, cb) {
  var self = this;
  var options = {
    url: url,
    json: true,
    headers: {
      'User-Agent': 'request'
    }
  };

  request(options, function(err, resp, body) {
    if (err) return cb(err);
    if (resp.statusCode != 200) return cb(new Error('non-200 status code: ' + resp.statusCode + ' body: ' + body));

    body.forEach(function(user) {
      self.push(user);
    });

    var nextUrl;
    if (resp.headers.link) {
      var links = parse(resp.headers.link);
      nextUrl = links.next && links.next.url;
    }
    
    if (nextUrl) {
      return self.recursiveGet(nextUrl, cb);
    } else {
      return cb();
    }
  });
};

module.exports = UserStream;

