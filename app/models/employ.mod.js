'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var dbSchema = new Schema({
    user        : { type: String, required: true , unique: true },
    password    : { type: String },
    name        : { type: String },
    surname     : { type: String },
    title       : { type: String },
    company     : { type: String },
    phone       : { type: String },
    street      : { type: String },
    zip         : { type: String },
    city        : { type: String }
});

//dbSchema.index({ name: 1, surname: 1 }, { unique: true });

module.exports = mongoose.model('Employ', dbSchema);