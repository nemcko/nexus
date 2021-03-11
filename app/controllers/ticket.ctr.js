/**
 * @module Ticket Controller
 */

'use strict';

/** Module objects. */
var Crud = require('../lib/board.js')
  , root = {}
  , async = require("async")
  , config = require('../../config')
  , Group = require('../models/group.mod.js')
  , User = require('../models/user.mod.js')
  //, TicketRen = require('../models/ticketren.mod.js')
  , TicketLog = require('../models/ticketlog.mod.js')
  , Ticketdel = require('../models/ticketdel.mod.js')
  , TicketAtt = require('../models/ticketatt.mod.js')
  , Kbase = require('../models/kbase.mod.js')
  , Kbattach = require('../models/kbattach.mod.js')
  , Kbcateg = require('../models/kbcateg.mod.js')
  //, TicketBmk = require('../models/ticketbmk.mod.js')
  , Triggers = require('../models/autotrg.mod.js')
  , LastTicket = require('../lib/lastTicket.js')
  , Access = require('../lib/access.js')
  , Organ = require('../models/organ.mod.js')
  , Autom = require('../lib/autom.js')
  , htmlToText = require('html-to-text')
  , Requester = require('../models/user.mod.js')
  , ObjectId = require('mongodb').ObjectID
  , crc = require('crc')
  , slug = require('slug')
  ;

/**
 * Controller class.
 * @class
 */
var Controller = function (obj) {
    root = obj;
};

/*
 * @property {object} Controller.model  - Data model.
 */
Controller.prototype.model = require('../models/ticket.mod.js');


/*
 * Compare field data.
 * @method Controller.compareData
 * @param name {String} fields name
 * @param arrold {Array} old field values
 * @param newval {Array} new field values
 * @param changes {Object} Change object
*/
Controller.prototype.compareData = function (name, arrold, arrnew, changes) {
    if (name !== 'tags') {
     var oldfld = (arrold[name]?arrold[name]:null)
       , newfld = (arrnew[name]?arrnew[name]:null)
       , oldval = String(oldfld).trim()
       , newval = String(newfld).trim();
        
        if (!Autom.isVirtualField(name)) {
            if (oldfld !== newfld && newfld) {
                if (newval && oldval !== newval) {
                    //arrchng.push({
                    //    'field': name,
                    //    'oldval': oldfld,
                    //    'newval': newfld
                    //})
                    if (arrnew[name]) {
                        changes[name] = { 'from': oldfld, 'to': newfld };
                        arrold[name] = newfld;
                    }
                }
            }
        }

    } else {
        var oldfld = (arrold[name]?arrold[name].join(','):'')
       , newfld = (arrnew[name]?arrnew[name].join(','):'');
        
        if (oldfld !== newfld ) {
            changes[name] = { 'from': oldfld, 'to': newfld };
            arrold[name] = arrnew[name];
        }
    }
    

}

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param state {Object} State object
 * @param callback {Function} callback function
 */
