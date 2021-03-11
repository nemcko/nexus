/**
 * @module Settings Controller for triggers
 */

'use strict';

/** Module objects. */
var Crud = require('../lib/crud.js')
  , Board = require('../lib/board.js')
  , TicketView = require('../models/ticket.mod.js')
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
Controller.prototype.model = require('../models/autotrg.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.active = indata.active;
    fields.anyof = indata.anyof;
    fields.allof = indata.allof;
    fields.fields = indata.fields;
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
                { active: req.body.qparam==='active' }
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
 * Validate fields data.
 * @method Controller.test
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.test = function (req, res) {
    TicketView.findOne({}, function (err, view) {
        if (err) return res.status(200).json({ msg: 'Invalid query data' });
        var expr = Board.constructJsQuery(req.body, 'view');
        try {
            eval(expr);
        } catch (e) {
            return res.status(200).json({ msg: e.message });
        }
        return res.status(200).json({ msg: 'o.k.' });
    });  
}   


/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}