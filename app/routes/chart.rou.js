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
    app.get('/api/chart/:page/:limit', ctrls.user.isAuthenticated,ctrls.chart.list);
    app.post('/api/chart/:page/:limit', ctrls.user.isAuthenticated,ctrls.chart.list);
    app.post('/api/chart', ctrls.user.isAuthenticated,ctrls.chart.create);
    app.put('/api/chart', ctrls.user.isAuthenticated,ctrls.chart.update);
    app.delete('/api/chart/:oid/:id', ctrls.user.isAuthenticated, ctrls.chart.delete);
    app.put('/api/testchart/:page/:limit', ctrls.user.isAuthenticated, ctrls.chart.test);

    app.post('/api/chart/accids', ctrls.user.isAuthenticated, ctrls.chart.accids);

}  