'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name        : { type: String, required: true , unique: true },
    info        : { type: String },
    ico         : { type: String },
    domains     : { type: [String] },
    notes       : { type: String },
    pricelevel  : { type: Number, default: 20 },
    defgroup    : { type: String },
    profile     : { type: String }
});

//dbSchema.options.toJSON = {
//    transform: function (doc, ret, options) {
//        ret.id = ret._id;
//        delete ret._id;
//        delete ret.__v;
//        return ret;
//    }
//};

//var userSchema = new mongoose.Schema({
//    passwordHash: { type: String, select: false }
//  ...
//});

//User.findOne({ email: theEmail }, '+passwordHash', callback);



dbSchema.plugin(LastUpd);

module.exports = mongoose.model('Organ', dbSchema);