/**
 * @module Board crud helper library
 * @description CRUD utility library for the Mongoose rest interface.
 */

'use strict';

/** Module objects. */
var async = require("async")
  , Access = require('../lib/access.js')
  , Autom = require('../lib/autom.js')
  , htmlToText = require('html-to-text')
  ;


/*
 * Create new model data.
 * @method create
 * @param self {object} Controller object
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
exports.create = function (self, req, res) {
    //var state = {
    //    request: req,
    //    changes: {},
    //    retval: {
    //        items: []
    //    },
    //    isNew: true
    //};
    var state = Access.createState(req);
    state.isNew = true;

    async.series([
        function (callback) {
            Access.getView(state.request, function (err, acc) {
                if (err || acc.access.create === false) return callback(403, 'No create access.');
                state.retval.title = acc.name;
                state.retval.acc = acc.access;
                callback();
            });
        },
        function (callback) {
            state.retval.items = new self.prototype.model() || [];
            self.prototype.assignData(state, callback);
        },
        function (callback) {
            state.retval.items.save(state.request, function (err, result) {
                if (err) return callback(400, err);
                state.retval.items = result || [];
                if (self.prototype.afterSave) {
                    self.prototype.afterSave(state, callback);
                } else {
                    callback();
                }
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });


        res.status(200).json(state.retval);
    });
}

function changeArrayKey(originalKey, newKey, arr) {
    var newArr = [];
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i];
        obj[newKey] = obj[originalKey];
        delete (obj[originalKey]);
        newArr.push(obj);
    }
    return newArr;
}
/*
 * Read model data.
 * @method read
 * @param self {object} Controller object
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param qparam {Object} Query params object
 *              .populate {String} Populate field(s)
 *              .extfields {String} Select extension fields
 * @param model {Object} Model object
 */
