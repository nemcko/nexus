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
    app.get('/api/autotrg/:page/:limit', ctrls.user.isAuthenticated,ctrls.autotrg.list);
    app.post('/api/autotrg/:page/:limit', ctrls.user.isAuthenticated,ctrls.autotrg.list);
    app.post('/api/autotrg', ctrls.user.isAuthenticated,ctrls.autotrg.create);
    app.put('/api/autotrg', ctrls.user.isAuthenticated,ctrls.autotrg.update);
    app.delete('/api/autotrg/:oid/:id', ctrls.user.isAuthenticated,ctrls.autotrg.delete);
    app.put('/api/testautotrg/:page/:limit', ctrls.user.isAuthenticated,ctrls.autotrg.test);
}  