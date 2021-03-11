'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name    : { type: String },
    shared  : { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    fields   : [{
            'field' : { type : String },
            'value' : { type : String },
        }],
    message : {
            'title' : { type : String },
            'body' : { type : String }
        }
});

dbSchema.plugin(LastUpd);

dbSchema.index({ createUser: 1, name: 1 }, { unique: true });
dbSchema.index({ active: 1 });

module.exports = mongoose.model('Autousr', dbSchema);