exports.read = function (self, req, res, qparam, tlogs) {
    //var conditions = {}
    var fields = ""
  , retval = {}
   , view
   //, state = {
   //         request: req,
   //         changes: {},
   //         retval: {
   //             items: []
   //         },
   //         isNew: false,
   //         orgfields: []
   // };
   , state = Access.createState(req);

    if (qparam && qparam.extfields) fields = fields + ' ' + qparam.extfields + ' ';

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
                    case 'View':
                        {
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
                            retval.markers = acc.markers;
                            retval.kbcheck = acc.kbcheck;
                            retval.items = [];
                            retval.grpfld = '';
                            view.grpflds.forEach(function (item) {
                                retval.grpfld = item.field;
                            });
                        }
                        break;
                    case 'Search':
                        {
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
                            retval.markers = acc.markers;
                            retval.items = [];
                            retval.fields = acc.fields;
                        }
                        break;
                    default:
                        return callback();
                }
                
                return callback();
            });
        },
        function (callback) {
            switch (view.vref) {
                case 'View': {
                    var query = self.prototype.model.find();
                    Autom.buildQuery(query, view, state);
                    query.select(fields)
                    .count(function (err, cnt) {
                        if (err) return callback(400, err);
                        retval.pageTotal = cnt;
                        retval.pageCount = Math.max(1, Math.floor(cnt / retval.pageLimit));
                        retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
                        return callback();
                    });
                }
                break;
                case 'Search': {
                    if (!tlogs)
                        return callback();

                    var query = tlogs.find({
                        $text: {
                            $search: state.request.body.search,
                            $caseSensitive: false, $diacriticSensitive: false
                        }
                    });
                    Autom.addWhereCond(query, view, state);
                    query.count(function (err, cnt) {
                        if (err) return callback(400, err);
                        retval.pageTotal = cnt;
                        retval.pageCount = Math.max(1, Math.floor(cnt / retval.pageLimit));
                        retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
                        return callback();
                    });
                }
                break;
                default:
                    return callback();
            }
        },
        function (callback) {
            switch (view.vref) {
                case 'View': {
                    var query = self.prototype.model.find();
                    Autom.buildQuery(query, view, state);
                    query.select(fields)
                    .select('lastComment')
                    .skip((retval.pageNumber - 1) * retval.pageLimit)
                    .limit(retval.pageLimit);
                    
                    //state.orgfields.push({ org: 'lastComment', sel: 'lastComment' });
                    
                    Autom.sortQuery(query, view, state);
                    
                    query.exec(function (err, result) {
                        if (err) return callback(400, err.message);
                        retval.items = [];
                        for (var i = 0, len = result.length; i < len; i++) {
                            var item = result[i]._doc;
                            retval.items.push(item);
                        }
                        
                        state.orgfields.forEach(function (stf) {
                            changeArrayKey(stf.sel, stf.org, retval.items)
                        })
                        //if (retval.grpfld) {
                        //    Autom.aggregateQuery(self.prototype.model, view, retval.grpfld, fields, state, function (err, result) {
                        //        if (result) {
                        //            state.agrfields = {};
                        //            for (var i = 0; i < result.length; i++) {
                        //                state.agrfields[result[i]._id] = result[i];
                        //            }
                        //        }
                        //        return callback();
                        //    });
                        //} else {
                        //    return callback();
                        //}
                        return callback();
                    });
                }
                break;
                case 'Search': {
                    if (!tlogs) return callback();

                    var query = tlogs.find({
                        $text: {
                            $search: state.request.body.search, 
                            $caseSensitive: false, $diacriticSensitive: false
                        }
                    }
                    , { ticnum: 1, comment: 1 });
                    Autom.addWhereCond(query, view, state);
                    query.exec(function (err, result) {
                        if (err) return callback(400, err.message);
                        retval.items = [];
                        async.eachSeries(result, function (log, callback1) {
                            self.prototype.model.findOne({ ticnum: log.ticnum }, fields, function (err, result) {
                                if (err) callback1(err);
                                var item = result._doc;
                                if (log.comment) {
                                    item['txt']= htmlToText.fromString(log.comment, { wordwrap: 80 });
                                    if (item.txt.length > 240) item.txt = item.txt.substring(0, 235) + ' ...';
                                }
                                retval.items.push(item);
                                callback1();
                            });
                        }, function (err) {
                            if (err) return res.send(500, { error: err });
                            state.orgfields.forEach(function (stf) {
                                changeArrayKey(stf.sel, stf.org, retval.items)
                            })                           
                            return callback();
                        });
                    });
                }
                break;
                case 'Card': return getCardData(self, view, state, retval, callback);
                    break;
                case 'Chart': return getChartData(self, view, state, retval, callback);
                    break;
                default:
                    return callback();
            }
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        if (self.prototype.afterRead) self.prototype.afterRead(req, res, view, state, retval, function (retval) {
            res.status(200).json(retval);
        });
        else
            res.status(200).json(retval);
    });

}


function getCardData(self, view, state, retval, callback){
    var results = [];
    async.map(view.position, function (pos, callback1) {
        if (pos.field) {
            var query = self.prototype.model.find();
            pos.access = view.access;
            Autom.buildQuery(query, pos, state);
            query.select(pos.field)
            query.exec(pos, function (err, result) {
                return callback1(err, result);
            });
        } else {
            return callback1(null,null);
        }

        //query.aggregate([
        //    {
        //        $group: {
        //            _id: '$' + pos.field,
        //            value: { $sum: '$Mark' }
        //        }
        //    }
        //    ], function (err, results) {
        //        return callback1(err, result);
        //    }
        //);
    }, function (err, results) {
        retval.data = {};
        //retval.name = view.name;
        retval.cardtype = view.cardtype;
        for (var i = 0; i < view.position.length; i++) {
            if (view.position[i].field) {               
                retval.data[view.position[i].code] = {
                    //'code': view.position[i].code,
                    'title': view.position[i].title,
                    'subtitle': view.position[i].subtitle,
                    'value': 0
                }
                if (results[i]) {
                    //state.retval.items[i] = results[i][view.position[i].field];  
                    results[i].forEach(function (itm) {
                        switch (view.position[i].accumfn) {
                            case 'sum':
                                retval.data[view.position[i].code].value += itm[view.position[i].field];
                                break;
                            case 'count':
                                retval.data[view.position[i].code].value += 1;
                                break;
                        }
                    });       
                }
            }
        }
        return callback();
    });
}

