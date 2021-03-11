'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js')
  , TicketSchema = require('../../app/lib/ticket.js');

var dbSchema = new Schema({
    //refOrgan: { type: Schema.Types.ObjectId, ref: 'Organ' },  
    //refRequester: { type: Schema.Types.ObjectId, ref: 'User' },  
    //refGroup: { type: Schema.Types.ObjectId, ref: 'Group' },  
    //refAgent: { type: Schema.Types.ObjectId, ref: 'User' },  
    
    requestDate: { type: Date, default: Date.now },
    assignedDate: { type: Date },
    pendingDate: { type: Date },
    
    reopenAtDate: { type: Date },
    notifyAtDate: { type: Date },

    updateDate: { type: Date },
    updaterType: { type : String },  
    lastComment: { type : String },  

    satisfaction: { type: Number, default: 0 },

    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'User' }],
 
    logs: [{ type: Schema.Types.ObjectId, ref: 'Ticketlog' }],

    mergedto: { type: Number },   
    mergedfrom: [{ type: Number }], 
     
    viewed: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
});

dbSchema.index({ ticnum: 1 }, { unique: true });

dbSchema.index({ requestDate: 1, ticnum: 1 });
dbSchema.index({ pendingDate: 1, ticnum: 1 });
dbSchema.index({ reopenAtDate: 1, ticnum: 1 });
dbSchema.index({ notifyAtDate: 1, ticnum: 1 });
dbSchema.index({ ticnum: 1, bookmarks: 1 });

dbSchema.plugin(TicketSchema);
dbSchema.plugin(LastUpd);

dbSchema.index({ "$**": "text" })


dbSchema
  .virtual('bookmark')
  .get(function () {
    return false;
});

dbSchema
  .virtual('v__ageUnasigned')
  .get(function () {
    //var diffMs = (Date.now - this.requestDate);
    //return Math.round(((diffMs % 86400000) % 3600000) / 60000);
    return this.requestDate;
});
dbSchema
  .virtual('v__ageBookmarks')
  .get(function () {
    return this.requestDate;
});
dbSchema
  .virtual('v__ageOverdue')
  .get(function () {
    return this.requestDate;
});
dbSchema
  .virtual('v__ageKnowledge')
  .get(function () {
    return this.updateDate;
});
dbSchema
  .virtual('v__ageOldtickets')
  .get(function () {
    return this.requestDate;
});


dbSchema
  .virtual('v__live')
  .get(function () {
    return ["new", "open", "on-hold", "pending"].indexOf(this.status) >= 0;
   });



dbSchema
  .virtual('v__assignedDate')
  .get(function () {
    var diffMs = (Date.now - this.updateDate);
    return Math.round(((diffMs % 86400000) % 3600000) / 60000);
});
dbSchema
  .virtual('v__updateDate')
  .get(function () {
    var diffMs = (Date.now - this.updateDate);
    return Math.round(((diffMs % 86400000) % 3600000) / 60000);
});
dbSchema
  .virtual('v__dueDate')
  .get(function () {
    var diffMs = (Date.now - this.dueDate);
    return Math.round(((diffMs % 86400000) % 3600000) / 60000);
});



dbSchema.set('toObject', { virtuals: true });
dbSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ticket', dbSchema);






//dbSchema.index({ tnum: 1 });
//dbSchema.index({ subject: 1, ticnum: 1 });
//dbSchema.index({ description: 1, ticnum: 1 });
//dbSchema.index({ status: 1, ticnum: 1 });
//dbSchema.index({ requestDate: 1, ticnum: 1 });
//dbSchema.index({ openDate: 1, ticnum: 1 });
//dbSchema.index({ pendingDate: 1, ticnum: 1 });
//dbSchema.index({ holdDate: 1, ticnum: 1 });
//dbSchema.index({ solvedDate: 1, ticnum: 1 });
//dbSchema.index({ closeDate: 1, ticnum: 1 });
//dbSchema.index({ bookmark: 1, ticnum: 1 });
//dbSchema.index({ assignee: 1, ticnum: 1 });
//dbSchema.index({ dueDate: 1, ticnum: 1 });
//dbSchema.index({ tags: 1, ticnum: 1 });

//dbSchema.index({ reopenAtDate: 1, ticnum: 1 });
//dbSchema.index({ notifyAtDate: 1, ticnum: 1 });





