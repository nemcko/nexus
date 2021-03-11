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
    app.get('/api/searchs/:page/:limit', ctrls.user.isAuthenticated,ctrls.search.list);
    app.post('/api/searchs/:page/:limit', ctrls.user.isAuthenticated,ctrls.search.list);
    app.post('/api/searchs', ctrls.user.isAuthenticated,ctrls.search.create);
    app.put('/api/searchs', ctrls.user.isAuthenticated,ctrls.search.update);
    app.delete('/api/searchs/:oid/:id', ctrls.user.isAuthenticated, ctrls.search.delete);
    app.post('/api/searchs/accids', ctrls.user.isAuthenticated, ctrls.search.accids);

}  