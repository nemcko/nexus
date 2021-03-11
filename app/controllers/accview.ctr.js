/**
 * @module View access Controller
 */

'use strict';

/** Module objects. */
var Crud = require('../lib/crud.js')
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
Controller.prototype.model = require('../models/accview.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.access = indata.access;
};

/*
 * Where condition for data select.
 * @param req {Object} Request object
 */
Controller.prototype.whereCond = function (req) {
    if (req.body.qparam)
        return {
            $and: [
                { name: { $regex: req.body.search , $options: "i" } },
                {
                    $or: [
                        { 'access.acclient': req.body.qparam}, 
                        { 'access.acagent': req.body.qparam}
                    ]
                }
            ]
        };
    else
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

/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}