/**
 * @module Route Group module 
 * @description Group module routing for Express.
 */

'use strict';

/*
 * Export routes for RESTfull interface.
 * @param app {Object} Express js application object.
 * @param ctrls {Object} Controller collection.
 */
module.exports = function (app, ctrls) {
    app.get('/api/group/:page/:limit', ctrls.user.isAuthenticated,ctrls.group.list);
    app.post('/api/group/:page/:limit', ctrls.user.isAuthenticated,ctrls.group.list);
    app.post('/api/group', ctrls.user.isAuthenticated,ctrls.group.create);
    app.put('/api/group', ctrls.user.isAuthenticated,ctrls.group.update);
    app.delete('/api/group/:oid/:id', ctrls.user.isAuthenticated,ctrls.group.delete);
    app.post('/api/group/organs', ctrls.user.isAuthenticated,ctrls.group.organs);
    app.post('/api/group/agents', ctrls.user.isAuthenticated,ctrls.group.agents);
    app.post('/api/group/grps', ctrls.user.isAuthenticated,ctrls.group.grps);
}  