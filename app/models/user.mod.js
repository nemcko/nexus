'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js')
  //, crypto = require('crypto')
  , passportLocalMongoose = require('passport-local-mongoose')
  ;

var dbSchema = new Schema({
    username    : { type: String, required: true , unique: true },
    password    : { type: String },
    fullname    : { type: String },
    phone       : { type: String },
    notes       : { type: String },
    tags        : { type: String },
    created     : { type: Date, default: Date.now },
    role        : { type: String, default: 'employee' }, 
    usertype    : { type: String, default: 'none' }, 
    organ       : { type: String }, 
    latestAccess: { type: Date }
    //hashedPassword: String,
    //salt: String
});

//dbSchema.post('remove', function (doc) {
//});





//dbSchema
//  .virtual('fullname')
//  .get(function () {
//    return (this.title ? this.title + ' ': '') 
//    + (this.name ? this.name + ' ': '') 
//    + (this.surname ? this.surname + ' ': '');
//});


//dbSchema
//  .virtual('password')
//  .set(function (password) {
//    this._password = password;
//    this.salt = this.makeSalt();
//    this.hashedPassword = this.encryptPassword(password);
//})
//  .get(function () {
//    return this._password;
//});

dbSchema.plugin(passportLocalMongoose);

//dbSchema.methods = {
//    authenticate: function (plainText) {
//        return this.encryptPassword(plainText) === this.hashedPassword;
//    },
//    makeSalt: function () {
//        return crypto.randomBytes(16).toString('base64');
//    },
//    encryptPassword: function (password) {
//        if (!password || !this.salt) return '';
//        var salt = new Buffer(this.salt, 'base64');
//        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
//    }
//};

dbSchema.plugin(LastUpd);

dbSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', dbSchema);