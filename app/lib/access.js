/**
 * @module Access library
 */

'use strict';

/** Module objects. */
var Access = require('../models/access.mod.js')
  , View = require('../models/view.mod.js')
  , Card = require('../models/card.mod.js')
  , Search = require('../models/search.mod.js')
  , Chart = require('../models/chart.mod.js')
  , User = require('../models/user.mod.js')
  , ObjectId = require('mongodb').ObjectID
  , async = require("async");

/*
 * Function to obtain data access permissions.
 * @method getAccess
 * @param req {Object} Request object
 * @param callback {Object} Callback for access object
 */
exports.getAccess = function (req, callback){
    var acc = {
        'oid': req.body.acid || req.params.oid
    };
    
    if (req.isAuthenticated()) {
        Access.findOne({ oid: acc.oid }, function (err, aobj) {
            if (err || !aobj) return acc;
            User.findOne({ username: req.user.username })
            .select("role")
            .exec(function (err, usracc) {
                //if (err || !usracc) return acc;
                for (var index in aobj.access) {
                    acc[aobj.access[index].code] = false || aobj.access[index].cando && aobj.access[index].cando.indexOf(usracc.role) >=0;
                }
                //acc.create = aobj.canCreate.indexOf(usracc.role) >= 0;
                //acc.read = aobj.canRead.indexOf(usracc.role) >= 0;
                //acc.update = aobj.canUpdate.indexOf(usracc.role) >= 0;
                //acc.delete = aobj.canDelete.indexOf(usracc.role) >= 0;
                                             
                callback(null, acc);
            });
        });
    } else {
        callback('No access authorization.', acc);
    }
}

/*
 * Create state of return data.
 * @method createState
 * @param req {Object} Request object
 */
 function createState(req) {
    return {
        request: req,
        changes: {},
        retval: {
            items: []
        },
        isNew: false,
        orgfields: [],
        updaterType: ''
    };
}
exports.createState = createState;



/*
 * Function to obtain data and access of view.
 * @method getView
 * @param req {Object} Request object
 * @param callback {Object} Callback for access object
 */
exports.getView = function (req, callback) {
    var view = {
        'vid': req.body.vid || req.params.vid
    };
    
    if (req.isAuthenticated()) {
        var accusr = {}
          , accview = {}
          , userrole = ''
          , usertype = '';
        
        async.parallel([
            function (callback1) {
                Access.findOne({ oid: req.body.acid || 'tickets' }, function (err, aobj) {
                    if (err || !aobj) callback1(err, aobj);
                    User.findOne({ username: req.user.username })
                    .select("role usertype")
                    .exec(function (err, usracc) {
                        userrole = usracc.role;
                        usertype = usracc.usertype;

                        for (var index in aobj.access) {
                            accusr[aobj.access[index].code] = false || aobj.access[index].cando && aobj.access[index].cando.indexOf(userrole) >= 0;
                        }
                        callback1();
                    });
                });
            },
            function (callback1) {
                switch (req.body.vref) {
                    case 'View': {
                        View.findOne({ _id: new ObjectId(view.vid.oid?view.vid.oid:view.vid) })
                        .populate({ path: 'accview', select: 'access' })
                        .exec(function (err, result) {
                            if (!err && result) {
                                view.name = result.name;
                                view.vref = req.body.vref;
                                view.anyof = result.anyof;
                                view.allof = result.allof;
                                view.markers = result.markers;
                                view.kbcheck = result.kbcheck;
                                view.fields = result.fields || [];
                                view.grpflds = result.grpflds || [];
                                view.srtflds = result.srtflds || [];
                                accview = result.accview.access._doc.access;
                            }
                            callback1();
                        });
                    }
                    break;
                    case 'Card': {
                        Card.findOne({ _id: new ObjectId(req.body.vid) })
                        .populate({ path: 'accview', select: 'access' })
                        .exec(function (err, result) {
                            if (!err && result) {
                                view.name = result.name;
                                view.vref = req.body.vref;
                                view.cardtype = result.cardtype;
                                view.position = result.position;
                                accview = result.accview.access._doc.access;
                            }
                            callback1();
                        });
                    }
                    break;
                    case 'Search': {
                        Search.findOne({ _id: new ObjectId(view.vid.oid?view.vid.oid:view.vid) })
                        .populate({ path: 'accview', select: 'access' })
                        .exec(function (err, result) {
                            if (!err && result) {
                                view.name = result.name;
                                view.vref = req.body.vref;
                                view.fields = result.fields;
                                view.markers = true;
                                accview = result.accview.access._doc.access;
                            }
                            callback1();
                        });
                    }
                    break;

                    case 'Chart': {
                        Chart.findOne({ _id: new ObjectId(view.vid.oid?view.vid.oid:view.vid) })
                        .populate({ path: 'accview', select: 'access' })
                        .exec(function (err, result) {
                            if (!err && result) {
                                view.name = result.name;
                                view.vref = req.body.vref;
                                view.charttype = result.charttype;
                                view.period = result.period;
                                view.timeunit = result.timeunit;
                                view.datasets = result.datasets;
                                accview = result.accview.access._doc.access;
                            }
                            callback1();
                        });
                    }
                    break;
                }
                

            }
        ], function (err) {
            //if (err) return [];
            
            view.access = {};
            for (var attrname in accusr) { view.access[attrname] = accusr[attrname]; }
            //for (var attrname in accview) { view.access[attrname] = accview[attrname]; }

            var viewacc = {};
            for (var attrname in accview) { viewacc[attrname] = accview[attrname]; }
            switch (req.user.usertype) {
                case 'admins':
                case 'agents':
                    view.access.viewacc = viewacc.acagent;
                    break;
                case 'endusers':
                    view.access.viewacc = viewacc.acclient;
                    break;
                default:
                    view.access.viewacc = 'none';
            }

            callback(null, view)
        });
    } else {
        callback('No access authorization.');
    }
}


