'use strict';

module.exports = function (app, ctrls) {
    //app.get('/api/users/:page/:limit', ctrls.user.isAuthenticated, ctrls.employ.list);
    app.get('/api/employ/:page/:limit', ctrls.employ.list);
    app.post('/api/employ/:page/:limit', ctrls.employ.list);
    app.post('/api/employ', ctrls.employ.create);
    app.put('/api/employ', ctrls.employ.update);
    app.delete('/api/employ/:oid/:id', ctrls.employ.delete);

}  