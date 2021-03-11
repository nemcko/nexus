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
    app.get('/api/kbase/search', ctrls.user.isAuthenticated,ctrls.kbase.search);
    app.post('/api/kbase/search', ctrls.user.isAuthenticated,ctrls.kbase.search);
    app.post('/api/kbase/detail', ctrls.user.isAuthenticated,ctrls.kbase.detail);
    app.post('/api/kbase/catlist', ctrls.user.isAuthenticated,ctrls.kbase.catlist);
    app.post('/api/kbase/kbnew', ctrls.user.isAuthenticated,ctrls.kbase.kbnew);
    app.post('/api/updarticle', ctrls.user.isAuthenticated,ctrls.kbase.updarticle);
    app.post('/api/updarticle/:id', ctrls.user.isAuthenticated,ctrls.kbase.updarticle);
    app.post('/api/delarticle/:id', ctrls.user.isAuthenticated,ctrls.kbase.delarticle);
    app.post('/api/updcomment', ctrls.user.isAuthenticated,ctrls.kbase.updcomment);
    app.post('/api/delcomment/:id', ctrls.user.isAuthenticated,ctrls.kbase.delcomment);
    app.post('/api/savenewkbitem/:id', ctrls.user.isAuthenticated,ctrls.kbase.savenewkbitem);

    app.get('/api/kbcateg/:page/:limit', ctrls.user.isAuthenticated, ctrls.kbase.list);
    app.post('/api/kbcateg/:page/:limit', ctrls.user.isAuthenticated, ctrls.kbase.list);
    app.post('/api/kbcateg', ctrls.user.isAuthenticated, ctrls.kbase.create);
    app.put('/api/kbcateg', ctrls.user.isAuthenticated, ctrls.kbase.update);
    app.delete('/api/kbcateg/:oid/:id', ctrls.user.isAuthenticated, ctrls.kbase.delete);

    app.get('/kbattach/:atid/:uri', ctrls.kbase.attachment);

}  