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
    app.get('/api/accview/:page/:limit', ctrls.user.isAuthenticated,ctrls.accview.list);
    app.post('/api/accview/:page/:limit', ctrls.user.isAuthenticated,ctrls.accview.list);
    app.post('/api/accview', ctrls.user.isAuthenticated,ctrls.accview.create);
    app.put('/api/accview', ctrls.user.isAuthenticated,ctrls.accview.update);
    app.delete('/api/accview/:oid/:id', ctrls.user.isAuthenticated,ctrls.accview.delete);
}  