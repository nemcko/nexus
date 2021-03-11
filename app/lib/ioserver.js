/**
 * @module socket.io library
 */
 
'use strict';

//var passport = require('passport')
//  ////, mqttCl = require('../lib/mqtt.js')
//  , crud = require('../lib/crud.js')
//  , ctrl = {};

////    config = require('../../config'),
////    mqtt = require('mqtt'),
////    mqttCl = mqtt.connect(config.mqttUri);
////    //mqtt = require('mows'),
////    //mqttCl = mqtt.createClient(config.mqttUri);

////mqttCl.on('connect', function () {
////    mqttCl.subscribe('#');
////});

////mqttCl.on('message', function (topic, message) {
////    console.log('Mqtt: ('+topic + ') ' + message);
////    //client.end();
////});

var model = require('../models/user.mod.js');

/*
 * Module for socket communication.
 * @method getAccess
 * @param server {Object} Http server object
 */
module.exports = function (server) {
    var io = require('socket.io').listen(server);

    io.on('connection', function (socket) {        
        socket.on('login', function (data) {
            console.log('login',data);
        });
        socket.on('logout', function (data) {
            console.log('logout',data);
        });
    });


    return {
        notice: function (type, username, data){
            io.sockets.emit('notice', {'type': type, 'username': username, 'data': data});
        },
        emit: function (msg, data) {
            io.sockets.emit(msg, data);
        }
    }

    return this;
}
