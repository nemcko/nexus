'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name    : { type: String },
    active: { type: Boolean, default: false },
    anyof   : [{
            'field' : { type : String },
            'oper'  : { type : String },
            'value' : { type : String }
        }],
    allof   : [{
            'field' : { type : String },
            'oper'  : { type : String },
            'value' : { type : String }
        }],
    fields   : [{
            'field' : { type : String },
            'value' : { type : String },
            'message' : {
                    'title' : { type : String },
                    'body' : { type : String }
                }
        }]
});

dbSchema.plugin(LastUpd);

dbSchema.index({ name: 1 }, { unique: true });
dbSchema.index({ active: 1 });

module.exports = mongoose.model('Autotrg', dbSchema);