function getChartData(self, view, state, retval, callback){
    var results = {}
      , selDate = new Date(state.request.body.currentDate);

    async.series([
        function (callback1) {
            async.each(view.datasets, function (dataset, callback2) {
                Autom.aggreginit(self.prototype.model, view, dataset, state, selDate, results, callback2);
            }, function (err) {
                callback1();
            });

        },
        function (callback1) {
            
            async.each(view.datasets, function (dataset, callback2) {
                dataset.access = view.access;
                Autom.aggregate(self.prototype.model, view, dataset, state, results, function (err, result) {
                    if (result) {
                        result.forEach(function (item) {                           
                            if (!results['grid']) results['grid'] = {};
                            if (!results['names']) results['names'] = {};
                            for (var i = 0; i < item.values.length; i++) {                               
                                var pkey = Object.keys(item.keys[i]).map(function (key) { return String(item.keys[i][key]) }).join('-');
                                if (!results.grid[pkey]) results.grid[pkey] = {};
                                if (!results.names[item._id]) results.names[item._id] = item._id;
                               results.grid[pkey][item._id] = item.values[i];
                            }
                        });
                    }
                    return callback2(err);
                });

            }, function (err) {
                retval['charttype'] = view.charttype;
                retval['period'] = view.period;
                retval['timeunit'] = view.timeunit;
                retval['startDate'] = results.startDate;
                retval['endDate'] = results.endDate;

                retval['data'] = {};
                retval.data['labels'] = [];
                retval.data['series'] = [];
                retval.data['tabrownames'] = [];
                retval.data['tabcolnames'] = [];
                for (var i in results.grid) {
                    var sl=i.split('-'), label = i, rowlabel = i;
                    switch (view.timeunit) {
                        case "week":
                            label = sl[0];
                            rowlabel = sl[0];
                            break;
                        case "month": 
                            label = sl[0];
                            rowlabel = sl[0];
                            break;
                        default:
                            switch (view.period) {
                                case "month1":
                                    label = sl[1];
                                    break;
                                case "week":
                                    label = sl[1];
                                    break;
                                default:
                                    label = sl[1];
                                    break;
                            }
                            rowlabel = sl[1] + '.' + sl[0] + '.';
                            break;
                    }

                    retval.data.labels.push(label);
                    retval.data.tabrownames.push(rowlabel);
                }
                for (var n in results.names) {
                    var ser = [];
                    retval.data.tabcolnames.push(n);
                    for (var i in results.grid) {
                        ser.push((results.grid[i][n]?results.grid[i][n]:null));
                    }
                    retval.data.series.push(ser);
                }

                callback1();
            });
        }
    ], function (err) {        
        callback();
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
    //var state = {
    //    request: req,
    //    changes: {},
    //    retval: {
    //        items: []
    //    },
    //    isNew: false
    //};
    var state = Access.createState(req);

    async.series([
        function (callback) {
            Access.getView(state.request, function (err, acc) {
                if (err || acc.update === false) return callback(403, 'No write access.');
                state.retval.title = acc.name;
                state.retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            self.prototype.model.findOne({ _id: state.request.body.rowdata._id }, function (err, result) {
                if (err) return callback(400, err);
                state.retval.items = result || [];
                self.prototype.assignData(state, callback);
            });
        },
        function (callback) {
            if (self.prototype.beforeSave) {
                self.prototype.beforeSave(state, callback);
            } else {
                callback();
            }
        },
        function (callback) {
            if (!state.retval.items.save) return callback();
            state.retval.items.save(state.request,function (err, result) {
                if (err) return callback(400, err);
                state.retval.items = result || [];
                if (self.prototype.afterSave) {
                    self.prototype.afterSave(state, callback);
                } else {
                    callback();
                }
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });

        res.status(200).json(state.retval);
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
            Access.getView(req, function (err, acc) {
                if (err || acc.delete === false) return callback(403, 'No delete access.');
                retval.title = acc.name;
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            self.prototype.model.remove({ _id: req.params.id }, function (err, result) {
                if (err) return callback(400, err);
                retval = { status: 'Deleted.' };
                if (self.prototype.afterDelete) {
                    self.prototype.afterDelete(retval, callback);
                } else {
                    callback();
                }
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

