/**
 * @module Group Controller
 */

'use strict';

/** Module objects. */
var Crud = require('../lib/crud.js')
  , Access = require('../lib/access.js')
  , Organ = require('../models/organ.mod.js')
  , User = require('../models/user.mod.js')
  , Grps = require('../models/group.mod.js')
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
Controller.prototype.model = require('../models/group.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.organ = indata.organ || "";
   if (Object.prototype.toString.call(indata.agents) === '[object Array]') {
        fields.agents = indata.agents.slice(0);
    } else {
        fields.agents = indata.agents || [];
    }
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
                { organ: req.body.qparam }
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
 * A list of organizations for the workflow..
 * @method Controller.organs
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.organs = function (req, res) {
    Access.getAccess(req, function (err, acc) {
        if (err || acc.read === false) return res.status(403, 'No read Access.');
        Organ.find({})
            .select("name info")
            .exec(function (err, organ) {
            if (err) return res.status(500, 'Invalid query data');
            organ = organ.map(function (doc) { return { code: doc._id, name: doc.name, info: doc.info } });
            res.status(200).json(organ);
        });
    });
}

/*
 * Agents list for workflow.
 * @method Controller.agents
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.agents = function (req, res) {
    Access.getAccess(req, function (err, acc) {
        if (err || acc.read === false) return res.status(403, 'No read Access.');
        User.find({ $or: [{ usertype: 'agents' }, { usertype: 'admins' }] })
            .select("username fullname")
            .exec(function (err, users) {
            if (err) return res.status(500, 'Invalid query data');
            users = users.map(function (doc) { return { id: doc._id, code: doc.username, name: doc.fullname?doc.fullname:doc.username }; });
            res.status(200).json(users);
        });
    });
}

/*
 * Groups list for workflow.
 * @method Controller.grps
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.grps = function (req, res) {
    Access.getAccess(req, function (err, acc) {
        if (err || acc.read === false) return res.status(403, 'No read Access.');
        Grps.find({})
            .select("name organ")
            .exec(function (err, grps) {
            if (err) return res.status(500, 'Invalid query data');
            grps = grps.map(function (doc) { return {code: doc.name,  name: doc.name, organ: doc.organ }; });
            res.status(200).json(grps);
        });
    });
}



/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}