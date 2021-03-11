'use strict';

var mongoose = require('mongoose')
  //, User = require('../models/user.mod.js')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    username    : { type: String },
    name        : { type: String },
    surname     : { type: String },
    title       : { type: String }
});

dbSchema.index({ username: 1 }, { unique: true });

dbSchema.plugin(LastUpd);

module.exports = mongoose.model('ActiveUser', dbSchema);