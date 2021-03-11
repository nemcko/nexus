'use strict';

var crud = require('../lib/crud.js')
  //, mqttCl = require('../lib/mqtt.js')
  , root = {};

var Controller = function (obj) {
    root = obj;
};

Controller.prototype.model = require('../models/employ.mod.js');

Controller.prototype.assignData = function (fields, indata) {
    fields.user = indata.user;
    fields.name = indata.name;
    fields.surname = indata.surname;
    fields.title = indata.title;
    fields.company = indata.company;
    fields.street = indata.street;
    fields.phone = indata.phone;
    fields.zip = indata.zip;
    fields.city = indata.city;
};

Controller.prototype.whereCond = function (req) {
    return { $or: [{ name: { $regex: req.body.search , $options: "i" } }, { surname: { $regex: req.body.search , $options: "i" } }] };
};

Controller.prototype.list = function (req, res) {
    return crud.read(Controller, req, res);
}

Controller.prototype.create = function (req, res) {
    return crud.create(Controller, req, res);
}

Controller.prototype.update = function (req, res) {
    return crud.update(Controller, req, res);
}

Controller.prototype.delete = function (req, res) {
    return crud.delete(Controller, req, res);
}

module.exports = exports = function (server) {
    return new Controller(server);
}