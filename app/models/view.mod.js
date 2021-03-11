
'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name    : { type: String },
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
    fields  : [{ type : String }],
    markers  : { type : Boolean },
    bookmarkfn: { type: String },
    kbcheck  : { type : Boolean },
    grpflds  : [{
            'field' : { type : String },
            'asc'  : { type: Boolean, default: true },
        }],
    srtflds  : [{
            'field' : { type : String },
            'asc'  : { type: Boolean, default: true },
        }],
    accview: {
        type: ObjectId,
        ref: 'AccView'
    }
} , {
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

//dbSchema
//  .virtual('can_view')
//  .get(function () {  
//    //return this.accview.access[0].cando.join();
//    return this.accview.access[0].cando;
//  });
//dbSchema
//  .virtual('can_change')
//  .get(function () {  
//    return this.accview.access[1].cando.join();
//  });

dbSchema.plugin(LastUpd);

dbSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('View', dbSchema);