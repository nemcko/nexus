'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LastUpd = require('../../app/lib/lastupd.js');

var dbSchema = new Schema({
    oid         : { type: String, required: true , unique: true },
    name        : { type: String },
    access      : [{ code: String, label: String, cando: [String] }]
});

dbSchema.pre('save', function (next) {
    if (this.isNew) {
        if (this.access === undefined) {
            this.access = [
                {
                    code: 'create',
                    label: 'Can Create',
                    cando: []
                },
                {
                    code: 'read',
                    label: 'Can Read',
                    cando: []
                },
                {
                    code: 'update',
                    label: 'Can Update',
                    cando: []
                },
                {
                    code: 'delete',
                    label: 'Can Delete',
                    cando: []
                }
            ];
        }
    }
    next();
});

//dbSchema.methods = {
//    setCreateAccess: function (utype, value) {
//        var index = this.canCreate.indexOf(utype);
//        this.canCreate.splice(index, 1);
//        if (value) {
//            this.canCreate.push(utype);
//        }
//    },
//    setReadAccess: function (utype, value) {
//        var index = this.canRead.indexOf(utype);
//        this.canRead.splice(index, 1);
//        if (value) {
//            this.canRead.push(utype);
//        }
//    },
//    setUpdateAccess: function (utype, value) {
//        var index = this.canUpdate.indexOf(utype);
//        this.canUpdate.splice(index, 1);
//        if (value) {
//            this.canUpdate.push(utype);
//        }
//    },
//    setDeleteAccess: function (utype, value) {
//        var index = this.canDelete.indexOf(utype);
//        this.canDelete.splice(index, 1);
//        if (value) {
//            this.canDelete.push(utype);
//        }
//    }

//};

//dbSchema
//  .virtual('canCreateGuest')
//  //.set(function (value) {
//  //      this.setCreateAccess('guest', value===true);
//  // })
//  .get(function () {
//    return this.canCreate.indexOf('guest') >= 0;
//});
//dbSchema
//  .virtual('canReadGuest')
//  //.set(function (value) {
//  //  this.setReadAccess('guest', value === true);
//  //  })
//  .get(function () {
//    return this.canRead.indexOf('guest') >= 0;
//});
//dbSchema
//  .virtual('canUpdateGuest')
//  //.set(function (value) {
//  //  this.setUpdateAccess('guest', value === true);
//  //  })
//  .get(function () {
//    return this.canUpdate.indexOf('guest') >= 0;
//});
//dbSchema
//  .virtual('canDeleteGuest')
//  //.set(function (value) {
//  //  this.setDeleteAccess('guest', value === true);
//  //  })
//  .get(function () {
//    return this.canDelete.indexOf('guest') >= 0;
//});





dbSchema.plugin(LastUpd);

module.exports = mongoose.model('Access', dbSchema);