'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name        : { type: String },
    filename    : { type: String },
    type        : { type: String },
    src         : { type: String }
});

dbSchema.index({ name: 1 }, { unique: true });

dbSchema.plugin(LastUpd);

module.exports = mongoose.model('Image', dbSchema);