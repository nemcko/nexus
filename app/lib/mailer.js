'use strict';
var mongoose = require('mongoose')
  , async = require("async")
  , path = require('path')
  , Group = require('../models/group.mod.js')
  , User = require('../models/user.mod.js')
  , Ticket = require('../models/ticket.mod.js')
  , TicketLog = require('../models/ticketlog.mod.js')
  , Ticketdel = require('../models/ticketdel.mod.js')
  , TicketAtt = require('../models/ticketatt.mod.js')
  , Triggers = require('../models/autotrg.mod.js')
  , LastTicket = require('../lib/lastTicket.js')
  , Organ = require('../models/organ.mod.js')
  , config = require('../../config')
  , Autom = require('../lib/autom.js')
  , mime = require('mime')
  , mimelib = require("mimelib")
  , htmlToText = require('html-to-text')
  , crc = require('crc')
  ;


mongoose.connect(config.mongoUri);


process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

process.on('uncaughtException', function (er) {
    if (er) {
        console.log('ERROR');
        console.error(er.stack);
    }
    

    process.exit(1);
})

setTimeout(function () {
    process.exit(0);
}, Math.min(config.intervalTask, config.intervalMail) * 60000);

runMailer();

function runMailer(callback) {
    config.profiles.forEach(function (prof) {
        loadMail(prof.conn);
    });
}

