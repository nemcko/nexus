/**
 * @module Route Ticket module 
 * @description Ticket module routing for Express.
 */

'use strict';

/*
 * Export routes for RESTfull interface.
 * @param app {Object} Express js application object.
 * @param ctrls {Object} Controller collection.
 */
module.exports = function (app, ctrls) {
    app.get('/api/ticket/:page/:limit', ctrls.user.isAuthenticated,ctrls.ticket.list);
    app.post('/api/ticket/:page/:limit', ctrls.user.isAuthenticated,ctrls.ticket.list);
    app.post('/api/ticket', ctrls.user.isAuthenticated,ctrls.ticket.create);
    app.put('/api/ticket', ctrls.user.isAuthenticated,ctrls.ticket.update);
    app.delete('/api/ticket/:oid/:id', ctrls.user.isAuthenticated, ctrls.ticket.delete);
     
    app.get('/api/bookmark/:id/:bookmarkfn', ctrls.user.isAuthenticated,ctrls.ticket.hasBookmark);
    app.post('/api/bookmark/:id/:bookmarkfn', ctrls.user.isAuthenticated,ctrls.ticket.setBookmark);
    app.delete('/api/bookmark/:id/:bookmarkfn', ctrls.user.isAuthenticated, ctrls.ticket.delBookmark);
    app.post('/api/setbookmarks', ctrls.user.isAuthenticated,ctrls.ticket.setBookmarks);

    app.get('/api/ticnum', ctrls.user.isAuthenticated, ctrls.ticket.ticnum);
    app.get('/api/ticketdata/:id', ctrls.user.isAuthenticated, ctrls.ticket.ticketdata);
    app.get('/api/ticketnum/:id', ctrls.user.isAuthenticated, ctrls.ticket.ticketnum);

    app.post('/api/optassignee', ctrls.user.isAuthenticated,ctrls.ticket.optassignee);
    app.post('/api/optrequester', ctrls.user.isAuthenticated, ctrls.ticket.optrequester);
    app.post('/api/opttags', ctrls.user.isAuthenticated, ctrls.ticket.opttags);
    app.post('/api/attachfile/:tid', ctrls.user.isAuthenticated, ctrls.ticket.attachfile);

    app.get('/attachment/:atid/:uri', ctrls.ticket.attachment);

    app.post('/api/dobookmark/:page/:limit', ctrls.user.isAuthenticated, ctrls.ticket.dobookmark);
    app.post('/api/nextticket/:page/:limit', ctrls.user.isAuthenticated, ctrls.ticket.nextticket);
    app.post('/api/applyticketchanges/:page/:limit', ctrls.user.isAuthenticated, ctrls.ticket.applyTicketChanges);
    app.post('/api/searchpanel/:page/:limit', ctrls.user.isAuthenticated, ctrls.ticket.searchPanel);
    app.post('/api/kbcheck/:id', ctrls.user.isAuthenticated, ctrls.ticket.kbcheck);

    //app.get('/attachment/:ticnum/:atid/:uri', ctrls.user.isAuthenticated, ctrls.ticket.attachment);

    //app.get('/api/mail/:page/:limit', ctrls.user.isAuthenticated,ctrls.ticket.mail);
    //app.post('/api/mail/:page/:limit', ctrls.user.isAuthenticated,ctrls.ticket.mail);
}  