Controller.prototype.assignData = function (state, callback) {
    state.request.body.rowdata = Autom.fromTicketString(state.request.body.rowdata);
    Autom.assignRefData(state, function (err, msg) {
        if (err) return;
        if (!state.retval.items.ticnum && state.request.body.rowdata.ticnum)
            state.retval.items.ticnum = state.request.body.rowdata.ticnum;
        
        state.request.body.rowdata.status = state.request.body.option.type;
        //state.updaterType = 'Client';
        state.updaterType = Autom.getUpdaterType(state.request.user);
        if (state.updaterType) {
            state.request.body.rowdata.updaterType = state.updaterType;
            state.retval.items.updaterType = state.updaterType;
        }
        state.logDate = new Date();
        state.hidden = false;
        
        if (state.logDate) {
            state.request.body.rowdata.updateDate = state.logDate;
            state.retval.items.updateDate = state.logDate;
        } else {
            if (state.request.body.rowdata.updateDate) {
                state.retval.items.updateDate = state.request.body.rowdata.updateDate;
            }
        }

        if (state.request.body.rowdata.comment) {
            var txt = htmlToText.fromString(state.request.body.rowdata.comment, { wordwrap: 80 });
            if (txt.length > 240) txt = txt.substring(0, 235) + ' ...';
            state.request.body.rowdata.lastComment = txt;
            state.retval.items.lastComment = txt;
        }
        
        if (!state.request.body.rowdata.subject || state.request.body.rowdata.subject.trim()==="" ) state.request.body.rowdata.subject = state.request.body.rowdata.comment;
        if (state.request.body.rowdata.subject.length > 160) state.request.body.rowdata.subject = state.request.body.rowdata.subject.substring(0, 160);
        
        state.request.body.rowdata.notifyAtDate = null;
        state.retval.items.notifyAtDate = null;
        state.notifyAtDate = null;
        state.request.body.rowdata.reopenAtDate = null;
        state.retval.items.reopenAtDate = null;
        state.reopenAtDate = null;
        
        if (state.request.body.option.options) {
            state.request.body.rowdata.priority = state.request.body.option.options.priority;
            
            
            if (state.request.body.option.options.notify) {
                var dt = new Date();
                dt = new Date(dt.getTime() + eval(state.request.body.option.options.notify.value + '*60000'));
                state.request.body.rowdata.notifyAtDate = dt;
                state.retval.items.notifyAtDate = dt;
                state.notifyAtDate = dt;
            }
            if (state.request.body.option.options.open) {
                var dt = new Date();
                dt = new Date(dt.getTime() + eval(state.request.body.option.options.open.value + '*60000'));
                state.request.body.rowdata.reopenAtDate = dt;
                state.retval.items.reopenAtDate = dt;
                state.reopenAtDate = dt;
            }
        }
        if (state.request.body.rowdata.dueDate) {
            state.request.body.rowdata.dueDate = Autom.dateStringParse(state.request.body.rowdata.dueDate);
        }
        if (state.request.body.attachfiles && state.request.body.attachfiles.length) {
            state.atid = crc.crc32(state.ticnum + '_' + new Date().getTime()).toString();
        }
        if (state.request.body.rowdata.assignee && state.request.body.rowdata.assignee==='<current_user>') {
            state.request.body.rowdata.assignee = state.request.user.username;
        }
        
        //state.request.body.rowdata.subject = Autom.formatrSubject(state.request.body.rowdata.subject, state.retval.items.ticnum);
        
        if (state.request.body.option && state.request.body.option.key === 'solved-spam') {
            state.request.body.rowdata.requester = "spam@spam.sk";
        }
        if (state.request.body.option && state.request.body.option.key === 'solved-delete') {
            state.deleteticket = true;
        } 
        if (state.request.body.option && state.request.body.option.key === 'solved-kb') {
            state.solvedkb = true;
        }

        Controller.prototype.compareData('status', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('assignee', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('priority', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('dueDate', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('requester', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('requestcc', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('requestbc', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('subject', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('service', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('transport', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('purchase', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('price', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('reimburse', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('requital', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('tags', state.retval.items, state.request.body.rowdata, state.changes);
        Controller.prototype.compareData('channel', state.retval.items, state.request.body.rowdata, state.changes);
        
        
        //Controller.prototype.compareData('description', state.retval.items, state.request.body.rowdata, state.changes);
        if (state.request.body.rowdata.hidden) state.hidden = state.request.body.rowdata.hidden;
        
        if (state.solvedkb) {

        }

        callback();
    });
    
    


};

// Check for change
function isFieldChanged(state,name){
    //var changed = false;
    //changes.forEach(function (item) {
    //    if (item.field === name) changed = true;
    //});
    //return changed;
    return state.changes[name];
}

/*
 * Action before save data.
 * @method Controller.beforeSave
 * @param state {Object} State object
 * @param callback {Function} callback function
 */
Controller.prototype.beforeSave = function (state, callback) {
    state.nexttic = null;
    if (state.request.body.autoplay) {
        getNextTicket(state.retval.acc, state, function (err, selid) {
            if (state.request.body.vref === 'Search') {
                state.nexttic = selid;
                return callback();
            } else {
                Controller.prototype.model.findById(selid, { ticnum: 1 }, function (err, ticket) {
                    if (!err && ticket) state.nexttic = ticket.ticnum;
                    return callback();
                });
            }
        });
    } else {
        return callback();
    } 
}
/*
 * Action after save data.
 * @method Controller.afterSave
 * @param state {Object} State object
 * @param callback {Function} callback function
 */
Controller.prototype.afterSave = function (state, callback) {      
    var ticketLog = new TicketLog()
      , newticket = null
      ;
    
    if (state.deleteticket) {
        async.parallel([
            function (callback1) {
                var dtic = new Ticketdel();
                dtic.msgid = state.retval.items.msgid;
                dtic.ticnum = state.retval.items.ticnum;
                dtic.save(state.request, function (err, result) {
                    callback();
                });
            },
            function (callback1) {
                Controller.prototype.model.remove({ ticnum: state.retval.items.ticnum }, callback1);
            },
            function (callback1) {
                TicketLog.remove({ ticnum: state.retval.items.ticnum }, callback1);
            }
        ], function (err, msg) {
            return callback();
        });
    } else {
        
        if (state.isNew) {
            newticket = new TicketLog();
            newticket.ticnum = state.retval.items.ticnum;
            newticket.lastUpdated = new Date;
            newticket.lastUpdater = state.request.user.username
            newticket.createDate = new Date;
            newticket.createUser = state.request.user.username
        }
        

        ticketLog.lastUpdated = new Date;
        ticketLog.lastUpdater = state.request.user.username
        ticketLog.createDate = new Date;
        ticketLog.createUser = state.request.user.username
        
        async.series([
            function (callback3) {
                async.parallel([
                //function (callback1) {
                //    if (state.isNew) {
                //        TicketRen.find({ ticnum: state.retval.items.ticnum }).remove().exec(function (err, data) {
                //            return callback1();
                //        });
                //    } else {
                //        return callback1();
                //    }
                //},
                    function (callback1) {
                        User.find({ username: state.request.user.username }, function (err, result) {
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
                Controller.prototype.model.findById(state.retval.items._id, function (err, ticket) {
                    if (err || !ticket) return callback3();
                    ticket.logs.unshift(ticketLog);
                    if (newticket) {
                        ticket.logs.unshift(newticket);
                    }
                    var actFn = function (msg) { };
                    Autom.fireTriggers(Triggers, ticket, ticketLog, actFn, callback3);
                });
            },
            function (callback3) {
                if (state.request.body.rowdata && state.request.body.rowdata.privcomm)
                    state.retval.items.privcomm = state.request.body.rowdata.privcomm;
                
                if (state.isNew) {
                    newticket.ticnum = state.retval.items.ticnum;
                    newticket.status = "new";
                    newticket.event = "empty";
                    newticket.changes = {
                        "status": {
                            "to": "new",
                            "from": null
                        }
                    };
                    newticket.updaterType = state.updaterType;
                    newticket.logDate = state.logDate;
                    newticket.logUser = ticketLog.logUser;
                    
                    newticket.strOrgan = state.strOrgan;
                    newticket.strGroup = state.strGroup;
                    newticket.strRequester = state.strRequester;
                    newticket.strRequestcc = state.strRequestcc;
                    newticket.strRequestbc = state.strRequestbc;
                    newticket.strAgent = state.strAgent;
                    
                    newticket.hidden = true;

                    Autom.copyTicket(ticketLog, state.retval.items, state);                    
                    ticketLog.save(function (err, result) {
                        if (err) return callback3(400, err);
                        newticket.save(function (err, result) {
                            if (err) return callback3(400, err);
                            return callback3();
                        });
                    });
                } else {
                    Autom.copyTicket(ticketLog, state.retval.items, state);
                    ticketLog.save(function (err, result) {
                        if (err) return callback3(400, err);
                        return callback3();
                    });
                }
            },
            function (callback3) {
                if (state.request.body.rowdata && state.request.body.rowdata.comment) {
                    Autom.sendEmail('normal', config, state, callback3);
                } else callback3();
            },
            function (callback3) {
                if (state.nexttic) {
                    Controller.prototype.model.findOne({ ticnum: state.nexttic }, { ticnum: 1 }, function (err, ticket) {
                        if (err) return callback3();
                        getTicketData(ticket._id, function (err, result) {
                            //state.retval.items = Object.assign(state.retval.items._doc, result);
                            state.retval.items = result;
                            state.retval.items.autoplay = true;
                            callback3();
                        });
                    });

                } else return callback3();
            }
        ], function (err, msg) {
            if (err) {
                Controller.prototype.model.findById(state.retval.items._id, function (er, ticket) {
                    if (er || !ticket) callback();
                    ticket.logs.shift(ticketLog);
                    ticket.save(function (er, result) {
                        ticketLog.remove(function (er) {
                            return callback(err, msg);
                        });
                    });
                });
            } else {

                if (state.solvedkb) {
                        Controller.prototype.model.findById(state.retval.items._id, function (er, ticket) {
                            var userId = new ObjectId(state.request.user._id);
                            if (er || !ticket) return callback();
                            saveTicketToKb(state, ticket, function (err) {
                                if (err) return callback(400, err);
                                if (ticket.viewed && ticket.viewed.indexOf(userId) >= 0) return callback();
                                ticket.viewed.unshift(userId);
                                ticket.save(function (er, result) {
                                    return callback();
                                });
                            });
                       });
                } else {
                    return callback();
                }
            }
        });

    }
}

function saveTicketToKb(state, ticket, callback) {
    Kbase.find({ ticnum: ticket.ticnum }, function (err, result) {
        var msgs = [];
        if (!err && result.length) return callback(400, 'Duplicit record');
        async.eachSeries(ticket.logs, function (objidlog, next) {
            TicketLog.findById(objidlog, function (err, log) {
                if (log) {
                    var mmessage = {};
                    msgs.push(mmessage);
                    
                    User.populate(log, { path: 'logUser' , select: '_id username fullname phone' }, function (err, log) {
                        Autom.getAvatar(log.logUser._id, function (avatar) {
                            var month = log.logDate.getMonth() + 1;
                            var day = log.logDate.getDate();
                            var port = state.request.app.settings.port || config.serverPort;
                            var urlpref = state.request.protocol + '://' + state.request.hostname + (port == 80 || port == 443 ? '' : ':' + port);
                            var dattime = (day < 10 ? '0' : '') + day + "." 
                          + (month < 10 ? '0' : '') + month + '.' 
                          + log.logDate.getFullYear() 
                          + ' ' + ("00" + log.logDate.getMinutes()).slice(-2) 
                          + ':' + ("00" + log.logDate.getSeconds()).slice(-2);
                            
                            
                            mmessage.urlpref = urlpref;
                            mmessage.imageurl = '/api/image/' + log.logUser._id;
                            //mmessage.imageurl = avatar.src;
                            mmessage.fullname = log.logUser.fullname;
                            mmessage.username = log.logUser.username + ' ' + dattime;
                            mmessage.phone = log.logUser.phone;
                            mmessage.comment = log.comment;
                            mmessage.commenttxt = htmlToText.fromString(log.comment, { wordwrap: 80 });                      ;
                            mmessage.attachments = [];
                            
                            if (log.atid) {
                                TicketAtt.findOne({ atid: log.atid }, function (err, attach) {
                                    var files = [];
                                    if (attach) {
                                        mmessage.attachid = attach._id;
                                        attach.attachment.map(function (att) {
                                            files.push({ uri: att.uri, filename: att.filename, type: att.type });
                                        });
                                        mmessage.attachments[log.atid] = files;
                                    };
                                    next();
                                });
                            } else {
                                next();
                            }

                        });

                    });
                } else next();
            });
        }, function (err) {
            //var messagehdr = "<style type=\"text\/css\"> table td {border-collapse: collapse;}  .delimiter {color: gainsboro;} .photo {width: 32px;display: inline-block;box-sizing: border-box;margin-right: 12px;border-radius: 50%;padding:4px;}  .fullname {color: dimgray;}  .username {color: silver;} .attachment {display:block;padding-right:4px;}  <\/style><\/head><body style=\"width: 100%!important; margin: 0; padding: 0;\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
            var messagehdr = "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
            var messagefdr = "</table></body></html>";
            var kbattach = null;
            
            var retval = {
                htm: messagehdr,
                txt: ''
            };
            async.eachSeries(msgs, function (msg, nextmsg) {
                retval.htm += '<tr><td colspan=\"10\" class=\"delimiter\">' + config.mesageDelimiter + '<\/td><\/tr>';
                retval.htm += '<tr><td valign=\"top\"><img src=\"IMAGEURL\" class=\"photo\"><\/td><td><table widt=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td><small class=\"fullname\">FULLNAME<\/small><\/td><\/tr><tr><td><small class=\"username\">USERNAME<\/small><\/td><\/tr><tr><td>MESSAGE<\/td><\/tr><\/table><\/td><\/tr>'
                        .replace('IMAGEURL', msg.imageurl).replace('FULLNAME', msg.fullname).replace('USERNAME', msg.username).replace('MESSAGE', msg.comment);
                
                //for (var atid in msg.attachments) {
                //    retval.htm += '<tr><td><\/td><td colspan=\"10\"><br \/>';
                //    msg.attachments[atid].map(function (file) {
                //        retval.htm += '<div class=\"attachment\"><img src=\"images/fileicons/' + file.filename.split('.').pop() + '.png\"><a href="ATTACHID/ATTACHURL"><small>ATTACHFILENAME<\/small><\/a><\/div>'.replace('ATTACHID', msg.urlpref + '\/attachment\/' + atid).replace('ATTACHURL', file.uri).replace('ATTACHFILENAME', file.filename);
                //    });
                //    retval.htm += '<\/td><\/tr>';
                //};
                //retval.htm += '<tr><td colspan=\"10\"><br \/><\/td><\/tr>';
                
                if (msg.attachid) {
                    if (!kbattach) kbattach = new Kbattach();
                    TicketAtt.findById(msg.attachid, function (err, attach) {
                        if (err || !attach) return nextmsg();
                        async.map(attach.attachment, function (aitem, cbfile) {
                            kbattach.attachment.push(aitem);
                            cbfile();
                        }, function (err) {
                            nextmsg();
                        });                       
                    });
                } else {
                    nextmsg();
                }
            }, function (err) {
                retval.htm += messagefdr;
                
                var kbase = new Kbase();
                kbase.refAuthor = state.request.user;
                kbase.ticnum = ticket.ticnum;
                kbase.title = ticket.subject;
                kbase.slug = slug(ticket.subject);
                kbase.article = retval.htm;
                if (kbattach) {
                    kbattach.refKbase = kbase._id;
                    kbattach.refKbcom = kbase._id;
                    kbattach.save(function (err, result) {
                        if (err) return callback(400, err);
                        kbase.attachment = kbattach;
                        kbase.save(function (err, result) {
                            if (err) return callback(400, err);
                            return callback(null, retval);
                        });
                    });
                } else {
                    kbase.save(function (err, result) {
                        if (err) return callback(400, err);
                        return callback(null, retval);
                    });
                }
            });
        });

    });

}

function merge(target, source) {
    
    /* Merges two (or more) objects,
       giving the last one precedence */
    
    if (typeof target !== 'object') {
        target = {};
    }
    
    for (var property in source) {
        
        if (source.hasOwnProperty(property)) {
            
            var sourceProperty = source[ property ];
            
            if (typeof sourceProperty === 'object') {
                target[ property ] = util.merge(target[ property ], sourceProperty);
                continue;
            }
            
            target[ property ] = sourceProperty;
            
        }
        
    }
    
    for (var a = 2, l = arguments.length; a < l; a++) {
        merge(target, arguments[a]);
    }
    
    return target;
};

/*
 * List of fields.
 * @method Controller.list
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.list = function (req, res) { 
    //return Crud.read(Controller, req, res, {extfields: 'strOrgan strGroup strRequester strRequestcc strRequestbc strAgent bookmark '});
    return Crud.read(Controller, req, res, {extfields: 'bookmarks '});
};

/*
 * Update list of fields.
 * @method Controller.afterRead
 * @param req {Object} Request object
 * @param res {Object} Response objectkction
 * @param view {Object} View object
 * @param state {Object} State object
 * @param retval {Object} Query object
 * @param callback {Function} callback function
 */
Controller.prototype.afterRead = function (req, res, view, state, retval, callback) {
    var userId = new ObjectId(req.user._id);
      //, bmFunction = (req.body.bookmarkfn === 'marked'?'bookmark':req.body.bookmarkfn);

    //TicketBmk.findOne({ user: userId, bookmarkfn: bmFunction})
    //    .select("bookmarks")
    //    .exec(function (err, result) {
    //    if (!err && result) {
    //        var items = [];
            
    //        if (retval.grpfld) {
    //            var grpval = '';
    //            for (var i = 0, len = retval.items.length; i < len; i++) {
    //                var item = retval.items[i];
    //                item['bookmark'] = result.bookmarks.indexOf(item._id) >= 0;
    //                delete item['bookmarks'];
    //                if (grpval !== item[retval.grpfld]) {
    //                    grpval = item[retval.grpfld];
    //                    items.push({_grpfld: grpval});
    //                }
    //                items.push(item);
    //            }
    //        } else {
    //            if (req.body.bookmarkfn === 'marked') {
    //                retval.pageTotal = 0;
    //            }
    //            for (var i = 0, len = retval.items.length; i < len; i++) {
    //                var item = retval.items[i];
    //                item['bookmark'] = result.bookmarks.indexOf(item._id) >= 0;
    //                delete item['bookmarks'];
    //                if (req.body.bookmarkfn === 'marked') {
    //                    if (item.bookmark) {
    //                        items.push(item);
    //                        retval.pageTotal++;
    //                    }
    //                } else {
    //                    items.push(item);
    //                }
    //            }
    //        }
    //        retval.pageTotal = Math.max(0, retval.pageTotal);
    //        retval.pageCount = Math.max(1, Math.floor(retval.pageTotal / retval.pageLimit));
    //        retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));


    //        retval.items = items;
    //        retval.hasbookmarks = req.body.bookmarkfn;
    //        retval.pageMarked = result.bookmarks.length;
    //        return callback(retval);
    //    } else
    //        if (retval.grpfld) {
    //            var items = []
    //              , grpval = '';
    //            for (var i = 0, len = retval.items.length; i < len; i++) {
    //                var item = retval.items[i];
    //                if (grpval !== item[retval.grpfld]) {
    //                    grpval = item[retval.grpfld];
    //                    items.push({ _grpfld: grpval });
    //                }
    //                items.push(item);
    //            }
    //            retval.items = items;
    //        }
    //        if (req.body.bookmarkfn === 'marked') {
    //            retval.pageTotal = 0;
    //            retval.pageCount = Math.max(1, Math.floor(retval.pageTotal / retval.pageLimit));
    //            retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
    //        }

    //        retval.hasbookmarks = req.body.bookmarkfn;
    //        retval.pageMarked = 0;
    //       return callback(retval);
    //});
    
    var items = []
      , grpval = ''
      , sumgrp = {}
        ;
    retval.pageMarked = 0;
    retval.hasbookmarks = req.body.bookmarkfn;
    
    if (retval.items) {
        if (retval.grpfld) {
            for (var i = 0, len = retval.items.length; i < len; i++) {
                var item = retval.items[i];
                if (!sumgrp[item[retval.grpfld]]) sumgrp[item[retval.grpfld]] = {};                
                for (var key in item) {
                    if (key !== retval.grpfld && key !== 'ticnum' && typeof item[key] === "number") {
                        if (!sumgrp[item[retval.grpfld]][key]) sumgrp[item[retval.grpfld]][key] = 0;
                        sumgrp[item[retval.grpfld]][key] += item[key];
                    }
                }
            }
        }
        for (var i = 0, len = retval.items.length; i < len; i++) {
            var item = retval.items[i];
            item['bookmark'] = item.bookmarks && item.bookmarks.indexOf(userId) >= 0;
            delete item['bookmarks'];
            if (retval.grpfld && grpval !== item[retval.grpfld]) {
                var flds = {};
                flds[retval.grpfld] = item[retval.grpfld];
                for (var key in item) {
                    if (sumgrp[item[retval.grpfld]][key]) {
                        flds[key] = sumgrp[item[retval.grpfld]][key];
                    }
                }
                grpval = item[retval.grpfld];
                items.push({ _grpfld: flds });
            }
            items.push(item);
        }
        retval.items = items;
    }

    if (req.body.bookmarkfn === 'marked') {
        retval.pageTotal = 0;
        retval.pageCount = Math.max(1, Math.floor(retval.pageTotal / retval.pageLimit));
        retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
    }

    if (retval.items && req.body.bookmarkfn) {
        //var query = Controller.prototype.model.find()
        //  , state = {
        //        request: req,
        //        changes: {},
        //        retval: {
        //            items: []
        //        },
        //        isNew: false,
        //        orgfields: []
        //    };
        //Autom.buildQuery(query, view, state);
        //query.select('bookmarks').exec(function (err, rslts) {
        //    if (rslts) {
        //        for (var i = 0, len = rslts.length; i < len; i++) {
        //            if (rslts[i].bookmarks.indexOf(userId) >= 0) {
        //                ++retval.pageMarked;
        //            }
        //        }
        //    }
        //    return callback(retval);
        //});
        
        Controller.prototype.getBookmarkCount(Access.createState(req), function (ret) {
            retval.pageMarked = ret;
            return callback(retval);
        });

    } else {
        return callback(retval);
    }
    

};

Controller.prototype.getBookmarkCount = function (state, callback) {
    var userId = new ObjectId(state.request.user._id);
    
    Controller.prototype.model.find({ "bookmarks" : { "$in" : [userId] } }).count(function (err, retval) {
        return callback(retval);
    });

};



/*
 * Create data record.
 * @method Controller.create
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.create = function (req, res) {
    return Crud.create(Controller, req, res);
}

/*
 * Update fields data.
 * @method Controller.update
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.update = function (req, res) {
    return Crud.update(Controller, req, res);
}

/*
 * Delete fields collection.
 * @method Controller.delete
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.delete = function (req, res) {
    return Crud.delete(Controller, req, res);
}
/*
 * Options to select a assignee field .
 * @method Controller.optassignee
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.optassignee = function (req, res) {
    var assignee = [ { icon: 'star', key: '-', name: '<Empty>' , itemtype: 'empty' }, { icon: 'star', key: '<current_user>', name: '<Current user>' , itemtype: 'empty' }];
    if (!req.isAuthenticated()) {
        res.status(401).json({});
    }
    async.series([
        function (callback) {
            Group.find({})
            .select("name")
            .exec(function (err, groups) {
                if (err) return callback(500, 'Invalid query data');
                groups.map(function (doc) {
                    assignee.push({ icon: 'people', key: doc.name, name: doc.name.toUpperCase() , itemtype: 'group' });
                });
                callback();
            });
        },
        function (callback) {       
            User.find({ $or: [{ usertype: 'agents' }, { usertype: 'admins' }] })
            .select("username fullname")
            .exec(function (err, users) {
                if (err) return callback(500, 'Invalid query data');
                users.map(function (doc) {
                    assignee.push({ icon: 'person', key: doc.username, name: doc.fullname?doc.fullname:doc.username , itemtype: 'user'});
                });
                callback();
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(assignee);
    });
}
/*
 * load attach file .
 * @method Controller.attachfile
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.attachfile = function (req, res) {
    var items = [];
    if (!req.isAuthenticated()) {
        res.status(401).json({});
    }
    var buf = new Buffer(req.body.toString('binary'), 'binary');
    res.status(200).json(req.params.tid + '/'+ new Date().getTime());
    //Requester.find({ name: { $regex: req.body.search , $options: "i" } })
    //.select("name surname")
    //.exec(function (err, itms) {
    //    if (err) return res.send(500, { error: err });
    //    itms.map(function (doc) {
    //        items.push({ name: doc.name + ' ' + doc.surname, key: doc.name.toLowerCase() + '.'+ doc.surname.toLowerCase() + '@xxx.sk' });
    //    });
    //    res.status(200).json(items);
    //});

}
/*
 * Options to select a requester field .
 * @method Controller.optrequester
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.optrequester = function (req, res) {
    var items = [];
    if (!req.isAuthenticated()) {
        res.status(401).json({});
    }
    Requester.find( {
        $and: [
            { $or: [{ usertype: 'endusers' }, { usertype: 'suppliers' }]}, 
            { $or: [{ username: { $regex: req.body.search , $options: "i" } }, { fullname: { $regex: req.body.search , $options: "i" } }] }
        ]
    })
    .select("username fullname")
    .exec(function (err, itms) {
        if (err) return res.send(500, { error: err });
        itms.map(function (doc) {
            if (doc.username === config.automuser) return;
            items.push({ name: doc.fullname, key: doc.username, itemtype: 'user' });
        });
        res.status(200).json(items);
    });

}
/*
 * Options to select a tags .
 * @method Controller.opttags
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.opttags = function (req, res) {
    var items = [];
    if (!req.isAuthenticated()) {
        res.status(401).json({});
    }
    Controller.prototype.model.distinct('tags').exec(function (err, itms) {
        if (err) return res.send(500, { error: err });
        var items = [];
        itms.forEach(function (itm) { 
            if (itm) items.push(itm);
        });
        res.status(200).json(items);
    });

}

/*
 * Assign new ticnum.
 * @method Controller.ticnum
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.ticnum = function (req, res) {
    var fld = { ticnum: null };
    LastTicket(fld, function () {
        res.status(200).json(fld);
    });
}
/*
 * Get ticket data.
 * @method Controller.ticketnum
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.ticketnum = function (req, res) {
    Controller.prototype.model.findOne({ ticnum: req.params.id }, function (err, ticket) {
        if (err) return res.send(500, { error: err });
        getTicketData(ticket._id, function (err, result) {
            res.status(200).json(result);
        });
    });
}

/*
 * Get attachment file.
 * @method Controller.attachment
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.attachment = function (req, res) {
    var items = [];
    TicketAtt.findOne({ atid: req.params.atid })
    .select("attachment")
    .exec(function (err, attach) {
        if (err) return res.send(500, { error: err });
        attach.attachment.map(function (att) {
            if (req.params.uri === att.uri) {
                var matches = att.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
                      , img = {};
                
                if (matches) {
                    if (matches.length !== 3) {
                        return res.send(500, { error: 'Invalid input string' });
                    }
                    img = new Buffer(matches[2], 'base64');
                } else {
                    img = att.data;
                }
                res.writeHead(200, {
                    'Content-Type': att.type,
                    'Content-Length': img.length
                });
                res.end(img);
            }
        });
        res.end();
    });

}

/*
 * Check for bookmark.
 * @method Controller.hasBookmark
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.hasBookmark = function (req, res) {
    var userId = new ObjectId(req.user._id)
      , ticketId = new ObjectId(req.params.id);
    //  , bmFunction = (req.params.bookmarkfn === 'marked'?'bookmark':req.body.bookmarkfn);
    
    //TicketBmk.findOne({ user: userId, bookmarkfn: bmFunction },{ 'bookmarks':{$elemMatch: ticketId}},
    //    function (err, result) {
    //    if (err) return res.send(500, { error: err });
    //    res.status(200).json({ msg: 'o.k.' });
    //});
    Controller.prototype.model.findById(ticketId, {bookmarks: 1}, function (err, result) {
        if (err) return res.send(500, { error: err });

        res.status(200).json({ bookmark: results.bookmarks.indexOf(userId) >= 0 });
    });
}


/*
 * Delete ticket bookmark.
 * @method Controller.delBookmark
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.delBookmark = function (req, res) {
    var userId = new ObjectId(req.user._id)
      , ticketId = new ObjectId(req.params.id);
        //, bmFunction = (req.params.bookmarkfn === 'marked'?'bookmark':req.params.bookmarkfn);
        
        //TicketBmk.findOneAndUpdate({ user: userId, bookmarkfn: bmFunction },
        //    { $pull: { bookmarks: ticketId } },
        //    { safe: true, upsert: true }, 
        //    function (err, result) {
        //    if (err) return res.send(500, { error: err });
        //    res.status(200).json({ num: result.bookmarks.length -1});
        //});
        
        Controller.prototype.model.findOneAndUpdate({ _id: ticketId },
        { $pull: { bookmarks: userId } },
        { safe: true, upsert: true }, 
        function (err, result) {
            if (err) return res.send(500, { error: err });
            Controller.prototype.getBookmarkCount(Access.createState(req), function (ret) {
                res.status(200).json({ num: ret });
            });
        });
}

/*
 * Set ticket bookmark.
 * @method Controller.setBookmark
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.setBookmark = function (req, res) {
    var userId = new ObjectId(req.user._id)
      , ticketId = new ObjectId(req.params.id);
        //, bmFunction = (req.params.bookmarkfn === 'marked'?'bookmark':req.params.bookmarkfn);
        
        //TicketBmk.findOneAndUpdate({ user: userId, bookmarkfn: bmFunction },
        //    { $pull: { bookmarks: ticketId } },
        //    { safe: true, upsert: true }, 
        //    function (err, result) {
        
        //    TicketBmk.findOneAndUpdate({ user: userId, bookmarkfn: bmFunction },
        //    { $push: { bookmarks: ticketId } },
        //    { safe: true, upsert: true }, 
        //    function (err, result) {
        //        if (err) return res.send(500, { error: err });
        //        res.status(200).json({ num: result.bookmarks.length + 1 });
        //    });
        //});
        
        
        Controller.prototype.model.findOneAndUpdate({ _id: ticketId },
        { $pull: { bookmarks: userId } },
        { safe: true, upsert: true }, 
        function (err, result) {
            
            Controller.prototype.model.findOneAndUpdate({ _id: ticketId },
        { $push: { bookmarks: userId } },
        { safe: true, upsert: true }, 
        function (err, result) {
                if (err) return res.send(500, { error: err });
                Controller.prototype.getBookmarkCount(Access.createState(req), function (ret) {
                    res.status(200).json({ num: ret });
                });
            });
        });

}


/*
 * Set ticket bookmarks.
 * @method Controller.setBookmarks
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.setBookmarks = function (req, res) {
    var userId = new ObjectId(req.user._id)
      , ids = Object.keys(req.body.ids).map(function (key) {
            return ObjectId(req.body.ids[key]);
        });

    Controller.prototype.model.find({ _id: { $in : ids } }, { bookmarks: 1 }, function (err, tickets) {
        async.each(tickets, function (ticket, callback) {
            if (req.body.remove) {
                ticket.update({ $pull: { bookmarks: userId } }, { safe: true, upsert: true }, callback);
            } else {
                ticket.update({ $push: { bookmarks: userId } }, { safe: true, upsert: true }, callback);
            }
 
        }, function (err) {
            if (err) return res.send(500, { error: err });
            Controller.prototype.getBookmarkCount(Access.createState(req), function (ret) {
                res.status(200).json({ num: ret });
            });
        });
    });
}

/*
 * Set ticket bookmark.
 * @method Controller.dobookmark
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.dobookmark = function (req, res) {
    var userId = new ObjectId(req.user._id)
      , ids = Object.keys(req.body.ids).map(function (key) { return ObjectId(req.body.ids[key]); })
      , mergeid = new ObjectId(req.body.markid)
      , MergeTicket = require('../models/ticket.mod.js');
      //, bmFunction = (req.body.bookmarkfn === 'marked'?'bookmark':req.body.bookmarkfn);

    //switch (bmFunction) {
    //    case 'assign': {
    //        TicketBmk.findOne({ user: userId, bookmarkfn: bmFunction }, function (err, result) {
    //            if (err) return res.send(500, { error: err });
    //            async.map(result.bookmarks, function (id, callback) {
    //                Controller.prototype.model.findById(id, function (err, ticket) {
    //                    if (err || !ticket) return callback(err, result);
    //                    ticket.assignee = req.user.username;
    //                    ticket.save(function (err, result) {
    //                        callback(err, result);
    //                    });
    //                });
    //            }, function (err, results) {
    //                if (err) {
    //                    res.send(500, { error: err });
    //                    return;
    //                }
    //                TicketBmk.remove({ user: userId, bookmarkfn: bmFunction }, function (err, result) {
    //                    res.status(200).json({ msg: 'o.k.' });
    //                });
    //            });
    //        });
    //    }
    //    break;
    //    case 'bookmark': {
    //        MergeTicket.findById(mergeid, function (err, mticket) {
    //            if (err) return res.send(500, { error: err });
    //            mergeTickets(req, res, mticket, function (err, result) {
    //                return res.status(200).json({ msg: 'o.k.' });
    //            });
    //        });
    //    }
    //    break;
    //    case 'mergeto': {
    //        var tobj = Autom.fromTicketString(req.body.rowdata);
    //        MergeTicket.findOneAndUpdate({ ticnum: req.body.rowdata.ticnum }, tobj, { upsert: true, 'new': true, setDefaultsOnInsert: true }, function (err, mticket) {
    //            if (err) return res.send(500, { error: err });
                
    //            async.series([
    //                function (callback3) {
    //                    return mergeTickets(req, res, mticket, callback3);
    //                },
    //                function (callback3) {
    //                    return getTicketData(mticket._id, callback3);
    //                }
    //            ], function (err, results) {
    //                if (err) return callback1(500, err);
    //                res.status(200).json(results[1]);
    //            });
    //        });
    //    }
    //    break;
    //    case '': {

    //    }
    //    break;
    //}



    var state = Access.createState(req);
    switch (req.body.bookmarkfn) {
        case 'assign': {
            Controller.prototype.model.find({ _id: { $in : ids } }, function (err, tickets) {
                async.each(tickets, function (ticket, callback) {
                    if (err || !ticket) return callback(err, ticket);
                    state.retval.items.ticnum = ticket.ticnum;
                    state.retval.items._id = ticket._id;
                    //state.updaterType = Autom.getUpdaterType(state.request.user);
                    //state.retval.items.updaterType = state.updaterType;

                    Controller.prototype.compareData('assignee', ticket, {assignee: req.user.username}, state.changes);
                    //Controller.prototype.compareData('status', ticket, { status: 'open' }, state.changes);

                    //ticket.updaterType = state.updaterType;

                    ticket.save(function (err, result) {
                        Controller.prototype.afterSave(state, function () {
                            callback(err, result);
                        });
                    });
                }, function (err) {
                    if (err) return res.send(500, { error: err });
                    return res.status(200).json({ msg: 'o.k.' });
                });
            });
        }
        break;
        case 'marked': {
            MergeTicket.findById(mergeid, function (err, mticket) {
                if (err) return res.send(500, { error: err });
                mergeTickets(req, res, mticket, function (err, result) {
                    return res.status(200).json({ msg: 'o.k.' });
                });
            });
        }
        break;
        case 'mergeto': {
            var tobj = Autom.fromTicketString(req.body.rowdata);
            MergeTicket.findOneAndUpdate({ ticnum: req.body.rowdata.ticnum }, tobj, { upsert: true, 'new': true, setDefaultsOnInsert: true }, function (err, mticket) {
                if (err) return res.send(500, { error: err });
                
                async.series([
                    function (callback3) {
                        return mergeTickets(req, res, mticket, callback3);
                    },
                    function (callback3) {
                        return getTicketData(mticket._id, callback3);
                    }
                ], function (err, results) {
                    if (err) return callback1(500, err);
                    res.status(200).json(results[1]);
                });
            });
        }
        break;
        case '': {

        }
        break;
    }




}

function mergeTickets(req, res, mticket, callback){
    var MergeTicket = require('../models/ticket.mod.js')
      , userId = new ObjectId(req.user._id)
      , sums = {
        time: 0,
        transport: 0,
        purchase: 0,
        price: 0,
    };
    
    sums.time += mticket.time;
    sums.transport += mticket.transport;
    sums.purchase += mticket.purchase;
    sums.price += mticket.price;
    
    //TicketBmk.findOne({ user: req.user._id, bookmarkfn: 'bookmark' }, function (err, result) {
    //    if (err || !result) return res.send(500, { error: err });
    //    var tickenums = []; 
    //    tickenums.push(mticket.ticnum);
    //    if (!result.bookmarks) result.bookmarks = [];
    //    async.map(result.bookmarks, function (id, callback2) {
    //        Controller.prototype.model.findById(id, function (err, ticket) {
    //            if (err || !ticket) return callback(err, ticket);
    //            if (mticket.ticnum !== ticket.ticnum) {
    //                ticket.mergedto = mticket.ticnum;
    //                mticket.mergedfrom.push(ticket.ticnum);
    //                tickenums.push(ticket.ticnum);
                    
    //                sums.service += ticket.service;
    //                sums.time += ticket.time;
    //                sums.transport += ticket.transport;
    //                sums.purchase += ticket.purchase;
    //                sums.price += ticket.price;
                    
    //                if (!mticket.subject) mticket.subject = ticket.subject;
                    
    //                ticket.save(function (err, result) {
    //                    return callback2(null, result);
    //                });
    //            } else {
    //                return callback2(null, ticket);
    //            }
    //        });
    //    }, function (err, results) {
    //        if (err) return callback(500, { error: err });
    //        var logs = [];
    //        TicketLog.find({ ticnum: { $in: tickenums } })
    //                        .sort('-logDate')
    //                        .exec(function (err, docs) {
    //            if (err) return callback(500, { error: err });
    //            docs.forEach(function (item) {
    //                logs.push(item._id);
    //            });
    //            mticket.logs = logs;
    //            mticket.time = sums.time;
    //            mticket.transport = sums.transport;
    //            mticket.purchase = sums.purchase;
    //            mticket.price = sums.price;
    //            mticket.updaterType = Autom.getUpdaterType(req.user);

    //            mticket.save(function (err, result) {
    //                if (err) return callback(500, { error: err });
    //                TicketBmk.remove({ user: req.user._id, bookmarkfn: 'bookmark' }, function (err, result) {
    //                    return callback(err, result);
    //                });
    //            });
    //        });
    //    });
    //});
    
    
    MergeTicket.find({ "bookmarks" : { "$in" : [userId] } },function (err, tickets) {
        if (err || !tickets) return res.send(500, { error: err });
        var tickenums = [];
        tickenums.push(mticket.ticnum);
        async.map(tickets, function (ticket, callback2) {
            if (!ticket.bookmarks) ticket.bookmarks = [];
            if (mticket.ticnum !== ticket.ticnum) {
                ticket.mergedto = mticket.ticnum;
                mticket.mergedfrom.push(ticket.ticnum);
                tickenums.push(ticket.ticnum);
                    
                sums.time += ticket.time;
                sums.transport += ticket.transport;
                sums.purchase += ticket.purchase;
                sums.price += ticket.price;
                    
                if (!mticket.subject) mticket.subject = ticket.subject;
                    
                ticket.save(function (err, result) {
                    return callback2(null, result);
                });
            } else {
                return callback2(null, ticket);
            }
        }, function (err, results) {
            if (err) return callback(500, { error: err });
            var logs = [];
            TicketLog.find({ ticnum: { $in: tickenums } })
                            .sort('-logDate')
                            .exec(function (err, docs) {
                if (err) return callback(500, { error: err });
                docs.forEach(function (item) {
                    logs.push(item._id);
                });
                mticket.logs = logs;
                mticket.time = sums.time;
                mticket.transport = sums.transport;
                mticket.purchase = sums.purchase;
                mticket.price = sums.price;
                mticket.updaterType = Autom.getUpdaterType(req.user);
                
                mticket.save(function (err, result) {
                    if (err) return callback(500, { error: err });
                    
                    MergeTicket.find({ "bookmarks" : { "$in" : [userId] } }, function (err, tickets) {
                        async.each(tickets, function (ticket, callback3) {
                            Controller.prototype.model.findOneAndUpdate({ _id: ticket._id },
                            { $pull: { bookmarks: userId } },
                            { safe: true, upsert: true }, 
                            function (err, result) {
                                if (err) return res.send(500, { error: err });
                                callback3(err);
                            });
                        }, function (err, rslts) {
                            return callback();
                        });
                   });  
                });
            });
        });
    });
}

function getTicketData(id, callback){
    var logProjection = {
        __v: false
        //_id: false
    }
      , usrProjection = {
            username: true,
            fullname: true,
            phone: true
        };

    Controller.prototype.model.findById(id, logProjection).populate('logs', '-_id -__v', { event: { $ne: 'empty' } }).exec(function (err, result) {
        if (err || !result) return;// res.send(500, { error: err });        

        var attachments = {};
        async.map(result.logs, function (log, next) {
            if (log.atid) {
                TicketAtt.findOne({ atid: log.atid }, function (err, attach) {
                    //TicketAtt.findOne({ ticnum: result.ticnum , atid: log.atid }, function (err, attach) {
                    var files = [];
                    if (attach) {
                        attach.attachment.map(function (att) {
                            files.push({ uri: att.uri, filename: att.filename, type: att.type });
                        });
                        attachments[log.atid] = files;
                    };
                    next();
                });
            } else next();
        }, function (err) {
            
            User.populate(result, { path: 'logs.logUser' , select: '_id username fullname phone' }, function (err, result) {
                result._doc.attachments = attachments;
                result._doc.autoplay = false;
                callback(null, Autom.toTicketString(result));
            });
    
        });
    });

}
/*
 * Get ticket data.
 * @method Controller.ticketdata
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.ticketdata = function (req, res) {
    if (!req.isAuthenticated()) {
        res.status(401).json({});
    }
    
    var data = getTicketData(req.params.id, function (err, result) {
        res.status(200).json(result);
    });
}

function getNextTicket(view, state, callback) {
    var query;
    if (state.request.body.vref === 'Search') {
        query = TicketLog.find({
            $text: {
                $search: state.request.body.search,
                $caseSensitive: false, $diacriticSensitive: false
            }
        });
        Autom.addWhereCond(query, view, state);
        query.select('ticnum');
        Autom.sortQuery(query, view, state);
        query.exec(function (err, result) {
            if (err || !result) return callback(400, err.message);
            
            var selid = null;
            if (state.request.body.ticnum) {
                for (var i = 0, len = result.length; i < len; i++) {
                    if (result[i]._doc.ticnum == state.request.body.ticnum) {
                        if (i + 1 < len)
                            selid = result[i + 1]._doc.ticnum;
                        else
                            selid = result[0]._doc.ticnum;
                        break;
                    }
                }
            } else {
                selid = result[0]._doc.ticnum;
            }
            if (selid) {
                return callback(null, selid);
                //Controller.prototype.model.findOne({ ticnum: selid }, function (err, ticket) {
                //    getTicketData(ticket._id, function (err, result) {
                //        result.autoplay = true;
                //        res.status(200).json(result);
                //        return callback();
                //    });
                //});
            } else {
                return callback(500, 'Invalid input data');
            }
        });
            
    } else {
        query = Controller.prototype.model.find();
        Autom.buildQuery(query, view, state);
        query.select('ticnum');
        Autom.sortQuery(query, view, state);
        query.exec(function (err, result) {
            if (err || !result) return callback(400, err.message);
            
            var selid = null;
            if (state.request.body.rowid) {
                for (var i = 0, len = result.length; i < len; i++) {
                    if (result[i]._doc._id == state.request.body.rowid) {
                        if (i + 1 < len)
                            selid = result[i + 1]._doc._id;
                        else
                            selid = result[0]._doc._id;
                        break;
                    }
                }
            } else {
                selid = result[0]._doc._id;
            }
            if (selid) {
                return callback(null, selid);
                //getTicketData(selid, function (err, result) {
                //    result.autoplay = true;
                //    res.status(200).json(result);
                //    return callback();
                //});
            } else {
                return callback(500, 'Invalid input data');
            }
        });
    }

}

/*
 * Get next ticket.
 * @method Controller.nextticket
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.nextticket = function (req, res) {
    var userId = new ObjectId(req.user._id)
      , bmFunction = (req.body.bookmarkfn === 'marked'?'bookmark':req.body.bookmarkfn)
      , fields = ""
      , retval = {}
      , view
      , state = {
            request: req,
            changes: {},
            retval: {
                items: []
            },
            isNew: false,
            orgfields: []
        };
                
    async.series([
        function (callback) {
            Autom.assignRefData(state, callback);
        },
        function (callback) {
            Access.getView(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No read access.');
                view = acc;
                retval.title = acc.name;
                retval.vref = acc.vref;
                retval.acc = acc.access;
                switch (acc.vref) {
                    case 'View': {
                        var flds = [];
                        acc.fields.forEach(function (fld) {
                            if (fld.indexOf('#') >= 0) {
                                state.orgfields.push({ org: fld, sel: fld.split("#")[0] });
                            }
                            flds.push(fld.split("#")[0]);
                        });
                        
                        fields += flds.join(" ");
                        retval.pageNumber = Math.max(1, parseInt(req.params.page));
                        retval.pageLimit = parseInt(req.params.limit);
                        retval.pageCount = 0;
                        retval.pageTotal = 0;
                        retval.pageMarked = 0;
                        retval.items = [];
                        retval.grpfld = '';
                        view.grpflds.forEach(function (item) {
                            retval.grpfld = item.field;
                        });
                    }
                    break;
                    default:
                        return callback();
                }
                
                return callback();
            });
        },
        function (callback) {
            getNextTicket(view, state, function (err, selid) {
                if (err) return callback(err, selid);
                if (req.body.vref === 'Search') {
                    Controller.prototype.model.findOne({ ticnum: selid }, function (err, ticket) {
                        getTicketData(ticket._id, function (err, result) {
                            result.autoplay = true;
                            res.status(200).json(result);
                            return callback();
                        });
                    });
                } else {
                    getTicketData(selid, function (err, result) {
                        result.autoplay = true;
                        res.status(200).json(result);
                        return callback();
                    });
                }
            });
        }
        //function (callback) {
        //    var query;
        //    if (req.body.vref === 'Search') {
        //        query = TicketLog.find({
        //            $text: {
        //                $search: state.request.body.search,
        //                $caseSensitive: false, $diacriticSensitive: false
        //            }
        //        });
        //        Autom.addWhereCond(query, view, state);
        //        query.select('ticnum');
        //        Autom.sortQuery(query, view, state);
        //        query.exec(function (err, result) {
        //            if (err || !result) return callback(400, err.message);
                    
        //            var selid = null;
        //            if (state.request.body.ticnum) {
        //                for (var i = 0, len = result.length; i < len; i++) {
        //                    if (result[i]._doc.ticnum == state.request.body.ticnum) {
        //                        if (i + 1 < len)
        //                            selid = result[i + 1]._doc.ticnum;
        //                        else
        //                            selid = result[0]._doc.ticnum;
        //                        break;
        //                    }
        //                }
        //            } else {
        //                selid = result[0]._doc.ticnum;
        //            }
        //            if (selid) {
        //                Controller.prototype.model.findOne({ ticnum: selid }, function (err, ticket) {
        //                    getTicketData(ticket._id, function (err, result) {
        //                        result.autoplay = true;
        //                        res.status(200).json(result);
        //                        return callback();
        //                    });
        //                });
        //            } else {
        //                return callback(500, 'Invalid input data');
        //            }
        //        });
            
        //    } else {
        //        query = Controller.prototype.model.find();
        //        Autom.buildQuery(query, view, state);
        //        query.select('ticnum');
        //        Autom.sortQuery(query, view, state);
        //        query.exec(function (err, result) {
        //            if (err || !result) return callback(400, err.message);
                    
        //            var selid = null;
        //            if (state.request.body.rowid) {
        //                for (var i = 0, len = result.length; i < len; i++) {
        //                    if (result[i]._doc._id == state.request.body.rowid) {
        //                        if (i + 1 < len)
        //                            selid = result[i + 1]._doc._id;
        //                        else
        //                            selid = result[0]._doc._id;
        //                        break;
        //                    }
        //                }
        //            } else {
        //                selid = result[0]._doc._id;
        //            }
        //            if (selid) {
        //                getTicketData(selid, function (err, result) {
        //                    result.autoplay = true;
        //                    res.status(200).json(result);
        //                    return callback();
        //                });
        //            } else {
        //                return callback(500, 'Invalid input data');
        //            }
        //        });

        //    }

        //} 
                
                

                //TicketBmk.findOne({ user: userId, bookmarkfn: bmFunction })
                //.select("bookmarks")
                //.exec(function (err, bmkres) {
                //    if (!err && bmkres) {
                        
                        
                //    }
                //    var selid = null
                //      , ids = [];

                //    for (var i = 0, len = result.length; i < len; i++) {
                //        if (req.body.bookmarkfn !== 'marked' || req.body.bookmarkfn === 'marked' && bmkres.bookmarks.indexOf(result[i]._doc._id) >= 0) {
                //            ids.push(result[i]._doc._id);
                //        }
                //    }

                //    if (state.request.body.rowid) {
                //        for (var i = 0, len = ids.length; i < len; i++) {
                //            if (ids[i] == state.request.body.rowid) {
                //                if (i + 1 < len)
                //                    selid = ids[i + 1];
                //                else
                //                    selid = ids[0];
                //                break;
                //            }
                //        }
                //    } else {
                //        selid = ids[0];
                //    }
                //    if (selid) {
                //        getTicketData(selid, function (err, result) {
                //            res.status(200).json(result);
                //            return callback();
                //        });
                //    } else {
                //        return callback(500, 'Invalid input data');
                //    }

                //});
        ], function (err, msg) {
            if (err) return res.status(err).json({ err: msg });




        });  
}

/*
 * Get next ticket.
 * @method Controller.applyTicketChanges
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.applyTicketChanges = function (req, res) {
    var userId = new ObjectId(req.user._id)
       , ids = Object.keys(req.body.ids).map(function (key) { return ObjectId(req.body.ids[key]); })
       , change = JSON.parse(req.body.changes);
         
    async.each(ids, function (id, callback) {
        Controller.prototype.model.findById(id, function (err, ticket) {
            var state = Access.createState(req);
            
            if (err || !ticket) return callback(err);
            state.updaterType = Autom.getUpdaterType(state.request.user);
            if (state.updaterType) {
                state.retval.items.updaterType = state.updaterType;
            }
            
            state.logDate = new Date();
            state.hidden = false;
            
            if (state.logDate) {
                state.retval.items.updateDate = state.logDate;
            } else {
                if (state.request.body.rowdata.updateDate) {
                    state.retval.items.updateDate = state.request.body.rowdata.updateDate;
                }
            }
            
            if (state.request.body.comment) {
                var txt = htmlToText.fromString(state.request.body.comment, { wordwrap: 80 });
                if (txt.length > 240) txt = txt.substring(0, 235) + ' ...';
                state.retval.items.lastComment = txt;
                state.retval.items.comment = state.request.body.comment;
            }
            
            state.retval.items.notifyAtDate = null;
            state.notifyAtDate = null;
            state.retval.items.reopenAtDate = null;
            state.reopenAtDate = null;
            
            if (state.request.body.option && state.request.body.option.options) {
                change['status']= state.request.body.option.type;
                change['priority']= state.request.body.option.options.priority;
                
                if (state.request.body.option.options.notify) {
                    var dt = new Date();
                    dt = new Date(dt.getTime() + eval(state.request.body.option.options.notify.value + '*60000'));
                    state.retval.items.notifyAtDate = dt;
                    state.notifyAtDate = dt;
                    change['notifyAtDate'] = dt;
                }
                if (state.request.body.option.options.open) {
                    var dt = new Date();
                    dt = new Date(dt.getTime() + eval(state.request.body.option.options.open.value + '*60000'));
                    state.retval.items.reopenAtDate = dt;
                    state.reopenAtDate = dt;
                    change['reopenAtDate'] = dt;
                }
            } else {
                if (state.request.body.option && state.request.body.option.type)
                    change['status'] = state.request.body.option.type;
            }
            if (state.request.body.option && state.request.body.option.key === 'solved-spam') {
                change['requester'] = "spam@spam.sk";
            }
            if (state.request.body.option && state.request.body.option.key === 'solved-delete') {
                state.deleteticket = true;
            }

            Controller.prototype.compareData('status', ticket, change, state.changes);
            Controller.prototype.compareData('priority', ticket, change, state.changes);
            Controller.prototype.compareData('notifyAtDate', ticket, change, state.changes);
            Controller.prototype.compareData('reopenAtDate', ticket, change, state.changes);

            Controller.prototype.compareData('assignee', ticket, change, state.changes);
            Controller.prototype.compareData('dueDate', ticket, change, state.changes);
            Controller.prototype.compareData('requester', ticket, change, state.changes);
            Controller.prototype.compareData('requestcc', ticket, change, state.changes);
            Controller.prototype.compareData('requestbc', ticket, change, state.changes);
            Controller.prototype.compareData('subject', ticket, change, state.changes);
            Controller.prototype.compareData('service', ticket, change, state.changes);
            Controller.prototype.compareData('transport', ticket, change, state.changes);
            Controller.prototype.compareData('purchase', ticket, change, state.changes);
            Controller.prototype.compareData('price', ticket, change, state.changes);
            Controller.prototype.compareData('reimburse', ticket, change, state.changes);
            Controller.prototype.compareData('requital', ticket, change, state.changes);
            Controller.prototype.compareData('tags', ticket, change, state.changes);
            Controller.prototype.compareData('channel', ticket, change, state.changes);
            
            state.retval.items = ticket;
            state.strRequester = ticket.requester;
            state.request.body.rowdata.subject = ticket.subject;
            state.retval.items.ticnum = ticket.ticnum;


            Autom.assignRefData(state, function () {              
                ticket.save(state.request, function (err, result) {
                    Controller.prototype.afterSave(state, callback);
                });
            });

            //for (var i in change) {
            //    ticket[i] = change[i];
            //}
            //ticket.save(callback);
        });
    }, function (err,msg) {
        if (err) return res.status(err).json({ err: msg });       
        return res.status(200).json({ msg: 'o.k.' });
    });

}


/*
 * Get panel search data.
 * @method Controller.searchPanel
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.searchPanel = function (req, res) {
    if (!isNaN(parseFloat(req.body.search)) && isFinite(req.body.search)) {
        Controller.prototype.model.findOne({ ticnum: req.body.search }, function (err, ticket) {
            if (err || !ticket) {
                return Crud.read(Controller, req, res, { extfields: 'bookmarks ' }, TicketLog);
            } else {
                getTicketData(ticket._id, function (err, result) {
                    return res.status(200).json(result);
                });
            }
        });
    } else {
        return Crud.read(Controller, req, res, { extfields: 'bookmarks ' }, TicketLog);
    }
}

/*
 * Check new item in knowledge base.
 * @method Controller.kbcheck
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.kbcheck = function (req, res) {
    Controller.prototype.model.findById(req.params.id, function (err, ticket) {
        if (err) return res.status(500, 'Invalid query data');
        Kbase.findOne({ ticnum: ticket.ticnum }, function (err, result) {
            if (err || !result)
                //return res.status(500, 'Invalid query data');
                res.status(200).json({ url: '/kbase/Ticket' + ticket.ticnum + 'notInKB' });
            else
                res.status(200).json({ url: '/kbase/' + result.slug });
        });
    });
}


/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}