/**
 * @module Route User module 
 * @description User module routing for Express j.
 */

'use strict';

/*
 * Export routes for RESTfull interface.
 * @param app {Object} Express js application object.
 * @param ctrls {Object} Controller collection.
 */
module.exports = function (app, ctrls) {
    app.post('/api/user/register', ctrls.user.isAuthenticated, ctrls.user.register);
    app.post('/api/user/login', ctrls.user.login);
    app.get('/api/user/logout', ctrls.user.logout);
    app.get('/api/user/current', ctrls.user.currentUser);
    //app.get('/api/user/status', ctrls.user.isAuthenticated, ctrls.user.status);

    app.get('/api/user/:page/:limit', ctrls.user.isAuthenticated,ctrls.user.list);
    app.post('/api/user/:page/:limit', ctrls.user.isAuthenticated,ctrls.user.list);
    app.post('/api/user', ctrls.user.isAuthenticated,ctrls.user.create);
    app.put('/api/user', ctrls.user.isAuthenticated,ctrls.user.update);
    app.delete('/api/user/:oid/:id', ctrls.user.isAuthenticated,ctrls.user.delete);
    app.put('/api/image/:id', ctrls.user.isAuthenticated,ctrls.user.uploadAvatar);
    app.get('/api/image/:id', ctrls.user.getAvatar);

    app.post('/api/user/setpwd', ctrls.user.isAuthenticated,ctrls.user.setpwd);

    app.post('/api/usertickets/:page/:limit', ctrls.user.isAuthenticated, ctrls.user.userTickets);
    app.post('/api/organusers/:page/:limit', ctrls.user.isAuthenticated, ctrls.user.organUsers);

}  
    
    
//var path = require('path');

  //// User Routes
  //var users = require('./controllers/user');
  //app.post('/auth/user', users.create);
  //app.get('/auth/user/:userId', users.show);

  //// Check if username is available
  //// todo: probably should be a query on users
  //app.get('/auth/check_username/:username', users.exists);

  //// Session Routes
  //var session = require('./controllers/session');
  //app.get('/auth/session', auth.ensureAuthenticated, session.session);
  //app.post('/auth/session', session.login);
  //app.delete('/auth/session', session.logout);

  //// Blog Routes
  //var blogs = require('./controllers/blogs');
  //app.get('/api/blogs', blogs.all);
  //app.post('/api/blogs', auth.ensureAuthenticated, blogs.create);
  //app.get('/api/blogs/:blogId', blogs.show);
  //app.put('/api/blogs/:blogId', auth.ensureAuthenticated, auth.blog.hasAuthorization, blogs.update);
  //app.delete('/api/blogs/:blogId', auth.ensureAuthenticated, auth.blog.hasAuthorization, blogs.destroy);

  ////Setting up the blogId param
  //app.param('blogId', blogs.blog);

  // Angular Routes
  //app.get('/partials/*', function(req, res) {
  //  var requestedView = path.join('./', req.url);
  //  res.render(requestedView);
  //});

  //app.get('/*', function(req, res) {
  //  if(req.user) {
  //    res.cookie('user', JSON.stringify(req.user.user_info));
  //  }

  //  res.render('index.html');
  //});

