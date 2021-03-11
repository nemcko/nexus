'use strict';
var mongoose = require('mongoose')
  , async = require("async")
  , User = require('../models/user.mod.js')
  , Ticket = require('../models/ticket.mod.js')
  , TicketLog = require('../models/ticketlog.mod.js')
  , TicketAtt = require('../models/ticketatt.mod.js')
  , config = require('../../config')
  , Autom = require('../lib/autom.js')
  , Services = require('../models/autosvc.mod.js')
  , htmlToText = require('html-to-text')
  , crc = require('crc')
  ;

mongoose.connect(config.mongoUri);


process.on('uncaughtException', function (er) {
    if (er) {
        console.log('ERROR');
        console.error(er.stack);
    }
    process.exit(1)
})

setTimeout(function () {
    process.exit(0);
}, Math.min(config.intervalTask, config.intervalService) * 60000);
runService();

function runService() {
    var curdate = new Date();
    //console.log(curdate.toISOString(), '=====Service start=====');
    
    Ticket.find({
        $or: [
            {
                $and: [
                    { notifyAtDate: { $ne: null } },
                    { notifyAtDate: { $lte: curdate } },
                ]
            }, 
            {
                $and: [
                    { reopenAtDate: { $ne: null } },
                    { reopenAtDate: { $lte: curdate } },
                ]
            }
        ]
    })
    .exec(function (err, tickets) {
        if (err) return console.log(curdate.toISOString(), 'Invalid query data');
        tickets.map(function (ticket) {
            var bnotify = false
              , bopen = false;
            if (ticket.notifyAtDate && ticket.notifyAtDate <= curdate) {
                bnotify = true;
            }
            if (ticket.reopenAtDate && ticket.reopenAtDate <= curdate) {
                bopen = true;
            }
            if (bnotify || bopen) {
                
                var ticketLog = new TicketLog()
                  , actFn = function (msg) { 
                        console.log(JSON.stringify({
                            from: config.automuser,
                            to: msg.value,
                            subject: msg.message.title,
                            message: msg.message.body
                        }));
                        Autom.sendInstantMessage(ticket, msg.value, msg.message.title, msg.message.body, function (err, msg) { 
                            if (err) console.log(err);
                        });
                    }
                  , state = {
                        request: {
                            user: {
                                username: config.automuser
                            },
                            body: {
                                rowdata: {
                                    requester: ticket.requester
                                }
                            }
                        },
                        changes: {},
                        retval: {
                            items: []
                        },
                        isNew: false
                    };
                Autom.assignRefData(state, function (err) {
                    
                    state.retval.items.ticnum = ticket.ticnum;
                    state.logDate = new Date();
                    state.hidden = false;

                    ticketLog.ticnum = state.retval.items.ticnum 
                    ticketLog.logDate = state.logDate;
                    ticketLog.logUser = state.logUser;
                    ticketLog.strOrgan = state.strOrgan;
                    ticketLog.strGroup = state.strGroup;
                    ticketLog.strRequester = state.strRequester;
                    ticketLog.strRequestcc = state.strRequestcc;
                    ticketLog.strRequestbc = state.strRequestbc;
                    ticketLog.strAgent = config.automuser;
                    ticketLog.updaterType = Autom.getUpdaterType(state.logUser);
                    ticketLog.createDate = new Date();
                    ticketLog.createUser = state.request.user.username;
                    
                    if (bopen) {
                    }
                    
                    ticket.logs.unshift(ticketLog);
                    
                    Autom.fireTriggers(Services, ticket, ticketLog, actFn, function () {
                        if (bnotify) {
                            console.log(ticketLog.logDate.toISOString(), 'Notify');
                            ticket.notifyAtDate = null;
                        }
                        if (bopen) {
                            console.log(ticketLog.logDate.toISOString(), 'Open ticket');
                            ticket.reopenAtDate = null;
                            ticket.status = 'open';
                            
                            var tobj = {
                                service: {
                                    changes: {
                                        'status': {
                                            "to": "open",
                                            "from": ticket.status
                                        }
                                    }
                                }
                            };
                            
                            if (!ticketLog.autosvc)
                                ticketLog.autosvc = [];
                            ticketLog.autosvc.push(tobj);

                        }
                        ticket.updaterType = Autom.getUpdaterType(state.logUser);
                        ticket.save(function (err, result) {
                            ticketLog.save(function (err, result) {
                                //if (err) return callback3(400, err);
                                if (bnotify) {
                                }
                                if (bopen) {
                                }
                                
                                return;
                            });
                        });

                    });
                });
            }
        });
    });

}

