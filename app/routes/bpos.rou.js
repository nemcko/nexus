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
    app.get('/api/bpos/:page/:limit', ctrls.user.isAuthenticated,ctrls.bpos.list);
    app.post('/api/bpos/:page/:limit', ctrls.user.isAuthenticated,ctrls.bpos.list);
    app.post('/api/bpos', ctrls.user.isAuthenticated,ctrls.bpos.create);
    app.put('/api/bpos', ctrls.user.isAuthenticated,ctrls.bpos.update);
    app.delete('/api/bpos/:oid/:id', ctrls.user.isAuthenticated, ctrls.bpos.delete);

    app.post('/api/optviews', ctrls.user.isAuthenticated, ctrls.bpos.optviews);
    app.post('/api/dashboard/:id', ctrls.user.isAuthenticated, ctrls.bpos.dashboard);
    app.post('/api/board/:id', ctrls.user.isAuthenticated, ctrls.bpos.board);
    app.post('/api/dashboards', ctrls.user.isAuthenticated, ctrls.bpos.dashboards);

}  