/*
 * Function to obtain access of view.
 * @method checkViewAccess
 * @param view {Object} View object
 * @param acc {Object} Access to tickets
 * @param user {Object} User object
 * @param acctype {Object} Access type
 * @param callback {Object} Callback for access object
 */
exports.checkViewAccess = function (view, acc, user, acctype) {
    var viewacc = ''
      , userrole = user.role
      , usertype = user.usertype
      , retVal = false;

    switch (user.usertype) {
        case 'admins':
        case 'agents':
            viewacc = view.accview.access._doc.access.acagent;
            break;
        case 'endusers':
            viewacc = view.accview.access._doc.access.acclient;
            break;
    }
    switch (acctype) {
        case 'read':
            switch (viewacc) {
                case 'agall':
                case 'aggrp':
                case 'agorg':
                case 'agusr':
                case 'clorg':
                case 'clusr':
                    retVal = acc.read;
                    break;
            }
            break;
        case 'full':
            switch (viewacc) {
                case 'agall':
                case 'clorg':
                    retVal = acc.read && acc.create && acc.update && acc.delete;
                    break;
            }
            break;
        case 'created':
            retVal = view.createUser=== user.username;
            break;
    }
    return retVal;
}

/*
 * Function to obtain all data access permissions.
 * @method getAccUser
 * @param username {String} User name
 */
exports.getAccUser = function (username) {
    var userrole = ''
      , access = [];
    
    async.series([
        function (callback) {
            User.findOne({ username: username })
                .select("role")
                .exec(function (err, uobj) {
                if (err || !uobj) return callback(true);
                userrole = uobj.role;
                callback();
            });
        },
        function (callback) {
            Access.find({})
               .select("oid access")
                .exec(function (err, accobj) {
                if (err || !accobj) return callback(true);
                accobj.map(function (aobj) {
                    var acc = [];
                    for (var index in aobj.access) {
                        acc[aobj.access[index].code] = false || aobj.access[index].cando.indexOf(userrole) >= 0;
                    }
                    access[aobj.oid] = acc;
                });
                callback();
            });
        }
    ], function (err, msg) {
        //if (err) return [];
        return access;
    });
    
}


/*
 * Helper function for data access permissions.
 * @method getRetValue
 * @param acc {Object} Access data
 * @param obj {Function} Function/Object for type of call
 * @param callback {Object} Callback for rest interface.
 */
function getRetValue(acc, obj, callback){
    var retval = {};
    if (typeof obj === 'function') {
        callback = obj;
        retval = acc;
    } else {
        if (typeof obj === 'undefined') {
            retval = acc;
        } else {
            retval = obj;
            retval['acc'] = acc;
        }
    }
    return retval;
}

exports.canRead = function (req, obj, callback) {
    getAccess(req, function (err, acc) {      
        if (acc.read)
            callback(null, getRetValue(acc, obj, callback));
        else
            callback({ code: 403, msg: 'No read access for ' + acc.oid + '.' });
    });
}

exports.canCreate = function (oid, obj, callback) {
    getAccess(req, function (err, acc) {        
        if (acc.create)
            callback(null, getRetValue(acc, obj, callback));
        else
            callback({ code: 403, msg: 'No create access for ' + acc.oid + '.' });
    });
}

exports.canUpdate = function (oid, obj, callback) {
    getAccess(req, function (err, acc) {        
        if (acc.update)
            callback(null, getRetValue(acc, obj, callback));
        else
            callback({ code: 403, msg: 'No write access for ' + acc.oid + '.' });
    });
}

exports.canDelete = function (oid, obj, callback) {
    getAccess(req, function (err, acc) {        
        if (acc.delete)
            callback(null, getRetValue(acc, obj, callback));
        else
            callback({ code: 403, msg: 'No delete access for ' + acc.oid + '.' }, retval);
    });
}