//dbSchema.pre("validate", function (next) {

//    var doc = this;

//    if (typeof ticnum !== "number") {
//        mongoose.model("Ticket").count(function (err, num) {
//            if (err)
//                return next(err);

//            doc.ticnum = num + 6158;
//            return next();
//        });
//    } else if (this.isModified("ticnum") || this.isNew()) {
//        mongoose.model("Ticket").where({ _id: { $ne: this._id }, ticnum: this.ticnum }).count(function (err, count) {

//            if (err)
//                return next(err);

//            if (count > 0) {
//                mongoose.model("Ticket").update({ ticnum: { $gte: this.ticnum } }, { ticnum: { $inc: 1 } }, { multi: 1 }, function (err, numAffected) {
//                    next(err);
//                });

//            } else {
//                next();
//            }
//        });
//    } else {
//        next();
//    }
//});




//openDate: { type: Date },
//holdDate: { type: Date },
//solvedDate: { type: Date },
//closeDate: { type: Date },

//status: { type : String, default: 'new'  },
//assignee: { type : String, default : '', trim : true },
//priority: { type : String },
//dueDate: { type: Date },
//requester: { type : String, default : '', trim : true },
//requestcc: { type : String, trim : true },
//requestbc: { type : String, trim : true },
//subject: { type : String, default : '', trim : true },
//service: { type: Number, default: 0 },
//time: { type: Number, default: 0 },
//transport: { type: Number, default: 0 },
//purchase: { type: Number, default: 0 },
//price: { type: Number, default: 0 },
//reimburse: { type: Boolean, default: false },
//requital: { type : String, default : '', trim : true },
////description: { type : String, default : '', trim : true },
//tags: [{ type : String, trim : true }],



////requester: { type : String, default : '', trim : true , index: true },
//requester: {
//    email: { type : String, default : '', trim : true, index: true },
//name: { type : String, default : '', trim : true, index: true }
//},
//subject: { type : String, default : '', trim : true , index: true },
//description: { type : String, default : '', trim : true },
//status: { type : String, default : '', trim : true },
//type: { type : String, default : '', trim : true },
//priority: { type : String, default : '', trim : true },
//assignee: { type : String, default : '', trim : true },
//tags: { type : String, default : '', trim : true },
//due_at: { type : Date, default : Date.now },

//price: { id: { type: Number, default: 0 }, value: { type: Number, default: 0 } },
//service: { id: { type: Number, default: 0 }, value: { type : String, default : '', trim : true } },
//time: { id: { type: Number, default: 0 }, value: { type: Number, default: 0 } },
//transport: { id: { type: Number, default: 0 }, value: { type: Number, default: 0 } },
//purchase: { id: { type: Number, default: 0 }, value: { type: Number, default: 0 } },
//reimburse: { id: { type: Number, default: 0 }, value: { type: Boolean, default: false } },
//requital: { id: { type: Number, default: 0 }, value: { type: Number, default: 0 } },

//runat: {
//mon: { rt: { type: Boolean, default: false }, rv: { type: Number, default: 0 } },
//mday: { rt: { type: Boolean, default: false }, rv: { type: Number, default: 0 } },
//wday: { rt: { type: Boolean, default: false }, rv: { type: Number, default: 0 } },
//hours: { rt: { type: Boolean, default: false }, rv: { type: Number, default: 0 } },
//minutes: { rt: { type: Boolean, default: false }, rv: { type: Number, default: 0 } }
//}


//[
//   {
//              "requester": "yyyyyyyyy@ewgfergr.sk",
//              "subject": "bbbbbbbbbbbbb",
//              "status": "new",
//              "type": "task",
//              "priority": "low",
//              "assignee": "A1",
//              "service": "Helpdesk",
//              "rv_startd": "2014-12-30T23:00:00.000Z",
//              "rt_mon": false,
//              "rv_mon": "1",
//              "rt_man": true,
//              "price": null,
//              "time": 0.2,
//              "transport": 309,
//              "purchase": null,
//              "requital": "Úèet",
//              "reimburse": false,
//              "due_at": 30,
//              "rt_min": true,
//              "rv_min": "02",
//              "description": "xxxxxddd",
//              "id": "3195824853"   
//    }
//]