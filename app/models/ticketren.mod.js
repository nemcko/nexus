'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    ticnum: { type: Number }, 
    logDate: { type: Date, default: Date.now }, 
    refAttach : { type: Schema.Types.ObjectId, ref: 'Attachment' }
});

dbSchema.plugin(LastUpd);

dbSchema.index({ logDate: 1, ticnum: 1 });

module.exports = mongoose.model('TicketRen', dbSchema);

