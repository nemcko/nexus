/**
 * @module Route Organ module 
 * @description Organization module routing for Express.
 */

'use strict';

/*
 * Export routes for RESTfull interface.
 * @param app {Object} Express js application object.
 * @param ctrls {Object} Controller collection.
 */
module.exports = function (app, ctrls) {
    app.get('/api/organ/:page/:limit', ctrls.user.isAuthenticated,ctrls.organ.list);
    app.post('/api/organ/:page/:limit', ctrls.user.isAuthenticated,ctrls.organ.list);
    app.post('/api/organ', ctrls.user.isAuthenticated,ctrls.organ.create);
    app.put('/api/organ', ctrls.user.isAuthenticated,ctrls.organ.update);
    app.delete('/api/organ/:oid/:id', ctrls.user.isAuthenticated, ctrls.organ.delete);
    app.post('/api/organ/profiles', ctrls.user.isAuthenticated, ctrls.organ.profiles);
}  