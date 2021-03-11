'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    lastnum: { type: Number, default: 6158 }
});

dbSchema.plugin(LastUpd);

module.exports = mongoose.model('TicketSet', dbSchema);

