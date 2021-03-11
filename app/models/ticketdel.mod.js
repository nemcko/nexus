'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
;
var dbSchema = new Schema({
    msgid: { type : String },
    ticnum: { type: Number },   
});
dbSchema.index({ msgid: 1 });
dbSchema.index({ tnum: 1 });

module.exports = mongoose.model('Ticketdel', dbSchema);

