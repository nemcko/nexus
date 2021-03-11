'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    name        : { type: String, required: true , unique: true },
    organ       : { type: String }, 
    agents      : [String]
});

/*
 GroupSchema.pre('remove', function(next){
    this.model('User').update(
        {_id: {$in: this.users}}, 
        {$pull: {groups: this._id}}, 
        {multi: true},
        next
    );
});
GroupSchema.pre('remove', function(next){
    this.model('User').update(
        {groups: this._id}, 
        {$pull: {groups: this._id}}, 
        {multi: true},
        next
    );
});
 */

dbSchema.plugin(LastUpd);

module.exports = mongoose.model('Group', dbSchema);