'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name         : { type: String, required: true , unique: true },
    access      : {
        acclient:     { type: String },
        acagent:      { type: String },
        privcomm:   { type: Boolean, default: false }
    }
});

dbSchema.plugin(LastUpd);

module.exports = mongoose.model('AccView', dbSchema);