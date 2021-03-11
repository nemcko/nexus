'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js')
;
var dbSchema = new Schema({
    refCateg: { type: Schema.Types.ObjectId, ref: 'Kbcateg' },
    refAuthor: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type : String, default : '', trim : true },
    slug: { type : String },
    article: { type : String, default : '', trim : true },
    ticnum: { type: Number },   
    attachment: { type: Schema.Types.ObjectId, ref: 'Kbattach' },
    comments: [{
            refAgent: { type: Schema.Types.ObjectId, ref: 'User' },
            posted: { type: Date },
            comment: { type : String, default : '', trim : true },
            attachment: { type: Schema.Types.ObjectId, ref: 'Kbattach' },
            //viewed: [{ type: Schema.Types.ObjectId, ref: 'User' }],   
        }],
    //viewed: [{ type: Schema.Types.ObjectId, ref: 'User' }],   
});

dbSchema.index({ refCateg: 1 });
dbSchema.index({ slug: 1 });
//dbSchema.index({ name: 1 });

dbSchema.plugin(LastUpd);
dbSchema.index({ "$**": "text" })

dbSchema.set('toObject', { virtuals: true });
dbSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Kbase', dbSchema);
