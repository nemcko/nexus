module.exports = exports = function addTicketSchema(dbSchema) {
    var mongoose = require('mongoose')
      , Schema = mongoose.Schema
      , ObjectId = Schema.ObjectId;

    dbSchema.add({
        msgid: { type : String },
        ticnum: { type: Number },   
        //parent: { type: Number },   
        
        strOrgan: { type : String },
        strRequester: { type : String },
        strRequestcc: { type : String },
        strRequestbc: { type : String },
        strGroup: { type : String },
        strAgent: { type : String },      

        openDate: { type: Date },
        holdDate: { type: Date },
        solvedDate: { type: Date },
        closeDate: { type: Date },
        
        status: { type : String, default: 'new' },
        assignee: { type : String, default : '-', trim : true },
        priority: { type : String },
        dueDate: { type: Date },
        requester: { type : String, default : '', trim : true },
        requestcc: { type : String, trim : true },
        requestbc: { type : String, trim : true },
        service: { type : String, trim : true },
        time: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        purchase: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        reimburse: { type: Boolean, default: false },
        requital: { type : String, default : '', trim : true },
        tags: [{ type : String, trim : true }],
        channel: { type: String },

        subject: { type : String, default : '', trim : true },
        comment: { type : String, default : '', trim : true },

        updaterType: { type : String, default : '', trim : true },

    });
    
    dbSchema.index({ msgid: 1 });
    dbSchema.index({ tnum: 1 });
    dbSchema.index({ parent: 1, ticnum: 1 });
    dbSchema.index({ subject: 1, ticnum: 1 });
    //dbSchema.index({ comment: 1, ticnum: 1 });
    dbSchema.index({ status: 1, ticnum: 1 });
    dbSchema.index({ openDate: 1, ticnum: 1 });
    dbSchema.index({ holdDate: 1, ticnum: 1 });
    dbSchema.index({ solvedDate: 1, ticnum: 1 });
    dbSchema.index({ closeDate: 1, ticnum: 1 });
    dbSchema.index({ assignee: 1, ticnum: 1 });
    dbSchema.index({ dueDate: 1, ticnum: 1 });
    dbSchema.index({ tags: 1, ticnum: 1 });
    
}