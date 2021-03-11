'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js')
;
var dbSchema = new Schema({
    refAgent: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type : String, default : '', trim : true },
    slug: { type : String, default : '', trim : true },
    //articles: [{ type: Schema.Types.ObjectId, ref: 'Kbartic' }],
});

dbSchema.index({ slug: 1 });
dbSchema.index({ name: 1 });

dbSchema.plugin(LastUpd);

dbSchema.set('toObject', { virtuals: true });
dbSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Kbcateg', dbSchema);
