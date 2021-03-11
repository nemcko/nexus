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
    app.get('/api/card/:page/:limit', ctrls.user.isAuthenticated,ctrls.card.list);
    app.post('/api/card/:page/:limit', ctrls.user.isAuthenticated,ctrls.card.list);
    app.post('/api/card', ctrls.user.isAuthenticated,ctrls.card.create);
    app.put('/api/card', ctrls.user.isAuthenticated,ctrls.card.update);
    app.delete('/api/card/:oid/:id', ctrls.user.isAuthenticated, ctrls.card.delete);
    app.put('/api/testcard/:page/:limit', ctrls.user.isAuthenticated, ctrls.card.test);

    app.post('/api/card/accids', ctrls.user.isAuthenticated, ctrls.card.accids);

}  