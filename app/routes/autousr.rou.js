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
    app.get('/api/autousr/:page/:limit', ctrls.user.isAuthenticated,ctrls.autousr.list);
    app.post('/api/autousr/:page/:limit', ctrls.user.isAuthenticated,ctrls.autousr.list);
    app.post('/api/autousr', ctrls.user.isAuthenticated,ctrls.autousr.create);
    app.put('/api/autousr', ctrls.user.isAuthenticated,ctrls.autousr.update);
    app.delete('/api/autousr/:oid/:id', ctrls.user.isAuthenticated, ctrls.autousr.delete);
    app.post('/api/optmacros', ctrls.user.isAuthenticated, ctrls.autousr.optmacros);
}  