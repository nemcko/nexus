
'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name    : { type: String },
    cardtype  : { type: String },
    position   : [{
            'code' : { type : String },
            'label' : { type : String },
            'title' : { type : String },
            'subtitle' : { type : String },
            anyof   : [{
                    'field' : { type : String },
                    'oper'  : { type : String },
                    'value' : { type : String }
                }],
            allof   : [{
                    'field' : { type : String },
                    'oper'  : { type : String },
                    'value' : { type : String }
                }],
            field  : { type : String },
            accumfn: { type: String }
        }],
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

module.exports = mongoose.model('Card', dbSchema);