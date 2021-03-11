/**
 * @module Board positions Controller
 */

'use strict';

/** Module objects. */
var async = require("async")
  , mongoose = require('mongoose')
  , Crud = require('../lib/crud.js')
  , View = require('../models/view.mod.js')
  , Card = require('../models/card.mod.js')
  , Search = require('../models/search.mod.js')
  , Chart = require('../models/chart.mod.js')
  , root = {};

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
Controller.prototype.model = require('../models/bpos.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.shared = indata.shared || false;
    fields.type = indata.type;
    if (indata.position) {

        fields.position = indata.position;
        fields.position.forEach(function (pos) {
            pos.view.$id = mongoose.mongo.ObjectId(pos.view.$id);
        });
    }
};

/*
 * Where condition for data select.
 * @param req {Object} Request object
 */
Controller.prototype.whereCond = function (req) {
    if (req.body.qparam) {
        return {
            $and: [
                { name: { $regex: req.body.search , $options: "i" } },
                { shared: req.body.qparam == 'shared' }
            ]
        };
    } else
        return { name: { $regex: req.body.search , $options: "i" } };
};

/*
 * List of fields.
 * @method Controller.list
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.list = function (req, res) {
    //db.test.find({ list: { $elemMatch: { a: 1 } } }, { 'list.$': 1 })
    //sampleSchema.find( { dates : { $elemMatch: {  date : { $gte: 'DATE_VALUE' } } } )
    return Crud.read(Controller, req, res);
}

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
 * optviews list of views.
 * @method Controller.optviews
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.optviews = function (req, res) {
    async.parallel([
        function (callback) {
            View.find({})
            .populate({ path: 'accview', select: 'access' })
            .exec(function (err, result) {
                if (err) return res.status(500, 'Invalid query data');
                var items = [];
                result.forEach(function (itm) {
                    //if (itm.accview.access[0].cando.indexOf(req.user.role) >= 0) {
                    //    items.push({ name: itm.name, code: itm._id });
                    //}
                    items.push({ name: itm.name, objref: { '$ref': 'View', '$id': itm._id , '$db': '' } });
                });
                return callback(null, items);
            });
        },
        function (callback) {
            Card.find({})
            .populate({ path: 'accview', select: 'access' })
            .exec(function (err, result) {
                if (err) return res.status(500, 'Invalid query data');
                var items = [];
                result.forEach(function (itm) {
                    items.push({ name: itm.name, objref: { '$ref': 'Card', '$id': itm._id , '$db': '' } });
                });
                return callback(null, items);
            });
        },
        function (callback) {
            Chart.find({})
            .populate({ path: 'accview', select: 'access' })
            .exec(function (err, result) {
                if (err) return res.status(500, 'Invalid query data');
                var items = [];
                result.forEach(function (itm) {
                    //if (itm.accview.access[0].cando.indexOf(req.user.role) >= 0) {
                    //    items.push({ name: itm.name, code: itm._id });
                    //}
                    items.push({ name: itm.name, objref: { '$ref': 'Chart', '$id': itm._id, '$db': '' } });
                });
                return callback(null, items);
            });
        },
        function (callback) {
            Search.find({})
            .populate({ path: 'accview', select: 'access' })
            .exec(function (err, result) {
                if (err) return res.status(500, 'Invalid query data');
                var items = [];
                result.forEach(function (itm) {
                    items.push({ name: itm.name, objref: { '$ref': 'Search', '$id': itm._id, '$db': '' } });
                });
                return callback(null, items);
            });
        }
    ], function (err, results) {
        var retval = [];
        if (err) return res.status(err).json({ err: msg });
        results.forEach(function(result) {
            result.forEach(function(obj) {
                retval.push(obj);
            })
        })
        res.status(200).json(retval);
    });
  

}

function constructtDashboard(boardnum, username, callback) {
    var index = 0;
    Controller.prototype.model.find({ $or: [{ shared: true }, { createUser: username }] })
        .exec(function (err, result) {
        if (err) return res.status(500, 'Invalid query data');
        var dashboard = {
            boards: [], 
            current: {}
        };
        
        
        async.each(result, function (board, callback1) {
            dashboard.boards.unshift({ name: board.name, href: "#/dashboard/" + (index + 1), icon: "filter_" + (index + 1) });
            if (boardnum === index++) {
                var idx = 0;
                dashboard.current.name = board.name;
                dashboard.current.type = board.type;
                dashboard.current.position = {};
                dashboard.hasSearchPanel = false;
                async.eachSeries(board.position, function (pos, callback2) {
                    if (dashboard.current.position[pos.code] === undefined) {
                        dashboard.current.position[pos.code] = [];
                    }
                    
                    switch (pos._doc.view.namespace) {
                        case 'View': {
                            View.findById(pos._doc.view.oid, function (err, res) {
                                if (res) {
                                    dashboard.current.position[pos.code].push({
                                        vref: pos._doc.view.namespace, 
                                        vid: res._id, 
                                        title: res.name, 
                                        size: pos.size, 
                                        fields: res.fields, 
                                        hasbookmarks: res.bookmarkfn, 
                                        markers: res.markers, 
                                        seq: idx++
                                    });
                                    callback2();
                                } else callback2('Bad view');
                            });
                        }
                        break;
                        case 'Card': {
                            Card.findById(pos._doc.view.oid, function (err, res) {
                                if (res) {
                                    dashboard.current.position[pos.code].push({
                                        vref: pos._doc.view.namespace, 
                                        vid: res._id, 
                                        title: res.name, 
                                        seq: idx++
                                    });
                                    callback2();
                                } else callback2('Bad card');
                            });
                        }
                        break
                        case 'Search': {
                            Search.findById(pos._doc.view.oid, function (err, res) {
                                if (res) {
                                    dashboard.current.position[pos.code].push({
                                        vref: pos._doc.view.namespace, 
                                        vid: res._id, 
                                        title: res.name, 
                                        size: pos.size, 
                                        fields: res.fields, 
                                        hasbookmarks: res.bookmarkfn, 
                                        markers: res.markers, 
                                        seq: idx++
                                    });
                                    dashboard.hasSearchPanel = res._id;
                                    callback2();
                                } else callback2('Bad view');
                            });
                        }
                        break;
                        case 'Chart': {
                            Chart.findById(pos._doc.view.oid, function (err, res) {
                                if (res) {
                                    dashboard.current.position[pos.code].push({
                                        vref: pos._doc.view.namespace, 
                                        vid: res._id, 
                                        title: res.name, 
                                        size: pos.size, 
                                        charttype: res.charttype, 
                                        start: res.start,
                                        period: res.period,
                                        timeunit: res.timeunit,
                                        seq: idx++
                                    });
                                    callback2();
                                } else callback2('Bad view');
                            });
                        }
                        break;
                    }

                }, function (err) {
                    callback1(err);
                });
            } else {
                callback1();
            }
        }, function (err) {
            callback(err, dashboard);
        });

    
    




        //var readData = function (dashboard, pos, idx, callback1) {
        //    if (pos) {
        //        switch (pos._doc.view.namespace) {
        //            case 'View': {
        //                View.findById(pos._doc.view.oid, function (err, res) {
        //                    if (res) {
        //                        dashboard.current.position[pos.code].push({
        //                            vref: pos._doc.view.namespace, 
        //                            vid: res._id, 
        //                            title: res.name, 
        //                            size: pos.size, 
        //                            fields: res.fields, 
        //                            hasbookmarks: res.bookmarkfn, 
        //                            seq: idx
        //                        });
        //                        callback1(null, dashboard, null, idx);
        //                    }
        //                });
        //            }
        //            break;
        //            case 'Chart': {
        //                Chart.findById(pos._doc.view.oid, function (err, res) {
        //                    if (res) {
        //                        dashboard.current.position[pos.code].push({
        //                            vref: pos._doc.view.namespace, 
        //                            vid: res._id, 
        //                            title: res.name, 
        //                            size: pos.size, 
        //                            charttype: res.charttype, 
        //                            start: res.start,
        //                            period: res.period,
        //                            timeunit: res.timeunit,
        //                            seq: idx
        //                        });
        //                        callback1(null, dashboard, null, idx);
        //                    }
        //                });
        //            }
        //            break;
        //        }
        //    } else {
        //        callback1(null, dashboard, pos, idx);
        //    }
        //};
        
        //var startTask = function (callback1) {
        //    result.forEach(function (itm, index) {
        //        dashboard.boards.unshift({ name: itm.name, href: "#/dashboard/" + (index + 1), icon: "filter_" + (index + 1) });
        //        if (boardnum === index) {
        //            dashboard.current.name = itm.name;
        //            dashboard.current.type = itm.type;
        //            dashboard.current.position = {};
        //            itm.position.forEach(function (pos, index) {
        //                if (dashboard.current.position[pos.code] === undefined) {
        //                    dashboard.current.position[pos.code] = [];
        //                }
        //                function_array.splice(function_array.length - 1, 0, readData);
        //                callback1(null, dashboard, pos, index);
        //            });
        //        }
        //    });
        //};
        
        //var finalTask = function (dashboard, pos, idx, callback1) {
        //    callback1(null, dashboard, null, idx);
        //};
        //var function_array = [startTask, finalTask];
        //async.waterfall(function_array, function (err, result) {
        //    callback(err, dashboard);
        //});
    });
}

/*
 * Dashboard data.
 * @method Controller.dashboard
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.dashboard = function (req, res) {
    constructtDashboard(Math.max(0, parseInt(req.params.id) - 1), req.user.username, function (err, result) {
        res.status(200).json(result);
    });
}

/*
 * Dashboards data.
 * @method Controller.dashboards
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.dashboards = function (req, res) {
    var boards = []
      , index = 0;
    Controller.prototype.model.find({ $or: [{ shared: true }, { createUser: req.user.username }] })
        .exec(function (err, result) {
        if (err) return res.status(500, 'Invalid query data');
        result.forEach(function (item) {
            boards.push({ name: item.name, href: "#/dashboard/" + (++index), icon: "filter_" + (index) });
        });

        res.status(200).json(boards);

    });
}

/*
 * Board data.
 * @method Controller.dashboard
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.board = function (req, res) {
    constructtDashboard(0, req.user.username, function (err, result) {
        View.findById(req.params.id, function (err, rslt) {
            if (err || !rslt) return res.status(400, err.message);
            result.current.name = rslt.name;
            result.current.type = 'single';
            result.current.position = { center: [] };
            result.current.position['center'].push({
                vref: 'View', 
                vid: rslt._id, 
                title: 'View results', 
                size: 500, 
                fields: rslt.fields, 
                hasbookmarks: rslt.bookmarkfn, 
                markers: rslt.markers, 
                seq: 0
            });
            result.current.singleview = true;
            res.status(200).json(result);
        });

    });

}

/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}