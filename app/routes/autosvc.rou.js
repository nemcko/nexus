/**
 * @module Route Automation module 
 * @description Automation module routing for Express.
 */

'use strict';

/*
 * Export routes for RESTfull interface.
 * @param app {Object} Express js application object.
 * @param ctrls {Object} Controller collection.
 */
module.exports = function (app, ctrls) {
    app.get('/api/autosvc/:page/:limit', ctrls.user.isAuthenticated,ctrls.autosvc.list);
    app.post('/api/autosvc/:page/:limit', ctrls.user.isAuthenticated,ctrls.autosvc.list);
    app.post('/api/autosvc', ctrls.user.isAuthenticated,ctrls.autosvc.create);
    app.put('/api/autosvc', ctrls.user.isAuthenticated,ctrls.autosvc.update);
    app.delete('/api/autosvc/:oid/:id', ctrls.user.isAuthenticated, ctrls.autosvc.delete);
    app.put('/api/testautosvc/:page/:limit', ctrls.user.isAuthenticated, ctrls.autosvc.test);
}  