function updTicket(state, ticket, callback) {
    var ticketLog = new TicketLog();
    
    if (state.isNew) {
        state.request.body.rowdata.status = 'new';
        ticket.status = 'new';
    }
    
    state.request.body.rowdata.updaterType = state.updaterType;
    state.logDate = state.date;
    state.hidden = false;
    
    state.request.body.rowdata.updateDate = state.logDate;
    state.retval.items.updateDate = state.logDate;
    
    if (state.request.body.rowdata.comment) {
        var txt = htmlToText.fromString(state.request.body.rowdata.comment, { wordwrap: 80 });
        if (txt.length > 240) txt = txt.substring(0, 235) + ' ...';
        state.request.body.rowdata.lastComment = txt;
        state.retval.items.lastComment = txt;
        ticket.lastComment = txt;
    }
    
    if (state.request.body.attachfiles && state.request.body.attachfiles.length) {
        state.atid = state.retval.items.ticnum + new Date().getTime();
    }
    Autom.assignRefData(state, function (err, msg) {
        if (state.isNew) {
            ticket.ticnum = state.request.body.rowdata.ticnum;
            ticket.priority = 'normal';
            ticket.createDate = new Date();
            ticket.createUser = config.automuser
            
            if (state.retval.items.strOrgan) {
                ticket.strOrgan = state.strOrgan;
            }
            if (state.retval.items.strGroup) {
                ticket.strGroup = state.strGroup;
            }
            if (state.retval.items.strRequester) {
                ticket.strRequester = state.strRequester;
            }
            if (state.retval.items.strRequestcc) {
                ticket.strRequestcc = state.strRequestcc;
            }
            if (state.retval.items.strRequestbc) {
                ticket.strRequestbc = state.strRequestbc;
            }
            if (state.retval.items.strAgent) {
                ticket.strAgent = state.strAgent;
                ticket.assignee = state.strAgent;
            }
        } else {
            console.log(state.request.body.rowdata.subject, ticket.ticnum);
        }

        ticketLog.ticnum = state.request.body.rowdata.ticnum;
        ticketLog.logDate = state.logDate;
        ticketLog.logUser = state.logUser;
        ticketLog.strOrgan = state.strOrgan;
        ticketLog.strGroup = state.strGroup;
        ticketLog.strRequester = state.strRequester;
        ticketLog.strRequestcc = state.strRequestcc;
        ticketLog.strRequestbc = state.strRequestbc;
        ticketLog.strAgent = state.strAgent;
        ticketLog.updaterType = state.updaterType
        ticketLog.createDate = new Date();
        ticketLog.createUser = config.automuser
        
        async.series([
            function (callback3) {
                async.parallel([
                    function (callback1) {
                        User.find({ username: config.automuser }, function (err, result) {
                            if (err) return callback1();
                            if (result.length) {
                                ticketLog.logUser = result[0]._id;
                                state.logUser = result[0];
                                state.updaterType = Autom.getUpdaterType(state.logUser);
                                ticket.updaterType = state.updaterType;
                                state.retval.items.updaterType = state.updaterType;
                            };
                            callback1();
                        });
                    },
                    function (callback1) {
                        if (state.atid) {
                            var items = new TicketAtt();
                            items.ticnum = state.retval.items.ticnum;
                            items.atid = state.atid;
                            items.msgid = state.msgid;
                            items.attachment = state.request.body.attachfiles;
                            items.save(function (err, result) {
                                //if (err) return callback(400, err);
                                callback1();
                            });
                        } else {
                            callback1();
                        }
                    }
                ], function (err, msg) {
                    return callback3();
                });
            },
            function (callback3) {
                var actFn = function (msg) { 

                };
                ticket.logs.unshift(ticketLog);
                Autom.fireTriggers(Triggers, ticket, ticketLog, actFn, callback3);
            },
            function (callback3) {
                ticket.updaterType = state.updaterType;
                ticket.save(function (err, result) {
                    return callback3();
                });
            },
            function (callback3) {
                Autom.copyTicket(ticketLog, state.retval.items, state);
                ticketLog.logDate = state.logDate;
                ticketLog.msgid = state.msgid;
                ticketLog.save(function (err, result) {
                    if (err) return callback3(400, err);
                    return callback3();
                });
            }
        ], function (err, msg) {
            if (err) return callback(err);
            return callback();
        });
    });
}
