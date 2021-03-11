
'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name    : { type: String },
    fields  : [{ type : String }],
    accview: {
        type: ObjectId,
        ref: 'AccView'
    }
} 
, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
}
);

dbSchema
  .virtual('accid')
  .get(function () {
    return this.accview._id;
});

dbSchema.plugin(LastUpd);

dbSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Search', dbSchema);