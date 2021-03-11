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
    app.get('/api/view/:page/:limit', ctrls.user.isAuthenticated,ctrls.view.list);
    app.post('/api/view/:page/:limit', ctrls.user.isAuthenticated,ctrls.view.list);
    app.post('/api/view', ctrls.user.isAuthenticated,ctrls.view.create);
    app.put('/api/view', ctrls.user.isAuthenticated,ctrls.view.update);
    app.delete('/api/view/:oid/:id', ctrls.user.isAuthenticated, ctrls.view.delete);
    app.put('/api/testview/:page/:limit', ctrls.user.isAuthenticated, ctrls.view.test);

    app.post('/api/view/accids', ctrls.user.isAuthenticated, ctrls.view.accids);
    app.post('/api/panelviews', ctrls.user.isAuthenticated, ctrls.view.panelViews);

}  