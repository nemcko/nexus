'use strict';
var Mqtt = require('mqtt')
    , config = require('../../config')
    , mqtt = Mqtt.connect(config.mqttUri)
    //, util = require("util")
    //, events = require("events")
    , bSubscribed=false;

//function MyOwnClass() {
//}
//util.inherits(MyOwnClass, events.EventEmitter);

mqtt.on('connect', function () {
    if (!bSubscribed) {
        mqtt.subscribe('#');
        bSubscribed = true;
    }
});

mqtt.on('message', function (topic, message) {
    console.log('Mqtt: (' + topic + ') ' + message);
});

exports.publish = function (topic, message, opts) {
    return mqtt.publish(topic, message, opts);
}
