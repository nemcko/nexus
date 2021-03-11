/**
 * @module Access Controller
 */

'use strict';

/** Module objects. */
var Crud = require('../lib/crud.js')
  , Accview = require('../models/accview.mod.js')
  , Board = require('../lib/board.js')
  , Autom = require('../lib/autom.js')
  , Access = require('../lib/access.js')
  , ObjectID = require('mongodb').ObjectID
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
Controller.prototype.model = require('../models/chart.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.charttype = indata.charttype;
    fields.period = indata.period;
    fields.timeunit = indata.timeunit;
    fields.datasets = indata.datasets;
    if (indata.accid) {
        fields.accview = ObjectID(indata.accid);
    } else {
        fields.accid = null;
    }
};

/*
 * List of fields.
 * @method Controller.list
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.list = function (req, res) {
    //return Crud.read(Controller, req, res,{
    //    populate: { path: 'accview', select: 'access' }, 
    //    select: { "name": 1, "anyof": 1, "allof": 1, "fields": 1, "accview": 1 , "createUser": 1}
    //});

    var async = require("async")
      , Access = require('../lib/access.js')
      , conditions = {}
      , retval = {
                pageNumber: Math.max(1, parseInt(req.params.page)),
                pageLimit: parseInt(req.params.limit),
                pageCount: 0,
                items: []
            }
      ;
        
    async.parallel([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No read Access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            Controller.prototype.model.count(conditions, function (err, cnt) {
                if (err) return callback(400, err);
                retval.pageCount = Math.max(1, Math.floor(cnt / retval.pageLimit));
                retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
                callback();
            });
        },
        function (callback) {
            if (req.body.qparam) {
                switch (req.body.qparam) {
                    case 'read':
                    case 'full':
                        Controller.prototype.model.find({ name: { $regex: req.body.search , $options: "i" } })
                        .populate({ path: 'accview', select: 'access' })
                        .exec(function (err, result) {
                            if (err) return callback(400, err.message);
                            var items = [];
                            result.forEach(function (itm) {
                                //if (itm.accview.access[0].cando.indexOf(req.user.role) >= 0) {
                                if (Access.checkViewAccess(itm, retval.acc, req.user, req.body.qparam)) {
                                    items.push(itm);
                                }
                            });
                            retval.items = items.slice((retval.pageNumber - 1) * retval.pageLimit, retval.pageLimit);
                            callback();
                        });
                        break;
                    case 'created':
                        Controller.prototype.model.find(
                            {
                                $and: [
                                    { name: { $regex: req.body.search , $options: "i" } },
                                    { "createUser": req.user.username }
                                ]
                            }
                        )
                        .populate({ path: 'accview', select: 'access' })
                        .skip((retval.pageNumber - 1) * retval.pageLimit)
                        .limit(retval.pageLimit)
                        .exec(function (err, result) {
                            if (err) return callback(400, err.message);
                            retval.items = result;
                            callback();
                        });
                        break;
                }
            } else {
                Controller.prototype.model.find({ name: { $regex: req.body.search , $options: "i" } })
                    .populate({ path: 'accview', select: 'access' })
                    .skip((retval.pageNumber - 1) * retval.pageLimit)
                    .limit(retval.pageLimit)
                    .exec(function (err, result) {
                    if (err) return callback(400, err.message);
                    retval.items = result;
                    callback();
                });
            }
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
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
 * Access Ids list for views.
 * @method Controller.accids
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.accids = function (req, res) {
    Accview.find({})
        .select("name")
        .exec(function (err, accview) {
        if (err) return res.status(500, 'Invalid query data');
        //accview = accview.map(function (doc) { return { code: doc.name, name: doc.name, organ: doc.organ }; });
        res.status(200).json(accview);
    });
}
/*
 * Validate fields data.
 * @method Controller.test
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.test = function (req, res) {
    Access.getView(req, function (err, acc) {
        if (err || acc.read === false) return callback(403, 'No read access.');
        var view = req.body
        view.access = acc.access;
        var expr = Autom.constructQuery(view);
        Controller.prototype.model.count(expr, function (err, result) {
            if (err) return res.status(200).json({ msg: err.message });
            return res.status(200).json({ msg: 'o.k.  ' + result + ' entries were selected.' });
        });
   });

}


/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}