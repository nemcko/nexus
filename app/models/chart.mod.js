
'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name    : { type: String },
    charttype  : { type: String },
    period  : { type: String },
    timeunit  : { type: String },
    datasets: [{
            label    : { type: String },
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
            start  : { type: String },
            datefield  : { type: String },
            field  : { type : String },
            accumfn: { type: String },
            grpflds  : [{
                    'field' : { type : String },
                    'asc'  : { type: Boolean, default: true },
                }],
            srtflds  : [{
                    'field' : { type : String },
                    'asc'  : { type: Boolean, default: true },
                }]
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

module.exports = mongoose.model('Chart', dbSchema);