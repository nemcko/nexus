/**
 * @module Settings Controller for user actions
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
Controller.prototype.model = require('../models/autousr.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.shared = indata.shared;
    fields.active = indata.active;
    fields.fields = indata.fields;
    fields.message = indata.message;
};

/*
 * Where condition for data select.
 * @param req {Object} Request object
 */
Controller.prototype.whereCond = function (req) {
    if (req.body.qparam) {
        switch (req.body.qparam) {
            case 'shared':
            case 'private':
                return {
                    $and: [
                        { name: { $regex: req.body.search , $options: "i" } },
                        { shared: req.body.qparam === 'shared' }
                    ]
                };
            case 'active':
            case 'disabled':
                return {
                    $and: [
                        { name: { $regex: req.body.search , $options: "i" } },
                        { active: req.body.qparam === 'active' }
                    ]
                };
        }
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
 * List of user macros.
 * @method Controller.optmacros
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.optmacros = function (req, res) {
    Controller.prototype.model.find({ $and: [{ $or: [{ shared: true }, { createUser: req.user.username }] }, { active: true }] })
        .select("name fields message")
        .exec(function (err, macros) {
        if (err) return res.status(500, 'Invalid query data');
        macros = macros.map(function (doc) {
            var flds = [];
            doc.fields.map(function (fld) {
                flds.push({ field: fld.field, value: fld.value });
            });
            return {
                code: doc._id, 
                name: doc.name, 
                fields: flds, 
                message: doc.message
            };
        });
        res.status(200).json(macros);
    });
}

/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}