function loadMail(cfg, nextLoad) {
    var imaps = require('imap-simple');
    
    var config = {
        imap: {
            user: cfg.username,
            password: cfg.password,
            host: cfg.reshost,
            port: cfg.resport,
            tls: cfg.secure,
            authTimeout: 3000
        }
    };
    imaps.connect(config).then(function (connection) {
        
        connection.openBox('INBOX').then(function () {
            
            var delay = 10 * 24 * 3600 * 1000;
            //var delay = 24 * 3600 * 1000;
            var yesterday = new Date();
            yesterday.setTime(Date.now() - delay);
            yesterday = yesterday.toISOString();
            var searchCriteria = ['ALL', ['SINCE', yesterday]];
            //var searchCriteria = ['UNSEEN', ['SINCE', yesterday]];
            var fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], struct: true , markSeen: false };
            return connection.search(searchCriteria, fetchOptions);
        }).then(function (messages) {
            async.each(messages, function (message, callback) {
                var msgid = cfg.username + '#' + message.attributes.uid;

                async.series([
                    function (callback1) {
                        Ticketdel.findOne({ msgid: msgid }, function (err, dtic) {
                            if (dtic) {
                                return callback1(400, 'deleted ticket');
                            }
                            else {
                                return callback1();
                            }
                        });
                    },
                    function (callback1) {
                        TicketLog.findOne({ msgid: msgid }, function (err, log) {
                            if (log) {
                                return callback1(400, 'duplication');
                            }
                            else {
                                return callback1();
                            }
                        });
                    },
                ], function (err, msg) {
                    var headers
                      , parts
                      , mparts = [];

                    if (err) {
                        if (err && err !== 400) console.dir(msg);
                        callback();
                    } else {
                        message.parts.map(function (part) {
                            if (part.which.match(/^header/i)) {
                                headers = part.body;
                                if (!headers.to) headers.to = [cfg.username];
                                if (!headers.subject) headers.subject = [''];
                            }
                        });
                        
                        parts = imaps.getParts(message.attributes.struct);

                       
                        mparts = mparts.concat(parts.filter(function (part) {
                            return part.type == 'text' && (part.subtype == 'plain' || part.subtype == 'html') 
                        || part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
                        }));
                        var state = {
                            request: {
                                user: {
                                    username: Autom.GetEmailsFromString(headers.to[0])[0].emailaddress
                                },
                                body: {
                                    rowdata: {
                                        subject: headers.subject[0],
                                        requester: Autom.GetEmailsFromString(headers.from[0])[0].emailaddress,
                                        comment: '',
                                        notifyAtDate: null,
                                        reopenAtDate: null,
                                    },
                                    attachfiles: []
                                    //attachments: []
                                }
                            },
                            changes: {},
                            retval: {
                                items: []
                            },
                            isNew: false,
                            notifyAtDate: null,
                            reopenAtDate: null,
                            msgid: msgid,
                            arrfrom: headers.from,
                            arrto: headers.to,
                            date: message.attributes.date.toISOString(),
                            requester: Autom.GetEmailsFromString(headers.from[0])[0].emailaddress,
                            subject: headers.subject[0],
                        }, btxt = '';
                        
                       
                        async.map(mparts, function (part, next) {
                            connection.getPartData(message, part, function (err, partData) {
                                if (err) return next(err);
                                if (part.type == 'text' && part.subtype == 'html') {
                                    state.request.body.rowdata.comment = partData;
                                } else if (part.type == 'text' && part.subtype == 'plain') {
                                    btxt = partData;
                                } else if (part.type != 'text') {
                                    var fname = (part.disposition && part.disposition.params && part.disposition.params.filename ? mimelib.decodeMimeWord(part.disposition.params.filename):'noname.dat') || 'noname.dat';
                                    //state.request.body.attachments.push({
                                    state.request.body.attachfiles.push({
                                        uri: Autom.removeDiacritic(fname),
                                        filename: fname,
                                        type: mime.lookup(fname),
                                        data: partData
                                    });
                                }
                                next();
                            });
                        }, function (err, results) {

                            if (state.request.body.rowdata.comment == '') {
                                state.request.body.rowdata.comment = btxt;
                            }
                            state.request.body.rowdata.comment = Autom.getMailComment(state.request.body.rowdata.comment);
                            insertMail(state, callback);
                        });
                    }
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }, function (err) {
            console.log(err);
        })
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });

    if (nextLoad) {
        nextLoad();
    }
};

function insertMail(state,nextMessage) {
    var subjectorg = state.request.body.rowdata.subject
      , ticketNr = Autom.getTicketNumber(subjectorg)
      , subject = Autom.formatrSubject(subjectorg)
      , ticket;
    
    async.series([
        function (callback1) {
            if (ticket) {
                return callback1();
            } else {
                if (ticketNr) {
                    Ticket.findOne({ ticnum: ticketNr }, function (err, tic) {
                        if (!tic) {
                            ticket = new Ticket();
                            
                            state.isNew = true;
                            ticket.requestDate = state.date;
                            ticket.updateDate = state.date;
                            ticket.msgid = state.msgid;
                            ticket.subject = subject;
                            ticket.requester = state.request.body.rowdata.requester;
                            ticket.logs = [];

                            //state.subject = subject;                          
                            state.ticnum = ticketNr;
                            state.request.body.rowdata.ticnum = ticketNr;
                            state.atid = crc.crc32(state.ticnum + '_' + new Date().getTime()).toString();

                            ticket.ticnum = ticketNr;
                            console.log('newTicket', ticket.ticnum);
                            return callback1();
                        }
                        else {
                            ticket = tic;
                            return callback1();
                        }
                    });
                } else {
                    var fld = { ticnum: null };
                    
                    ticket = new Ticket();
                    
                    state.isNew = true;
                    ticket.requestDate = state.date;
                    ticket.updateDate = state.date;
                    ticket.msgid = state.msgid;
                    ticket.subject = subject;
                    ticket.requester = state.request.body.rowdata.requester;
                    ticket.logs = [];

                    //state.subject = subject;

                    LastTicket(fld, function () {
                        state.ticnum = fld.ticnum;
                        state.request.body.rowdata.ticnum = fld.ticnum;
                        ticket.ticnum = fld.ticnum;
                        state.atid = crc.crc32(state.ticnum + '_' + new Date().getTime()).toString();
                        console.log('newTicket', ticket.ticnum);
                        return callback1();
                    });
                }
            }
        },

        function (callback1) {
            if (ticket) {
                async.parallel([
                    function (callback2) {
                        return Autom.checkUserExist(state, ticket, Autom.GetEmailsFromString(state.arrfrom[0])[0], callback2);
                    },
                    function (callback2) {
                        return Autom.checkUserExist(state, ticket, Autom.GetEmailsFromString(state.arrto[0])[0], callback2);
                    },
                ], function (err, result) {
                    return callback1();
                });
            } else {
                return callback1(500, 'ticket not created');
            }
        },
        function (callback1) {
            if (ticket) {
                User.find({ username: Autom.GetEmailsFromString(state.arrfrom[0])[0].emailaddress }, function (err, result) {
                    if (err) return callback1();
                    if (result.length) {
                        state.logUser = result[0];
                        ticket.updaterType = Autom.getUpdaterType(state.logUser);
                    };
                    callback1();
                });
            } else {
                return callback1(500, 'ticket not created');
            }
        },

        function (callback1) {
            if (ticket) {
                updTicket(state, ticket, callback1);
            } else {
                return callback1(500, 'ticket not created');
            }
        },
        function (callback1) {
            if (ticket) {
                ticket.save(function (err, result) {
                    return callback1();
                });
            } else {
                return callback1(500, 'ticket not created');
            }
        }
    ], function (err,msg) {
        if (err && err!==400) {
            //console.log('ERROR', err, '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
            console.dir(msg);
        };
        //console.log('end of insertMail');
        if (nextMessage) {
            return nextMessage();
        }     
    });
 
}

function updTicket(state, ticket, callback){
    var ticketLog = new TicketLog();
    
    if (state.isNew) {
        state.request.body.rowdata.status = 'new';
        ticket.status = 'new';
    }
    //state.updaterType = Autom.getUpdaterType(state.logUser);
    state.request.body.rowdata.updaterType = state.updaterType;
    state.retval.items.updaterType = state.updaterType;
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
    if (state.request.body.rowdata.subject.length > 160) state.request.body.rowdata.subject = state.request.body.rowdata.subject.substring(0, 160);

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
        
        ticketLog.ticnum = state.ticnum;
        ticketLog.msgid = state.msgid;
        ticketLog.logDate = state.logDate;
        ticketLog.logUser = state.logUser;
        ticketLog.strOrgan = state.strOrgan;
        ticketLog.strGroup = state.strGroup;
        ticketLog.strRequester = state.strRequester;
        ticketLog.strRequestcc = state.strRequestcc;
        ticketLog.strRequestbc = state.strRequestbc;
        ticketLog.strAgent = state.strAgent;
        ticketLog.subject = state.request.body.rowdata.subject;
        ticketLog.updaterType = state.updaterType
        ticketLog.createDate = new Date();
        ticketLog.createUser = config.automuser

        async.series([
            function (callback3) {
                async.parallel([
                    function (callback1) {
                        User.find({ username: state.request.body.rowdata.requester }, function (err, result) {
                            if (err) return callback1();
                            if (result.length) {
                                ticketLog.logUser = result[0];
                            };
                            callback1();
                        });
                    },
                    function (callback1) {
                        if (state.atid) {
                            var items = new TicketAtt();
                            async.each(state.request.body.attachfiles, function (file, callback) {
                                var data = new Buffer(file.data).toString('base64');
                                items.attachment.push({
                                    uri: file.uri,
                                    filename: file.filename,
                                    type: file.type,
                                    data: 'data:' + file.type + ';base64,' + data
                                });
                                callback();
                            }, function (err) {
                                items.ticnum = state.retval.items.ticnum;
                                items.atid = state.atid;
                                items.msgid = state.msgid;
                                //items.attachment = state.request.body.attachfiles;
                                items.save(function (err, result) {
                                    //if (err) return callback(400, err);
                                    callback1();
                                });
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
                var actFn = function (msg) { };
                ticket.logs.unshift(ticketLog);
                Autom.fireTriggers(Triggers, ticket, ticketLog, actFn, callback3);
            },
            function (callback3) {
                Autom.copyTicket(ticketLog, state.retval.items, state);
                ticketLog.ticnum = state.ticnum;
                ticketLog.logDate = state.logDate;
                ticketLog.msgid = state.msgid;
                ticketLog.subject = state.subject;
                ticketLog.save(function (err, result) {
                    if (err) return callback3(400, err);
                    return callback3();
                });
            }
        ], function (err, msg) {
            if (err) return callback(err);
            
            console.log(JSON.stringify({
                from: state.strRequester,
                subject: state.request.body.rowdata.subject,
                message: state.retval.items.lastComment
            }));

            return callback();
        });
    });
}