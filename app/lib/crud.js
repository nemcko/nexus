/**
 * @module CRUD helper library
 * @description CRUD utility library for the Mongoose rest interface.
 */

'use strict';

/** Module objects. */
var async = require("async")
  , Access = require('../lib/access.js');

/*
 * Create new model data.
 * @method create
 * @param self {object} Controller object
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
exports.create = function (self, req, res) {
    var conditions = {}
      , retval = {
            pageNumber: 1,
            pageLimit: (req.params.limit?parseInt(req.params.limit):10),
            pageCount: 0,
            items: []
        }
      , selId = null
      ;

    //if (req.body.search || req.query.search || req.body.qparam || req.query.qparam || qparam) {
    //    conditions = self.prototype.whereCond(req);
    //}

    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.create === false) return callback(403, 'No create access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            retval.items = new self.prototype.model();
            self.prototype.assignData(retval.items, req.body, req.user);
            retval.items.save(req, function (err, result) {
                if (err) return callback(400, err);
                retval.items = [];
                //retval.items = result;
                selId = result._id;
                callback();
            });
        },
        function (callback) {
            var pageNumber = 1, found = false;
            async.whilst(
            function () { return !found; },
            function (next) {
                var items = [];
                self.prototype.model.find(conditions)
                    .skip((pageNumber - 1) * retval.pageLimit)
                    .limit(retval.pageLimit)
                    .exec(function (err, results) {
                    if (!err && results && results.length) {
                        pageNumber++;
                        results.forEach(function (item) {
                                items.push(item);
                            if (item._id.equals(selId)) found = true;
                        });
                    } else {
                        found = true;
                    }
                    if (found) {
                        if (results && results.length) {
                            retval.pageNumber = pageNumber;
                            retval.items = items;
                        }
                        }
                    next();
                });
            },
            function (err) {
                return callback();
            });
        },
        function (callback) {
            self.prototype.model.count(conditions, function (err, cnt) {
                if (err) return callback(400, err);
                retval.pageCount = Math.max(1, Math.floor(cnt / retval.pageLimit));
                retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
                callback();
            });
        },

    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

/*
 * Read model data.
 * @method read
 * @param self {object} Controller object
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param qparam {Object} Query params object
 *              .populate {String} Populate field(s)
 *              .select {Object} Select object
 */
exports.read = function (self, req, res, qparam) {
var conditions = {}
  , retval = {
            pageNumber: Math.max(1, parseInt(req.params.page)),
            pageLimit: parseInt(req.params.limit),
            pageCount: 0,
            items: []
        }
  ;
    
    if (req.body.search || req.query.search || req.body.qparam || req.query.qparam || qparam) {
        conditions = self.prototype.whereCond(req);
    }
    
    async.parallel([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No read Access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            self.prototype.model.count(conditions, function (err, cnt) {
                if (err) return callback(400, err);
                retval.pageCount = Math.max(1, Math.floor(cnt / retval.pageLimit));
                retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
                callback();
            });
        },
        function (callback) {
            if (qparam) {
                if (qparam.populate) {
                    if (qparam.select) {
                        self.prototype.model.find({})
                    .populate(qparam.populate)
                    .select(qparam.select)
                        .where(conditions)
                    .skip((retval.pageNumber - 1) * retval.pageLimit)
                    .limit(retval.pageLimit)
                    .exec(function (err, result) {
                            if (err) return callback(400, err.message);
                            retval.items = result;
                            callback();
                        });
                    } else {
                        self.prototype.model.find(conditions)
                    .populate(qparam.populate)
                    //.select({ "name": 1, "surname": 1  })
                    //.sort({ name: 1 })
                    .skip((retval.pageNumber - 1) * retval.pageLimit)
                    .limit(retval.pageLimit)
                    .exec(function (err, result) {
                            if (err) return callback(400, err.message);
                            retval.items = result;
                            callback();
                        });
                    }
                } else {
                    if (qparam.select) {
                        self.prototype.model.find(conditions)
                    .select(qparam.select)
                    //.sort({ name: 1 })
                    .skip((retval.pageNumber - 1) * retval.pageLimit)
                    .limit(retval.pageLimit)
                    .exec(function (err, result) {
                            if (err) return callback(400, err.message);
                            retval.items = result;
                            callback();
                        });
                    } else {
                        self.prototype.model.find(conditions)
                    //.select({ "name": 1, "surname": 1  })
                    //.sort({ name: 1 })
                    .skip((retval.pageNumber - 1) * retval.pageLimit)
                    .limit(retval.pageLimit)
                    .exec(function (err, result) {
                            if (err) return callback(400, err.message);
                            retval.items = result;
                            callback();
                        });
                    }
                }
            } else {
                self.prototype.model.find(conditions)
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
 * Update model data.
 * @method update
 * @param self {object} Controller object
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
exports.update = function (self, req, res) {
    var retval = {
        items: []
    };
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.update === false) return callback(403, 'No write access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            self.prototype.model.findOne({ _id: req.body._id }, function (err, result) {
                if (err) return callback(400, err);
                retval.items = result;
                self.prototype.assignData(retval.items, req.body, req.user);
                callback();
            });
        },
        function (callback) {
            retval.items.save(req,function (err, result) {
                if (err) return callback(400, err);
                retval.items = result;
                callback();
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

/*
 * Delete model data.
 * @method delete
 * @param self {object} Controller object
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
exports.delete = function (self, req, res) {
    var retval = {
        items: []
    };
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.delete === false) return callback(403, 'No delete access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            self.prototype.model.remove({ _id: req.params.id }, function (err, result) {
                if (err) return callback(400, err);
                retval = { status: 'Deleted.' };
                callback();
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

