/**
 * @module Organization Controller
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
Controller.prototype.model = require('../models/organ.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.info = indata.info;
    fields.ico = indata.ico;
    fields.notes = indata.notes;
    fields.pricelevel = indata.pricelevel;
    fields.defgroup = indata.defgroup;
    fields.profile = indata.profile;
   if (Object.prototype.toString.call(indata.domains) === '[object Array]') {
        fields.domains = indata.domains.slice(0);
    } else {
        fields.domains = indata.domains || [];
    }
};

/*
 * Where condition for data select.
 * @param req {Object} Request object
 */
Controller.prototype.whereCond = function (req) {
    return { $or: [{ name: { $regex: req.body.search , $options: "i" } }, { info: { $regex: req.body.search , $options: "i" } }, { ico: { $regex: req.body.search , $options: "i" } }] };
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
 * List of application email profiles.
 * @method Controller.agents
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.profiles = function (req, res) {
    var profiles = [];
    for (var i in root.config.profiles) {
        profiles.push({ name: root.config.profiles[i].name });
    }
    res.status(200).json(profiles);
}



/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}