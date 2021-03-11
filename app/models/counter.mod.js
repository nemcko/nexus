'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var dbSchema = new Schema({
    _id: String, 
    last: Number
});

dbSchema.statics.increment = function (counter, callback) {
   return this.findByIdAndUpdate(counter, { $inc: { last: 1 } }, { new: true, upsert: true, select: { last: 1 } }, callback);
};
module.exports = mongoose.model('Counter', dbSchema);