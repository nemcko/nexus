'use strict';

var mongoose = require('mongoose')
  , config = require('../../config')
  , Schema = mongoose.Schema
  , connect = mongoose.createConnection(config.mongoBinUri)
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    ticnum: { type: Number },  
    atid: { type: String },  
    msgid: { type : String },
    attachment: [{
            uri       : { type: String },
            filename  : { type: String },
            type      : { type: String },
            data      : { type: String }
        }]
});

dbSchema.plugin(LastUpd);

dbSchema.index({ atid: 1 });

module.exports = connect.model('Ticketatt', dbSchema);