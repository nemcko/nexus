'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name    : { type: String },
    shared  : { type: Boolean, default: false },
    type    : { type: String },
    position   : [{
            'code' : { type : String },
            'vcode' : { type : String },
            'view' : {
                "$db" : String,
                "$id": {},
                "$ref" : String
            },
            'size' : { type: String }
        }]
}
);


dbSchema.plugin(LastUpd);

dbSchema.index({ createUser: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('BoardPos', dbSchema);


//>var user = db.users.findOne({"name":"Tom Benzamin"})
//>var dbRef = user.address 
//> db[dbRef.$ref].findOne({ "_id": (dbRef.$id) })