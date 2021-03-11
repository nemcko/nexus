var mongoose = require('mongoose')
  , async = require("async")
  , Counter = require('../models/counter.mod.js')
  //, TicketRen = require('../models/ticketren.mod.js')
;
module.exports = exports = function lastTicket(indata, callback) {
    Counter.increment('ticnum', function (err, result) {
        ticnum = result.last;
        indata.ticnum = ticnum
        return callback();
    });  
}