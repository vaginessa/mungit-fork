
var ko = require('knockout');
var components = require('ungit-components');
var signals = require('signals');

components.register('login', function(args) {
  return new LoginViewModel(args.server, args.token);
});

var LoginViewModel = function(server, token) {
  var self = this;
  this.server = server;
  this.loggedIn = new signals.Signal();
  this.status = ko.observable('loading');
  this.username = ko.observable();
  this.password = ko.observable();
  this.token = token;
  this.loginError = ko.observable();
  this.server.getPromise('/loggedin')
    .then(function(status) {
      if (status.loggedIn) {
        self.loggedIn.dispatch();
        self.status('loggedIn');
      } else {
        self.status('login');
      }
    }).catch(function(err) { });
    
  if(token !== undefined) {
    this.login();
  }
}
LoginViewModel.prototype.updateNode = function(parentElement) {
  ko.renderTemplate('login', this, {}, parentElement);
}
LoginViewModel.prototype.login = function() {
  var self = this;
  
  if(this.token === undefined || (this.username() && this.password())) {
    this.server.postPromise('/login', { username: this.username(), password: this.password() }).then(function(res) {
      self.loggedIn.dispatch();
      self.status('loggedIn');
    }).catch(function(err) {
      if (err.res.body.error) {
        self.loginError(err.res.body.error);
      } else {
        self.server.unhandledRejection(err);
      }
    });
  }
  else {
    this.server.postPromise('/logintoken', { token: this.token }).then(function(res) {
      self.loggedIn.dispatch();
      self.status('loggedIn');
    }).catch(function(err) {
      if (err.res.body.error) {
        self.loginError(err.res.body.error);
      } else {
        self.server.unhandledRejection(err);
      }
    });
  }
}
