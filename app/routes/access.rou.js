/**
 * @module Route Access module 
 * @description Access module routing for Express.
 */

'use strict';

/*
 * Export routes for RESTfull interface.
 * @param app {Object} Express js application object.
 * @param ctrls {Object} Controller collection.
 */
module.exports = function (app, ctrls) {
    app.get('/api/access/:page/:limit', ctrls.user.isAuthenticated,ctrls.access.list);
    app.post('/api/access/:page/:limit', ctrls.user.isAuthenticated,ctrls.access.list);
    app.post('/api/access', ctrls.user.isAuthenticated,ctrls.access.create);
    app.put('/api/access', ctrls.user.isAuthenticated,ctrls.access.update);
    app.delete('/api/access/:oid/:id', ctrls.user.isAuthenticated,ctrls.access.delete);
}  