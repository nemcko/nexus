'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js')
  , TicketSchema = require('../../app/lib/ticket.js');

var dbSchema = new Schema({
    logDate: { type: Date, default: Date.now },
    logUser: { type: Schema.Types.ObjectId, ref: 'User' },  
    
    event: { type : String },
    autotrg: [{}],
    autosvc: [{}],
    reopenAtDate: { type: Date },
    notifyAtDate: { type: Date },
    hidden: { type: Boolean, default: false },
    changes   : {},
    atid: { type : String },
    privcomm: { type: Boolean, default: false },
    subticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
});

dbSchema.plugin(TicketSchema);
dbSchema.plugin(LastUpd);

dbSchema.index({ ticnum: 1, logDate: -1 , event: 1 });
dbSchema.index({ logDate: 1, status: 1 });

dbSchema.index({ "$**": "text"})
//schema.index({ animal: 'text', color: 'text', pattern: 'text', size: 'text' }, { name: 'My text index', weights: { animal: 10, color: 4, pattern: 2, size: 1 } });
module.exports = mongoose.model('Ticketlog', dbSchema);

