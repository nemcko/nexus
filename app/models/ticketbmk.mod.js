'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var dbSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },  
    bookmarkfn: { type: String },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Ticket' }],
});

module.exports = mongoose.model('TicketBmk', dbSchema);
