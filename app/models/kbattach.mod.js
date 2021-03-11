'use strict';

var mongoose = require('mongoose')
  , config = require('../../config')
  , Schema = mongoose.Schema
  , connect = mongoose.createConnection(config.mongoBinUri)
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    refKbase: { type: Schema.Types.ObjectId, ref: 'Kbase' },
    refKbcom: { type: Schema.Types.ObjectId, ref: 'Kbase.comments' },
    attachment: [{
            uri       : { type: String },
            filename  : { type: String },
            type      : { type: String },
            data      : { type: String }
        }]
});

dbSchema.plugin(LastUpd);

dbSchema.index({ refKbase: 1, refKbcom: 1 });

module.exports = connect.model('Kbattach', dbSchema);