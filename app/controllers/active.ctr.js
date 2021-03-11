/**
 * @module Active Controller
 * @description Active Users modul
 */

'use strict';

/** Module objects. */
var Crud = require('../lib/crud.js')
  , root = {};

/**
 * Controller class.
 * @class
 * @classdesc The main class module Active.
 */
var Controller = function (obj) {
    root = obj;
};

/*
 * @property {object} Controller.model  - Data model.
 */
Controller.prototype.model = require('../models/active.mod.js');

/*
 * Log users activity.
 * @method Controller.userLog
 * @param msg {String} message for log file
 */
Controller.prototype.userLog = function (msg) {
    root.logger.info(msg + '\n'); 
}

/*
 * Check user timeout.
 *  @method Controller.checkActiveUsers
 */
Controller.prototype.checkActiveUsers = function () {    
    var now = new Date()
      , startdate = new Date(now);
    
    startdate.setMinutes(now.getMinutes() - root.config.loginTimeout)

    root.ctrls.user.model.find({ latestAccess: { $lt: startdate } })
    .select("username fullname name surname")
    .exec(function (err, users) {
        if (!err) {
            users.forEach(function (user) {
                root.ctrls.active.model.findOneAndRemove({ 'username': user.username }, function (err,act) {
                    if (!err && act) {
                        var msg = root.ctrls.user.getFullname(user) + ' timeout.';
                        root.ioserver.notice('timeout', user.username, msg);
                        Controller.prototype.userLog(msg);
                    }
                });
            });
        }
    });
}

/*
 * Add user into active user list.
 * @method Controller.addUser
 * @param username {String} Login user name
 */
Controller.prototype.addUser = function (username) {
    root.ctrls.user.model.findOne({ 'username': username })
        .select("username fullname name surname")
        .exec(function (err, user) {
        if (!err && user) {
            var userobj = user.toObject();
            delete userobj._id;         
            //userobj['latestAccess'] = Date.now();
            root.ctrls.active.model.findOneAndUpdate({ 'username': username }, userobj, { upsert: true }, function (err) {
                user.latestAccess = Date.now();
                user.save(function (err) {
                    var msg = root.ctrls.user.getFullname(user) + ' login.';
                    root.ioserver.notice('login', user.username, msg);
                    Controller.prototype.userLog(msg);
                    Controller.prototype.checkActiveUsers();
                });
            });
        }
    });
};

/*
 * Remove user from active user list.
 * @method Controller.delUser
 * @param username {String} Login user name
 */
Controller.prototype.delUser = function (username) {
    root.ctrls.user.model.findOne({ 'username': username })
        .select("username fullname name surname")
        .exec(function (err, user) {
        if (!err && user) {
            var userobj = user.toObject();
            delete userobj._id;
            root.ctrls.active.model.findOneAndRemove({ 'username': username }, function (err) {
                user.latestAccess = Date.now();
                user.save(function (err) {
                    var msg = root.ctrls.user.getFullname(user) + ' logout.';
                    root.ioserver.notice('logout', user.username, msg);
                    Controller.prototype.userLog(msg);
                    Controller.prototype.checkActiveUsers();
                });
            });
        }
    });
};

/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}
