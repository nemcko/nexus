/**
 * @module Automation helper library
 * @description Automation utility for the Mongoose rest interface.
 */

'use strict';
var async = require("async")
  , Nodemailer = require('nodemailer')
  , inlineBase64 = require('nodemailer-plugin-inline-base64')
  , htmlToText = require('html-to-text')
  , Group = require('../models/group.mod.js')
  , User = require('../models/user.mod.js')
  , Organ = require('../models/organ.mod.js')
  , LastTicket = require('../lib/lastTicket.js')
  , Ticket = require('../models/ticket.mod.js')
  , TicketLog = require('../models/ticketlog.mod.js')
  , TicketAtt = require('../models/ticketatt.mod.js')
  , Image = require('../models/image.mod.js')
  , config = require('../../config')
  , ObjectId = require('mongodb').ObjectID
  , encoding = require("encoding")
;

/*
 * Check for virtual field.
 * @method isVirtualField
 * @param name {String} Field name
 */
function isVirtualField(name) {
    return name.substring(0, 3) === 'v__';
}
exports.isVirtualField = isVirtualField;

/*
 * Extract Ticket number from text.
 * @method getTicketNumber
 * @param txt {String} Text
 */
exports.getTicketNumber = function (txt) {
    var nr = txt.match(/(#\d+)/g);
    return nr?nr[0].replace('#', ''):null;
};

/*
 * Trim text.
 * @method trimText
 * @param str {String} Text
 * @param txt {String} Trim text
 */
exports.trimText = function (str,txt) {
    return str.replace(new RegExp('^[' + txt + '\uFEFF\xA0]+|[' + txt + '\uFEFF\xA0]$'), '');
};

/*
 * Get e-mail address from string.
 * @method getEmailAddr
 * @param txt {String} text
 */
exports.getEmailAddr = function (txt) {
    //var eaddr = txt.match(/(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g);
    //if (eaddr)
    //    return eaddr[0];
    //else
    //    eaddr = txt.match(/\"([^\"]+)\"\s+\<([^\>]+)\>/g);
    //if (eaddr)
    //    return eaddr[0];
    //else
    //return txt;
    //var ret = [];
    //var email = /\"([^\"]+)\"\s+\<([^\>]+)\>/g
    
    //var match;
    //while (match = email.exec(txt))
    //    ret.push({ 'name': match[1], 'email': match[2] })
    
    //return ret;

    var email = /<([^}]*)>/g;
    var match = email.exec(txt);
    if (match)
        return match[1];
    else
        return txt;
};

String.prototype.trimText = function (txt) {
    return this.replace(new RegExp('^[' + txt + '\uFEFF\xA0]+|[' + txt + '\uFEFF\xA0]$'), '');
};
/*
 * Get e-mail object from string.
 * @method GetEmailsFromString
 * @param input {String} Text
 */
exports.GetEmailsFromString = function (input) {
    var ret = [];
    //var email = /\"([^\"]+)\"\s+\<([^\>]+)\>/g
    var remail = /[^,;]+/g
    
    var match;
    while (match = remail.exec(input)) {
        //var name = match[0].match(/(.*)+\</g)[0].trimText('<').trimText(' ');
        var name = match[0].trimText(' ').split('<')[0].trimText(' ');
        if (!name) {
            name = match[0].split('@')[0].trimText(' ').trimText('<').trimText(' ');
        }
        ret.push({ 'name': name, 'emailaddress': exports.getEmailAddr(match[0]) })
    }
    if (ret.length)
        return ret;
    else
        return [{ 'name': '', 'emailaddress': exports.getEmailAddr(input) }];
}

/*
 * Format subject of mail.
 * @method formatrSubject
 * @param txt {String} Text
 * @param num {Number} Ticket number
 */
exports.formatrSubject = function (subject, num) {
    subject = subject.replace(/(#\d+)/g, '');
    subject = subject.replace(' ()','');
    subject = subject.replace('()',' ');
    subject = exports.trimText(subject, 'Re:');
    subject = exports.trimText(subject, 'Fwd:');
    subject = exports.trimText(subject, ' ');
    if (num)
        return subject + ' (#' + num + ')';
    else
        return subject;
};

/*
 * Extract comment of mail.
 * @method formatrSubject
 * @param txt {String} Text
 * @param num {Number} Ticket number
 */
exports.getMailComment = function (txt) {
    var rePattern = new RegExp(/<meta(?!\s*(?:name|value)\s*=)[^>]*?charset\s*=[\s"']*([a-zA-Z0-9-]+)[\s"'\/]*>/gim)
      , arrMatches 
      , charset = ''
      , t;
    
    if (txt === null || txt === undefined) return '';

    arrMatches = String(txt).match(rePattern);

    if (arrMatches && arrMatches.length) {
        for (var i = 0; i < arrMatches.length; i++) {
            charset = arrMatches[i].match(/charset=([a-zA-Z0-9-"]+)/i)[1];
        }
        charset = charset.replace('"', '').replace('"', '');
    }
    
    if (charset && charset.toLowerCase() !== "utf-8") {
        var resultBuffer = encoding.convert(txt, "utf-8", charset);
        t = resultBuffer.toString("utf-8");
    } else {
        t = String(txt);
    }

    t = t.replace(/^[\n\r]_______________________________________________$/gmi, '');
    t = t.replace(/^[\n\r]From: ([\s\S]*?)To:([\s\S]*?)Subject: (.+)$/gmi, '');
    t = t.replace(/^[\n\r]-------- Pôvodná správa --------/gmi, '');
    t = t.replace(/^[\n\r]Od: ([\s\S]*?)Komu:([\s\S]*?)Predmet: (.+)$/gmi, '');
 
    t = exports.trimText(t, ' ');
    t = exports.trimText(t, '\r');
    t = exports.trimText(t, '\n');
    t = t.split(config.mesageDelimiter)[0];
    var q = t.lastIndexOf("<blockquote");
    if (q >= 0) {
        t = t.substring(0, q);
        var b = t.lastIndexOf("<br");
        if (b >= 0) {
            t = t.substring(0, Math.floor(b / 2) - 4);
        }
    }
    return t || txt;
};

/*
 * Remove diacritic from string.
 * @method removeDiacritic
 * @param phrase {String} Text
 * @param bOnlyAscii {Logical} Only ascii character
 */
exports.removeDiacritic = function (phrase, bOnlyAscii) {
    var szDiaCritic = "áäčďéěíľĺňóôôöřŕšťúůüýřžÁÄČĎÉĚÍĽĹŇÓÔÖŘŠŤÚÜÝŘŽ";
    var szDiacRemoved = "aacdeeillnoooorrstuuuyrzAACDEEILLNOOORSTUUYRZ";
    var szText = "";
    
    if (bOnlyAscii === undefined) {
        szDiaCritic += " +=*/";
        szDiacRemoved += "_____";
    }
    
    for (var z = 0; z < phrase.length; z++) {
        var bFound = false;
        for (var d = 0; d < szDiaCritic.length; d++) {
            if (phrase[z] == szDiaCritic[d]) {
                szText += szDiacRemoved[d];
                bFound = true;
                break;
            };
        }
        if (!bFound) {
            szText += phrase[z];
        };
    }
    return szText;
};

/*
 * Construct query string.
 * @method constructQueryValue
 * @param item {String} Query item
 */
 function constructQueryValue(item) {
    //switch (item.oper) {
    //    case 's_eq': return "{'" + item.field + "': \"" + escape(item.value) + "\" }";
    //    case 's_ne': return "{'" + item.field + "': { $ne: \"" + escape(item.value) + "\" }}";
    //    case 's_beg': return "{'" + item.field + "': { $regex: /^" + escape(item.value) + "/, $options: \"si\" }}";
    //    case 's_end': return "{'" + item.field + "': { $regex: /" + escape(item.value) + "$/, $options: \"si\" }}";
    //    case 's_con': return "{'" + item.field + "': { $regex: /" + escape(item.value) + "/, $options: \"si\" }}";
    //    case 's_ncon': return "{'" + item.field + "': { $ne: {$regex: /" + escape(item.value) + "/, $options: \"si\" }}}";
    //    case 'n_eq': return "{'" + item.field + "': { $eq: " + item.value + " }}";
    //    case 'n_ne': return "{'" + item.field + "': { $ne: " + item.value + " }}";
    //    case 'n_lt': return "{'" + item.field + "': { $lt: " + item.value + " }}";
    //    case 'n_gt': return "{'" + item.field + "': { $gt: " + item.value + " }}";
    //    case 'n_lte': return "{'" + item.field + "': { $gte: " + item.value + " }}";
    //    case 'n_gte': return "{'" + item.field + "': { $gte: " + item.value + " }}";
    //    case 'd_eq': return "{'" + item.field + "': { $eq: ISODate(" + item.value + ") }}";
    //    case 'd_ne': return "{'" + item.field + "': { $ne: ISODate(" + item.value + ") }}";
    //    case 'd_lt': return "{'" + item.field + "': { $lt: ISODate(" + item.value + ") }}";
    //    case 'd_gt': return "{'" + item.field + "': { $gt: ISODate(" + item.value + ") }}";
    //    case 'd_lte': return "{'" + item.field + "': { $lte: ISODate(" + item.value + ") }}";
    //    case 'd_gte': return "{'" + item.field + "': { $gte: ISODate(" + item.value + ") }}";
    //    case 'b_1': return "{'" + item.field + "':true}";
    //    case 'b_0': return "{'" + item.field + "':false}";
    //    case 'set': return "{'" + item.field + "':{ " + (item.value == 'null'?'$eq':'$ne') + ": null }}";
    //        break;
    //    default:
    //        return '';

    //var field = {};
    //switch (item.oper) {
    //    case 's_eq': field[item.field]= item.value; break;
    //    case 's_ne': field[item.field]= { $ne: item.value }; break;
    //    case 's_beg': field[item.field]= { $regex: /^" + escape(item.value) + "/, $options: "si" }; break;
    //    case 's_end': field[item.field]= { $regex: /" + escape(item.value) + "$/, $options: "si" }; break;
    //    case 's_con': field[item.field]= { $regex: /" + escape(item.value) + "/, $options: "si" }; break;
    //    case 's_ncon': field[item.field]= { $ne: { $regex: /" + escape(item.value) + "/, $options: "si" } }; break;
    //    case 'n_eq': field[item.field]= { $eq: item.value }; break;
    //    case 'n_ne': field[item.field]= { $ne: item.value }; break;
    //    case 'n_lt': field[item.field]= { $lt: item.value }; break;
    //    case 'n_gt': field[item.field]= { $gt: item.value }; break;
    //    case 'n_lte': field[item.field]= { $gte: item.value }; break;
    //    case 'n_gte': field[item.field]= { $gte: item.value }; break;
    //    case 'd_eq': field[item.field]= { $eq: item.value }; break;
    //    case 'd_ne': field[item.field]= { $ne: item.value }; break;
    //    case 'd_lt': field[item.field]= { $lt: item.value }; break;
    //    case 'd_gt': field[item.field]= { $gt: item.value }; break;
    //    case 'd_lte': field[item.field]= { $lte: item.value }; break;
    //    case 'd_gte': field[item.field]= { $gte: item.value }; break;
    //    case 'b_1': field[item.field]= true; break;
    //    case 'b_0': field[item.field]= false; break;
    //    case 'set': field[item.field]= (item.value == 'null'? { $eq: null }:{ $ne: null }); break;
    //        break;
    //}
    //return field;

    switch (item.oper) {
        case 's_eq': return item.value;
        case 's_ne': return { $ne: item.value };
        case 's_beg': return { $regex: /^" + escape(item.value) + "/, $options: "si" };
        case 's_end': return { $regex: /" + escape(item.value) + "$/, $options: "si" };
        case 's_con': return { $regex: /" + escape(item.value) + "/, $options: "si" };
        case 's_ncon': return { $ne: { $regex: /" + escape(item.value) + "/, $options: "si" } };
        case 's_in': return { $in: item.value.split(',') };
        case 's_nin': return { $nin: item.value.split(',') };
        case 'n_eq': return { $eq: item.value };
        case 'n_ne': return { $ne: item.value };
        case 'n_lt': return { $lt: item.value };
        case 'n_gt': return { $gt: item.value };
        case 'n_lte': return { $gte: item.value };
        case 'n_gte': return { $gte: item.value };
        case 'd_eq': return { $eq: item.value };
        case 'd_ne': return { $ne: item.value };
        case 'd_lt': return { $lt: item.value };
        case 'd_gt': return { $gt: item.value };
        case 'd_lte': return { $lte: item.value };
        case 'd_gte': return { $gte: item.value };
        case 'b_1': return true;
        case 'b_0': return false;
        case 'set': return (item.value == 'null'? { $eq: null }:{ $ne: null });
        default:
            return null;
    }
}



/*
 * Construct query string.
 * @method setQueryWhereAndCond
 */
 function setQueryCond(query, operator, fieldvalue) {
    switch (operator) {
        case 's_eq':
            return query.equals(fieldvalue);
            break;
        case 's_ne':
            return query.ne(fieldvalue);
            break;
        case 's_beg':
            return query.regex(new RegExp("^" + escape(fieldvalue)));
            break;
        case 's_end':
            return query.regex(new RegExp(escape(fieldvalue) + "$"));
            break;
        case 's_con':
            return query.regex(new RegExp(escape(fieldvalue)));
            break;
        case 's_ncon':
            return query.regex(new RegExp("^((?!" + escape(fieldvalue) + ").)*$"));
            break;
        case 's_in':
            return query.in(item.value.split(','));
            break;
        case 's_nin':
            return query.nin(item.value.split(','));
            break;
        case 'n_eq':
            return query.equals(fieldvalue);
            break;
        case 'n_ne':
            return query.ne(fieldvalue);
            break;
        case 'n_lt':
            return query.lt(fieldvalue);
            break;
        case 'n_gt':
            return query.gt(fieldvalue);
            break;
        case 'n_lte':
            return query.lte(fieldvalue);
            break;
        case 'n_gte':
            return query.gte(fieldvalue);
            break;
        case 'd_eq':
            return query.equals(fieldvalue);
            break;
        case 'd_ne':
            return query.ne(fieldvalue);
            break;
        case 'd_lt':
            return query.lt(fieldvalue);
            break;
        case 'd_gt':
            return query.gt(fieldvalue);
            break;
        case 'd_lte':
            return query.lte(fieldvalue);
            break;
        case 'd_gte':
            return query.gte(fieldvalue);
            break;
        case 'b_1':
            return query.equals(true);
            break;
        case 'b_0':
            return query.ne(false);
            break;
        case 'set':
            if (fieldvalue == null)
                return query.equals(null);
            else
                return query.ne(null);
            break;
    }

}


// Helper function for 
function dateStringParse(value) {
    if (typeof value === 'string') {
        var matches = value.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
        if (matches === null) {
            matches = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (matches === null) {
                return null;
            } else {
                var year = parseInt(matches[3], 10);
                var month = parseInt(matches[2], 10) - 1; // months are 0-11
                var day = parseInt(matches[1], 10);
                var date = new Date(year, month, day);
                if (date.getFullYear() !== year 
                || date.getMonth() != month 
                || date.getDate() !== day
            ) {
                    return null;
                } else {
                    return date;
                }
            };
        } else {
            var year = parseInt(matches[3], 10);
            var month = parseInt(matches[2], 10) - 1; // months are 0-11
            var day = parseInt(matches[1], 10);
            var hour = parseInt(matches[4], 10);
            var minute = parseInt(matches[5], 10);
            var second = parseInt(matches[6], 10);
            var date = new Date(year, month, day, hour, minute, second);
            if (date.getFullYear() !== year 
          || date.getMonth() != month 
          || date.getDate() !== day 
          || date.getHours() !== hour 
          || date.getMinutes() !== minute
          //|| date.getSeconds() !== second
        ) {
                return null;
            } else {
                return date;
            }
        }
    } else {
        return value;
    }
};
exports.dateStringParse = dateStringParse;

/*
 * Construct JavaScript query string.
 * @method constructJsQueryValue
 * @param item {String} Query item
 * @param pref {String} Object prefix
 */
 function constructJsQueryValue(item, pref) {
    switch (item.oper) {
        case 's_eq': return "(" + pref + item.field + " == \"" + escape(item.value) + "\" )";
        case 's_ne': return "(" + pref + item.field + " != \"" + escape(item.value) + "\" )";
        case 's_beg': return "(" + pref + item.field + ".search(/^" + escape(item.value) + "/i) >= 0 )";
        case 's_end': return "(" + pref + item.field + ".search(/" + escape(item.value) + "$/i) >= 0 )";
        case 's_con': return "(" + pref + item.field + ".search(/" + escape(item.value) + "/i) >= 0 )";
        case 's_ncon': return "( " + pref + item.field + ".search(/" + escape(item.value) + "/i) < 0 )";
        case 's_in': return "( ['" + item.value.split(',').join("','") + "'].indexOf(" + pref + item.field + ") >= 0 )";
        case 's_nin': return "( ['" + item.value.split(',').join("','") + "'].indexOf(" + pref + item.field + ") < 0 )";
        case 'n_eq': return "(" + pref + item.field + " == " + item.value + " )";
        case 'n_ne': return "(" + pref + item.field + " != " + item.value + " )";
        case 'n_lt': return "(" + pref + item.field + " < " + item.value + " )";
        case 'n_gt': return "(" + pref + item.field + " > " + item.value + " )";
        case 'n_lte': return "(" + pref + item.field + " <= " + item.value + " )";
        case 'n_gte': return "(" + pref + item.field + " >= " + item.value + " )";
        case 'd_eq': return "(" + pref + item.field + " == ISODate(" + item.value + ") )";
        case 'd_ne': return "(" + pref + item.field + " != ISODate(" + item.value + ") )";
        case 'd_lt': return "(" + pref + item.field + " < ISODate(" + item.value + ") )";
        case 'd_gt': return "(" + pref + item.field + " > ISODate(" + item.value + ") )";
        case 'd_lte': return "(" + pref + item.field + " <= ISODate(" + item.value + ") )";
        case 'd_gte': return "(" + pref + item.field + " >= ISODate(" + item.value + ") )";
        case 'b_1': return "(" + pref + item.field + " == true)";
        case 'b_0': return "(" + pref + item.field + "== false)";
        case 'set': return (item.value == 'null'?'!':'') + "(" + pref + item.field + ")";
        //case 'set': return (item.value == 'null'?'':'!') + "('" + pref + item.field + "'== null || '" + pref + item.field + "'==='')";
            break;
        default:
            return '';
    }
}

/*
 * Construct query for select data.
 * @method constructQuery
 * @param view {object} View object
 * @param user {object} User object
 */
function constructQuery(view,user) {
    var query = {}
      , arr = {};
    
    //view.allof.forEach(function (item) {
    //    var fld = {};
    //    fld[item.field] = constructQueryValue(item);
    //    query.$and.push({
    //        requester: constructQueryValue(item)
    //    });
    //});

    //view.anyof.forEach(function (item) {
    //    fields.push(constructQueryValue(item));
    //});
    //if (fields.length) {
    //    query.$or = fields;
    //}

    //if (user) {
    //    switch (view.access.viewacc) {
    //        case 'agall':
    //            break;
    //        case 'aggrp':
    //            break;
    //        case 'agorg':
    //            break;
    //        case 'agusr':
    //            break;
    //        case 'clorg':
    //            query = "{ $and: [{refRequester:'" + user.username + "'}," + query + "]}"
    //            break;
    //        case 'clusr':
    //            query = "{ $and: [{refRequester:'" + user.username + "'}," + query + "]}"
    //            break;
    //    }
    //}
    //var test = objToString(query);
    return query;
}
exports.constructQuery = constructQuery;

function buildQueryItem(item,fld) {
    var field = {};
    if (fld) field = fld;
    switch (item.oper) {
        case 's_eq': field[item.field] = item.value; break;
        case 's_ne': field[item.field] = { $ne: item.value }; break;
        case 's_beg': field[item.field] = { $regex: /^" + escape(item.value) + "/, $options: "si" }; break;
        case 's_end': field[item.field] = { $regex: /" + escape(item.value) + "$/, $options: "si" }; break;
        case 's_con': field[item.field] = { $regex: /" + escape(item.value) + "/, $options: "si" }; break;
        case 's_ncon': field[item.field] = { $ne: { $regex: /" + escape(item.value) + "/, $options: "si" } }; break;
        case 's_in': field[item.field] = { $in: item.value.split(',') }; break;
        case 's_nin': field[item.field] = { $nin: item.value.split(',') }; break;
        case 'n_eq': field[item.field] = { $eq: item.value }; break;
        case 'n_ne': field[item.field] = { $ne: item.value }; break;
        case 'n_lt': field[item.field] = { $lt: item.value }; break;
        case 'n_gt': field[item.field] = { $gt: item.value }; break;
        case 'n_lte': field[item.field] = { $gte: item.value }; break;
        case 'n_gte': field[item.field] = { $gte: item.value }; break;
        case 'd_eq': field[item.field] = { $eq: item.value }; break;
        case 'd_ne': field[item.field] = { $ne: item.value }; break;
        case 'd_lt': field[item.field] = { $lt: item.value }; break;
        case 'd_gt': field[item.field] = { $gt: item.value }; break;
        case 'd_lte': field[item.field] = { $lte: item.value }; break;
        case 'd_gte': field[item.field] = { $gte: item.value }; break;
        case 'b_1': field[item.field] = true; break;
        case 'b_0': field[item.field] = false; break;
        case 'set': field[item.field] = (item.value == 'null'? { $eq: null }:{ $ne: null }); break;
            break;
    }
    return field;
}

function buildAndQueryItem(query, item){
    /*
    switch (item.oper) {
        case 's_eq':
            query.where(item.field).equals(item.value);
            break;
        case 's_ne':
            query.where(item.field).ne(item.value);
            break;
        case 's_beg':
            query.where(item.field).regex(new RegExp("^" + escape(item.value) ));
            break;
        case 's_end':
            query.where(item.field).regex(new RegExp(escape(item.value)+"$"));
            break;
        case 's_con':
            query.where(item.field).regex(new RegExp(escape(item.value)));
            break;
        case 's_ncon':
            query.where(item.field).regex(new RegExp("^((?!" + escape(item.value) +").)*$"));
            break;
        case 's_in':
            query.where(item.field).in(item.value.split(','));
            break;
        case 's_nin':
            query.where(item.field).nin(item.value.split(','));
            break;
        case 'n_eq':
            query.where(item.field).equals(item.value);
            break;
        case 'n_ne':
            query.where(item.field).ne(item.value);
            break;
        case 'n_lt':
            query.where(item.field).lt(item.value);
            break;
        case 'n_gt':
            query.where(item.field).gt(item.value);
            break;
        case 'n_lte':
            query.where(item.field).lte(item.value);
            break;
        case 'n_gte':
            query.where(item.field).gte(item.value);
            break;
        case 'd_eq':
            query.where(item.field).equals(item.value);
            break;
        case 'd_ne':
            query.where(item.field).ne(item.value);
            break;
        case 'd_lt':
            query.where(item.field).lt(item.value);
            break;
        case 'd_gt':
            query.where(item.field).gt(item.value);
            break;
        case 'd_lte':
            query.where(item.field).lte(item.value);
            break;
        case 'd_gte':
            query.where(item.field).gte(item.value);
            break;
        case 'b_1':
            query.where(item.field).equals(true);
            true;
            break;
        case 'b_0':
            query.where(item.field).ne(false);
            false;
            break;
        case 'set':
            if (item.value == null)
                query.where(item.field).equals(null);
            else
                query.where(item.field).ne(null);
            break;
    }
    */
    query.where(buildQueryItem(item));

}

function buildOrQueryItem(query, item) {
    //switch (item.oper) {
    //    case 's_eq':
    //        query.or(item.field).equals(item.value);
    //        break;
    //    case 's_ne':
    //        query.or(item.field).ne(item.value);
    //        break;
    //    case 's_beg':
    //        query.or(item.field).regex(new RegExp("^" + escape(item.value)));
    //        break;
    //    case 's_end':
    //        query.or(item.field).regex(new RegExp(escape(item.value) + "$"));
    //        break;
    //    case 's_con':
    //        query.or(item.field).regex(new RegExp(escape(item.value)));
    //        break;
    //    case 's_ncon':
    //        query.or(item.field).regex(new RegExp("^((?!" + escape(item.value) + ").)*$"));
    //        break;
    //    case 'n_eq':
    //        query.or(item.field).equals(item.value);
    //        break;
    //    case 'n_ne':
    //        query.or(item.field).ne(item.value);
    //        break;
    //    case 'n_lt':
    //        query.or(item.field).lt(item.value);
    //        break;
    //    case 'n_gt':
    //        query.or(item.field).gt(item.value);
    //        break;
    //    case 'n_lte':
    //        query.or(item.field).lte(item.value);
    //        break;
    //    case 'n_gte':
    //        query.or(item.field).gte(item.value);
    //        break;
    //    case 'd_eq':
    //        query.or(item.field).equals(item.value);
    //        break;
    //    case 'd_ne':
    //        query.or(item.field).ne(item.value);
    //        break;
    //    case 'd_lt':
    //        query.or(item.field).lt(item.value);
    //        break;
    //    case 'd_gt':
    //        query.or(item.field).gt(item.value);
    //        break;
    //    case 'd_lte':
    //        query.or(item.field).lte(item.value);
    //        break;
    //    case 'd_gte':
    //        query.or(item.field).gte(item.value);
    //        break;
    //    case 'b_1':
    //        query.or(item.field).equals(true);
    //        true;
    //        break;
    //    case 'b_0':
    //        query.or(item.field).ne(false);
    //        false;
    //        break;
    //    case 'set':
    //        if (item.value == null)
    //            query.or(item.field).equals(null);
    //        else
    //            query.or(item.field).ne(null);
    //        break;
    //}
    
    /*
      var field = {};
    switch (item.oper) {
        case 's_eq': field[item.field]= item.value; break;
        case 's_ne': field[item.field]= { $ne: item.value }; break;
        case 's_beg': field[item.field]= { $regex: /^" + escape(item.value) + "/, $options: "si" }; break;
        case 's_end': field[item.field]= { $regex: /" + escape(item.value) + "$/, $options: "si" }; break;
        case 's_con': field[item.field]= { $regex: /" + escape(item.value) + "/, $options: "si" }; break;
        case 's_ncon': field[item.field] = { $ne: { $regex: /" + escape(item.value) + "/, $options: "si" } }; break;
        case 's_in': field[item.field] = { $in: item.value.split(',') }; break;
        case 's_nin': field[item.field] = { $nin: item.value.split(',') }; break;
        case 'n_eq': field[item.field]= { $eq: item.value }; break;
        case 'n_ne': field[item.field]= { $ne: item.value }; break;
        case 'n_lt': field[item.field]= { $lt: item.value }; break;
        case 'n_gt': field[item.field]= { $gt: item.value }; break;
        case 'n_lte': field[item.field]= { $gte: item.value }; break;
        case 'n_gte': field[item.field]= { $gte: item.value }; break;
        case 'd_eq': field[item.field]= { $eq: item.value }; break;
        case 'd_ne': field[item.field]= { $ne: item.value }; break;
        case 'd_lt': field[item.field]= { $lt: item.value }; break;
        case 'd_gt': field[item.field]= { $gt: item.value }; break;
        case 'd_lte': field[item.field]= { $lte: item.value }; break;
        case 'd_gte': field[item.field]= { $gte: item.value }; break;
        case 'b_1': field[item.field]= true; break;
        case 'b_0': field[item.field]= false; break;
        case 'set': field[item.field]= (item.value == 'null'? { $eq: null }:{ $ne: null }); break;
            break;
    }
    query.or(field);
     */
    query.or(buildQueryItem(item));
}

function replaceCurrentItems(item, state) {
    switch (item.field) {
        case 'assignee':
            if (item.value === '<current_user>') item.value = state.request.user.username;
            break;
    }  
}

/*
 * Construct query for select data.
 * @method buildQuery
 * @param query {object} Query object
 * @param view {object} View object
 * @param state {object} State object
 */
function buildQuery(query, view, state) {
    if (view.allof) {
        view.allof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildAndQueryItem(query, item);
            }
        });
    }
    
    if (view.anyof) {
        view.anyof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildOrQueryItem(query, item);
            }
        });
    }
    
    if (view.allof) {
        view.allof.forEach(function (item) {
            if (item.field.indexOf('#') >= 0) {
                var fldcode = item.field.split("#");
                switch (fldcode[1]) {
                    case "overdate":
                        var curdate = new Date();
                        query.where(fldcode[0]);
                        setQueryCond(query, item.oper, curdate - item.value);
                        //query.lte(0);
                        break;
                }

            }
        });
    }
    //state.orgfields.forEach(function (item) {
    //    switch (item.org) {
    //        case "dueDate#overdate":
    //            var xxx = constructQueryValue({ oper: '', value: '' });
    //            break;
    //    } 
    //});

    //if (state.request.body.bookmarkfn && state.request.body.bookmarkfn === 'assign') {
    //    query.where('assignee').equals('');
    //}
    if (state.request.body.bookmarkfn && state.request.body.bookmarkfn === 'marked') {
        query.where('bookmarks').all(state.request.user._id);
    }

    //switch (view.access.viewacc) {
    //    case 'agall':
    //        break;
    //    case 'aggrp':
    //        query.where('strGroup').equals(state.strGroup);
    //        break;
    //    case 'agorg':
    //        query.where('strOrgan').equals(state.strOrgan);
    //        break;
    //    case 'agusr':
    //        query.where('strAgent').equals(state.request.user.username);
    //        break;
    //    case 'clorg':
    //        query.where('strOrgan').equals(state.strOrgan);
    //        break;
    //    case 'clusr':
    //        query.where('strRequester').equals(state.request.user.username);
    //        break;
    //}
    addWhereCond(query, view, state);
}
exports.buildQuery = buildQuery;

/*
 * Construct query for aggregation data.
 * @method aggregateQuery
 * @param model {object} Model object
 * @param view {object} View object
 * @param grpfld {object} View group field
 * @param fields {object} View fields
 * @param state {object} State object
 * @param callback {Function} callback function
 */
function aggregateQuery(model, view, grpfld, fields, state, callback) {
/*
    var query = model.find();

    if (view.allof) {
        view.allof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildAndQueryItem(query, item);
            }
        });
    }
    
    if (view.anyof) {
        view.anyof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildOrQueryItem(query, item);
            }
        });
    }
    
    //if (view.allof) {
    //    view.allof.forEach(function (item) {
    //        if (item.field.indexOf('#') >= 0) {
    //            var fldcode = item.field.split("#");
    //            switch (fldcode[1]) {
    //                case "overdate":
    //                    var curdate = new Date();
    //                    query.where(fldcode[0]);
    //                    setQueryCond(query, item.oper, curdate - item.value);
    //                    //query.lte(0);
    //                    break;
    //            }

    //        }
    //    });
    //}
    //addWhereCond(query, view, state);
*/     

    var query = addWhereCond(null, view, state);    
    if (view.allof) {
        view.allof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildQueryItem(item, query);
            }
        });
    }
    
    if (view.anyof) {
        view.anyof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildOrQueryItem(query, item);
            }
        });
    }

    
    var agrfields = { _id: '$' + grpfld };
    var flds= fields.split(' ');
    for (var i = 0; i < flds.length; i++) {
        if (flds[i]) {
            agrfields[flds[i]] = { $sum: '$' + flds[i] };
        }
    }
    //console.dir(agrfields);

    model.aggregate([
        { $match: query },
        { $group: agrfields }
    ], callback);
}
exports.aggregateQuery = aggregateQuery;


/*
 * Initialize query data for aggregation.
 * @method aggreginit
 * @param model {object} Model object
 * @param view {object} View object
 * @param dataset {object} Dataset object
 * @param state {object} State object
 * @param selDate {object} State date
 * @param results {object} Result grid
 * @param callback {Function} callback function
 */
function aggreginit(model, view, dataset, state, selDate, results, callback) {
    var startDate, endDate, actDate;
    startDate = endDate = selDate;
    switch (dataset.start) {
        case "year1":
            startDate = endDate = new Date(Date.UTC(selDate.getFullYear(), 1, 1));
            break;
        case "year-1":
            startDate = endDate = new Date(Date.UTC(selDate.getFullYear() - 1, selDate.getMonth(), 1));
            break;
        case "month-1":
            startDate = endDate = new Date(Date.UTC(selDate.getFullYear() - 1, selDate.getMonth()-1, 1));
            break;
        default:
            startDate = endDate = new Date(Date.UTC(selDate.getFullYear(), selDate.getMonth(), 1));
            break;
    }
    
    switch (view.period) {
        case "month3":
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3 , 0);
            break;
        case "month6":
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6 , 0);
            break;
        case "year":
            endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth() + 1 , 0);
            break;
        default:
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1 , 0);
            break;
    }
    //var s = startDate.toLocaleDateString(), e = endDate.toLocaleDateString(),
    //x;
   
    function nextDate(curDate, interval) {
        switch (view.period) {
            case "week": return new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate() + 7, 0, 0, 0, 0);
            case "month": return (curDate.getMonth() == 11? new Date(curDate.getFullYear() + 1, 0, 1, 0, 0, 0, 0):new Date(curDate.getFullYear(), curDate.getMonth() + 1, 1, 0, 0, 0, 0));
            default: return new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate()+1, 0, 0, 0, 0);
        }
    }

    function initDate(curDate) {
        var pkey = "";
        switch (view.timeunit) {
            case "week": {
                var d = new Date(+curDate);
                d.setHours(0, 0, 0);
                d.setDate(d.getDate() + 4 - (d.getDay() || 7));
                //pkey = curDate.getFullYear() + "-" + Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
                pkey = Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
            }
            break;
            case "month":
                //pkey = curDate.getFullYear() + "-" + (curDate.getMonth()+1);
                pkey = (curDate.getMonth()+1);
                break;
            default:
                //pkey = curDate.getFullYear() + "-" + (curDate.getMonth()+1) + "-" + curDate.getDate();
                pkey = (curDate.getMonth()+1) + "-" + curDate.getDate();
                break;
        }
        if (!results['grid']) results['grid'] = {};
        if (!results.grid[pkey]) results.grid[pkey] = {};
    }
    results['startDate'] = startDate;
    results['endDate'] = endDate;
    while (startDate <= endDate) {
        initDate(startDate);
        startDate = nextDate(startDate, view.timeunit);
    }
    callback();
}
exports.aggreginit = aggreginit;

/*
 * Construct query for aggregation data.
 * @method aggregate
 * @param model {object} Model object
 * @param view {object} View object
 * @param dataset {object} Dataset object
 * @param state {object} State object
 * @param results {object} Results object
 * @param callback {Function} callback function
 */
function aggregate(model, view, dataset, state, results, callback) {
/*
 start
    "code": "year1",
    "code": "month1",
    "code": "year-1",
    "code": "month-1",
 period
    "code": "month1",
    "code": "month3",
    "code": "month6",
    "code": "year",
timeunit
    "code": "day",
    "code": "week",
    "code": "month",
 */  
    
    var query = addWhereCond(null, view, state);
    //query[dataset.datefield] = { $and: [{ $gte: results.startDate }, { $lte: results.endDate }] };
    var andoper = [{}, {}];
    andoper[0][dataset.datefield] = { $gte: results.startDate };
    andoper[1][dataset.datefield] = { $lte: results.endDate  }; 
    query["$and"] = andoper;
    
    if (dataset.allof) {
        dataset.allof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildQueryItem(item, query);
            }
        });
    }
    
    if (dataset.anyof) {
        dataset.anyof.forEach(function (item) {
            if (item.field.indexOf('#') < 0) {
                replaceCurrentItems(item, state);
                buildOrQueryItem(query, item);
            }
        });
    }
    
                
    var timeunits = {
        "day": [
            { $match: query },
            {
                $project: {
                    "pname": (dataset.grpflds.length > 0? "$" + dataset.grpflds[0].field: dataset.label),
                    "pkey": {
                        //year: { $year: "$" + dataset.datefield },
                        month: { $month: "$" + dataset.datefield },
                        day: { $dayOfMonth: "$" + dataset.datefield },
                    },  
                    "punit": { $dayOfYear: "$" + dataset.datefield },     
                    "pvalue": { $cond: [dataset.accumfn === "sum", "$" + dataset.field, 1] }
                }
            }, 
            { $group: { "_id": { pname: "$pname", pkey: "$pkey" }, "value": { $sum: "$pvalue" } } },
            { $group: { "_id": "$_id.pname", "keys": { $push: "$_id.pkey" } , "values": { $push: "$value" } } }
        ],
        "week": [
            { $match: query },
            {
                $project: {
                    "pname": (dataset.grpflds.length > 0? "$" + dataset.grpflds[0].field: dataset.label),
                    "pkey": {
                        //year: { $year: "$" + dataset.datefield },
                        week: { $week: "$" + dataset.datefield },
                    },         
                    "pvalue": { $cond: [dataset.accumfn === "sum", "$" + dataset.field, 1] }
                }
            }, 
            { $group: { "_id": { pname: "$pname", pkey: "$pkey" }, "value": { $sum: "$pvalue" } } },
            { $group: { "_id": "$_id.pname", "keys": { $push: "$_id.pkey" } , "values": { $push: "$value" } } }
        ],
        "month": [
            { $match: query },
            {
                $project: {
                    "pname": (dataset.grpflds.length > 0? "$" + dataset.grpflds[0].field: dataset.label),
                    "pkey": {
                        //year: { $year: "$" + dataset.datefield },
                        month: { $month: "$" + dataset.datefield },
                    },         
                    "pvalue": { $cond: [dataset.accumfn === "sum", "$" + dataset.field, 1] }
                }
            }, 
            { $group: { "_id": { pname: "$pname", pkey: "$pkey" }, "value": { $sum: "$pvalue" } } },
            { $group: { "_id": "$_id.pname", "keys": { $push: "$_id.pkey" } , "values": { $push: "$value" } } }
        ]
    };
    return model.aggregate(timeunits[view.timeunit], callback);
}
exports.aggregate = aggregate;

/*
 * Construct full text query for select data.
 * @method addWhereCond
 * @param query {object} Query object
 * @param view {object} View object
 * @param state {object} State object
 */
function addWhereCond(query, view, state) {
    var qfld = {};
    
    if (view.kbcheck) {
        qfld['viewed'] = { $exists: true, $nin: [new ObjectId(state.request.user._id)] };
    }

    switch (view.access.viewacc) {
        case 'agall':
            break;
        case 'aggrp':
            //query.where('strGroup').equals(state.strGroup);
            qfld['strGroup'] = state.strGroup;
            break;
        case 'agorg':
            //query.where('strOrgan').equals(state.strOrgan);
            qfld['strOrgan'] = state.strOrgan;
            break;
        case 'agusr':
            //query.where('strAgent').equals(state.request.user.username);
            qfld['strAgent'] = state.request.user.username;
            break;
        case 'clorg':
            //query.where('strOrgan').equals(state.strOrgan);
            qfld['strOrgan'] = state.strOrgan;
            break;
        case 'clusr':
            //query.where('strRequester').equals(state.request.user.username);
            qfld['strRequester'] = state.request.user.username
            break;
    }
    if (query)
        query.where(qfld);
    else
        return qfld;
}
exports.addWhereCond = addWhereCond;




/*
 * Sort query.
 * @method sortQuery
 * @param query {object} Query object
 * @param view {object} View object
 * @param state {object} State object
 */
function sortQuery(query, view, state) {
    //var srt = [];
    if (view.grpflds) {
        view.grpflds.forEach(function (item) {
            //srt.push((item.asc?'':'-') + item.field);
            query.sort((item.asc?'':'-') + item.field);
            query.select(item.field);
            //state.orgfields.push({ org: item.field, sel: item.field.split("#")[0] });
        });
    }
    
    if (view.srtflds) {
        view.srtflds.forEach(function (item) {
            //srt.push((item.asc?'':'-')+item.field);
            query.sort((item.asc?'':'-') + item.field);
        });
    }
    
    //if (srt.length) query.sort(srt);
}
exports.sortQuery = sortQuery;



function objToString(obj, ndeep) {
    if (obj == null) { return String(obj); }
    switch (typeof obj) {
        case "string": return '"' + obj + '"';
        case "function": return obj.name || obj.toString();
        case "object":
            var indent = Array(ndeep || 1).join('\t'), isArray = Array.isArray(obj);
            return '{['[+isArray] + Object.keys(obj).map(function (key) {
                return '\n\t' + indent + key + ': ' + objToString(obj[key], (ndeep || 1) + 1);
            }).join(',') + '\n' + indent + '}]'[+isArray];
        default: return obj.toString();
    }
}
/*
 * Construct JavaScript query for select data.
 * @method constructQuery
 * @param data {object} View object
 * @param obstr {String} Object string
 */
exports.constructJsQuery = function (data, obstr) {
    var allof = []
      , anyof = []
      , qarray = []
      , ostring = (obstr?obstr + '.':'');
    
    data.allof.forEach(function (item) {
        allof.push(constructJsQueryValue(item, ostring));
    });
    if (allof.length) {
        qarray.push(allof.join(' && '));
    }
    
    data.anyof.forEach(function (item) {
        anyof.push(constructJsQueryValue(item, ostring));
    });
    if (anyof.length) {
        qarray.push(anyof.join(' || '));
    }
    
    return qarray.join(' ');
}

/*
 * Copy ticket data.
 * @method copyTicket
 * @param target {Object} target field values
 * @param source {Object} source field values
 * @param state {Object} ticket state
*/
exports.copyTicket = function (target, source, state) {
    copyTicketField('ticnum', target, source);
    copyTicketField('status', target, source);
    copyTicketField('assignee', target, source);
    copyTicketField('priority', target, source);
    copyTicketField('dueDate', target, source);
    copyTicketField('requester', target, source);
    copyTicketField('requestcc', target, source);
    copyTicketField('requestbc', target, source);
    copyTicketField('subject', target, source);
    copyTicketField('service', target, source);
    copyTicketField('transport', target, source);
    copyTicketField('purchase', target, source);
    copyTicketField('price', target, source);
    copyTicketField('reimburse', target, source);
    copyTicketField('requital', target, source);
    copyTicketField('tags', target, source);
    copyTicketField('channel', target, source);
    copyTicketField('privcomm', target, source);
    
    if (state.atid) {
        target.atid = state.atid;
    }
    if (state.request.body.rowdata && state.request.body.rowdata.comment) {
        target.event = "comment";
        //target.message = { title: state.request.body.rowdata.subject, body: state.request.body.rowdata.comment };
        target.comment = state.request.body.rowdata.comment;
    } else {
        target.event = "manual";
    }
    
    if (state.notifyAtDate) {
        target.notifyAtDate = state.notifyAtDate;
    }
    if (state.reopenAtDate) {
        target.reopenAtDate = state.reopenAtDate;
    }
    
    
    
    target.strOrgan = state.strOrgan;
    target.strRequester = state.strRequester;
    target.strRequestcc = state.strRequestcc;
    target.strRequestbc = state.strRequestbc;
    target.strGroup = state.strGroup;
    target.strAgent = state.strAgent;
    
    target.updaterType = state.updaterType;
    target.logDate = state.logDate;
    target.hidden = state.hidden;
    target.changes = state.changes;
}

/*
 * Copy ticket's field data.
 * @method copyTicketField
 * @param name {String} fields name
 * @param target {Object} target field values
 * @param source {Object} source field values
*/
function copyTicketField(name, target, source) {
    target[name] = source[name];
}

/*
 * Get type of user.
 * @method getUpdaterType
 * @param user {Object} target field values
*/
function getUpdaterType(user) {
    return (user.usertype === 'admins' || user.usertype === 'agents'?'Agent':'Client');
}
exports.getUpdaterType = getUpdaterType;

/*
 * Assign ticket's field data.
 * @method assignRefData
 * @param state {Object} State object
 * @param callback {Function} callback function
*/
exports.assignRefData = function (state, callback) {
    var groupstr = null;
    async.parallel([
        function (callback1) {
            if (state.isNew && !state.ticnum) {
                LastTicket(state.request.body.rowdata, callback1);
            } else {
                if (state.logUser) return callback1();
                User.find({ username: state.request.user.username }, function (err, result) {
                    if (err) return callback1();
                    if (result.length) {
                        state.logUser = result[0];
                        state.updaterType = getUpdaterType(result[0]);
                    };
                    callback1();
                });
            }
        },
        function (callback1) {
            async.series([
                function (callback3) {
                    if (state.strOrgan) return callback3();
                    if (!state.request.body.rowdata) return callback3();
                    if (!state.request.body.rowdata.requester) return callback3();
                    var email_string_array = state.request.body.rowdata.requester.split("@")
                      , domain = email_string_array[email_string_array.length - 1];
                    
                    Organ.find({ domains: domain }, function (err, result) {
                        if (err) return callback3(500, err);
                        if (result.length) {
                            //state.retval.items.refOrgan = result[0]._id;
                            state.strOrgan = result[0].name;
                            state.strGroup = result[0].defgroup;
                            if (state.retval.items) {
                                state.retval.items.strOrgan = state.strOrgan;
                                state.retval.items.strGroup = state.strGroup;
                            }
                            groupstr = result[0].defgroup;
                        }
                        callback3();
                    });
                },
                function (callback3) {
                    if (state.strOrgan) return callback3();
                    if (!state.request.body.rowdata) return callback3();
                    if (!state.request.body.rowdata.requestcc) return callback3();
                    var email_string_array = state.request.body.rowdata.requestcc.split("@")
                      , domain = email_string_array[email_string_array.length - 1];
                    
                    Organ.find({ domains: domain }, function (err, result) {
                        if (err) return callback3(500, err);
                        if (result.length) {
                            //state.retval.items.refOrgan = result[0]._id;
                            state.strOrgan = result[0].name;
                            state.strGroup = result[0].defgroup;
                            if (state.retval.items) {
                                state.retval.items.strOrgan = state.strOrgan;
                                state.retval.items.strGroup = state.strGroup;
                            }
                            groupstr = result[0].defgroup;
                        }
                        callback3();
                    });
                },
                function (callback3) {
                    if (state.strOrgan) return callback3();
                    if (!state.request.body.rowdata) return callback3();
                    if (!state.request.body.rowdata.requestbc) return callback3();
                    var email_string_array = state.request.body.rowdata.requestbc.split("@")
                      , domain = email_string_array[email_string_array.length - 1];
                    
                    Organ.find({ domains: domain }, function (err, result) {
                        if (err) return callback3(500, err);
                        if (result.length) {
                            //state.retval.items.refOrgan = result[0]._id;
                            state.strOrgan = result[0].name;
                            state.strGroup = result[0].defgroup;
                            if (state.retval.items) {
                                state.retval.items.strOrgan = state.strOrgan;
                                state.retval.items.strGroup = state.strGroup;
                            }
                            groupstr = result[0].defgroup;
                        }
                        callback3();
                    });
                },



                //function (callback3) {
                //    if (groupstr) return callback3();
                //    if (!state.request.body.rowdata.refOrgan) return callback3();
                //    Organ.findById(state.request.body.rowdata.refOrgan, function (err, result) {
                //        if (err) return callback3(500, err);
                //        state.strOrgan = result.name;
                //        state.strGroup = result.defgroup;
                //        groupstr = result.groupstr;
                //        callback3();
                //    });
                //},
                function (callback3) {
                    if (state.strGroup) return callback3();
                    if (!groupstr) return callback3();
                    Group.find({ name: groupstr }, function (err, result) {
                        if (err) return callback3(500, err);
                        if (result.length) {
                            state.strGroup = result[0].name;
                            if (state.retval.items)
                                state.retval.items.strGroup = state.strGroup;

                            //state.retval.items.refGroup = result[0]._id;
                        }
                        callback3();
                    });
                }
            ], function (err, msg) {
                if (err) return callback1(500, err);
                callback1();
            });
        },
        function (callback1) {
            if (!state.request.body.rowdata) return callback1();
            if (state.request.body.rowdata.requester && !state.strRequester) {
                User.find({ username: state.request.body.rowdata.requester }, function (err, result) {
                    if (err) return callback1(500, err);
                    if (result.length) {
                        state.strRequester = result[0].username;
                        if (state.retval.items)
                            state.retval.items.strRequester = state.strRequester
                        //state.retval.items.refRequester = result[0]._id;
                    };
                    callback1();
                });
            } else {
                callback1();
            }
        },
        function (callback1) {
            if (!state.request.body.rowdata) return callback1();
            if (state.request.body.rowdata.requestcc && !state.strRequestcc) {
                User.find({ username: state.request.body.rowdata.requestcc }, function (err, result) {
                    if (err) return callback1(500, err);
                    if (result.length) {
                        state.strRequestcc = result[0].username;
                        if (state.retval.items)
                            state.retval.items.strRequestcc = state.strRequestcc
                        //state.retval.items.refRequestcc = result[0]._id;
                    };
                    callback1();
                });
            } else {
                callback1();
            }
        },
        function (callback1) {
            if (!state.request.body.rowdata) return callback1();
            if (state.request.body.rowdata.requestbc && !state.strRequestbc) {
                User.find({ username: state.request.body.rowdata.requestbc }, function (err, result) {
                    if (err) return callback1(500, err);
                    if (result.length) {
                        state.strRequestbc = result[0].username;
                        if (state.retval.items)
                            state.retval.items.strRequestbc = state.strRequestbc
                        //state.retval.items.refRequestbc = result[0]._id;
                    };
                    callback1();
                });
            } else {
                callback1();
            }
        },
        function (callback1) {
            if (!state.request.body.rowdata) return callback1();
            if (state.request.body.rowdata.requestcc && !state.strRequestcc) {
                User.find({ username: state.request.body.rowdata.requestcc }, function (err, result) {
                    if (err) return callback1(500, err);
                    if (result.length) {
                        state.strRequestcc = result[0].username;
                        if (state.retval.items)
                            state.retval.items.strRequestcc = state.strRequestcc
                    };
                    callback1();
                });
            } else {
                callback1();
            }
        },
        function (callback1) {
            if (!state.request.body.rowdata) return callback1();
            if (state.request.body.rowdata.assignee) {
                User.find({ username: state.request.body.rowdata.assignee }, function (err, result) {
                    if (err) return callback1();
                    if (result.length) {
                        state.strAgent = result[0].username;
                        if (state.retval.items)
                            state.retval.items.strAgent = state.strAgent
                    };
                    callback1();
                });
            } else {
                callback1();
            }
        },
        function (callback1) {
            if (state.strOrgan) return callback1();
            var email_string_array = state.request.user.username.split("@")
                      , domain = email_string_array[email_string_array.length - 1];
            
            Organ.find({ domains: domain }, function (err, result) {
                if (err) return callback1(500, err);
                if (result.length) {
                    //state.retval.items.refOrgan = result[0]._id;
                    state.strOrgan = result[0].name;
                    state.strGroup = result[0].defgroup;
                    if (state.retval.items) {
                        state.retval.items.strOrgan = state.strOrgan;
                        state.retval.items.strGroup = state.strGroup;
                    }
                    groupstr = result[0].defgroup;
                }
                callback1();
            });
        },

        //function (callback1) {
        //    if (state.strAgent) return callback1();
        //    User.find({ username: state.request.user.username }, function (err, result) {
        //        if (err) return callback1(500, err);
        //        if (result.length) {
        //            state.strAgent = result[0].username;
        //            if (state.retval.items)
        //                state.retval.items.strAgent = state.strAgent;
        //            //state.retval.items.refAgent = result[0]._id;
        //        };
        //        callback1();
        //    });
        //}
    ], callback );
}

function hasAnyProps(obj){
    var hasAnyProps = false;
    for (var key in obj) {
        hasAnyProps = true;
        break;
    }
    return hasAnyProps;
}

function formatDateToString(input){
    var value;
    try {
        value = input.getDate();
        value += '.' + (input.getMonth() + 1);
        value += '.' + input.getFullYear();
        
        if (input.getHours() || input.getMinutes()) {
            if (input.getHours() > 0 && input.getMinutes() > 0) {
                value += ' ' + input.getHours();
                value += ':' + input.getMinutes();
            }
        }
    } catch (e) { value = ''; };
    return value;
}

function formatNumberToString(input) {
    var value = '' + input;
    value = value.replace(".", ",");
    return value;
}

function formatToString(input) {
    return (!input || input==undefined?'':input);
}

function replaceMessageText(msg, ticket, ticketLog) {
    var message = msg;
    message = message.replace("{{ticnum}}", formatToString(ticket.ticnum));
    message = message.replace("{{status}}", formatToString(ticket.status));
    message = message.replace("{{assignee}}", formatToString(ticket.assignee));
    message = message.replace("{{priority}}", formatToString(ticket.priority));
    message = message.replace("{{dueDate}}", formatDateToString(ticket.dueDate));
    message = message.replace("{{requester}}", formatToString(ticket.requester));
    message = message.replace("{{requestcc}}", formatToString(ticket.requestcc));
    message = message.replace("{{requestbc}}", formatToString(ticket.requestbc));
    message = message.replace("{{service}}", formatToString(ticket.service));
    message = message.replace("{{time}}", formatToString(ticket.time));
    message = message.replace("{{transport}}", formatNumberToString(ticket.transport));
    message = message.replace("{{purchase}}", formatNumberToString(ticket.purchase));
    message = message.replace("{{price}}", formatNumberToString(ticket.price));
    message = message.replace("{{reimburse}}", (ticket.Reimburse?'X':'-'));
    message = message.replace("{{requital}}", formatToString(ticket.requital));
    message = message.replace("{{subject}}", formatToString(ticket.subject));
    message = message.replace("{{tags}}", formatToString(ticket.tags));
    message = message.replace("{{updaterType}}", formatToString(ticket.updaterType));
    message = message.replace("{{updateDate}}", formatDateToString(ticket.updateDate));
    
    message = message.replace("{{}}", "");
    return message;
}

function replaceMessageObject(msg, ticket, ticketLog) {
    return {
        title: replaceMessageText(msg._doc.message.title, ticket, ticketLog),
        body: replaceMessageText(msg._doc.message.body, ticket, ticketLog)
    };
}

function getMessageObject(fld, ticket, ticketLog) {
    var msg = {
        'field': fld.field, 
        'value': fld.value, 
        'message': replaceMessageObject(fld.message, ticket, ticketLog)
    };
    
    switch (fld.value) {
        case 'group': msg.value = ''; break;
        case 'user': msg.value = ticket.strAgent; break;
        case 'requester': msg.value = ticket.strRequester; break;
        case 'requestcc': msg.value = ticket.strRequestcc || ''; break;
        case 'requestbc': msg.value = ticket.strRequestbc || ''; break;
        default:
    }

    return msg;
}

/*
 * Fire JavaScript trigger for ticket data.
 * @method constructQuery
 * @param aobj {object} Action object (trigger,Service)
 * @param ticket {object} Ticket object
 * @param ticketLog {object} Log Object
 * @param actionFn {Function} Action function
 * @param callback {Function} Callback function
 */
exports.fireTriggers = function (actobj, ticket, ticketLog, actionFn, callback) {
    actobj.find({ active: true }, function (err, docs) {
        if (err) return callback();
        var changedValues = [];
        async.map(docs, function (trigger, next) {
            var ok = true
              , expr = 'ok=(' + exports.constructJsQuery(trigger, 'ticket') + ')';
            try {
                eval(expr);
            } catch (e) {
                ok = false;
            }
            if (ok) {
                if (actobj.modelName === 'Autotrg') {
                    if (!ticketLog.autotrg)
                        ticketLog.autotrg = [];
                } else {
                    if (!ticketLog.autosvc)
                        ticketLog.autosvc = [];
                }

                
                var tobj = {}
                  , changes = {}
                  , messages = {}
                  ;

                trigger.fields.forEach(function (fld) {
                    if (exports.isVirtualField(fld.field)) {
                        var msg = getMessageObject(fld, ticket, ticketLog);
                        actionFn(msg);
                        //console.log(JSON.stringify({
                        //    from: config.automuser,
                        //    subject: state.request.body.rowdata.subject,
                        //    message: state.retval.items.lastComment
                        //}));

                        messages[fld.field] = msg;
                    } else {
                        var chobj = {};
                        if (fld.value && ticket[fld.field] !== fld.value) {
                            changes[fld.field] = { 'from': ticket[fld.field], 'to': fld.value };
                            //ticket[fld.field] = fld.value;
                            changedValues.push(fld);
                        }
                    }
                });
                if (hasAnyProps(changes) || hasAnyProps(messages)) {
                    tobj[trigger.name] = { 'changes': changes, 'messages': messages };
                    if (actobj.modelName === 'Autotrg') {
                        ticketLog.autotrg.push(tobj);
                    } else {
                        ticketLog.autosvc.push(tobj);
                    }
                }
            }
            next();
        }, function (err, result) {
            changedValues.forEach(function (fld) {
                ticket[fld.field] = fld.value;
            });
            
            ticket.save(function (err, result) {
                //if (err) return callback(400, err);
                return callback();
            });

        });
    });
  
}

/*
 * Send e-mail message.
 * @method sendInstantMessage
 * @param ticket {object} Ticket object
 * @param msg {Object} Message object
 * @param cb {Function} Callback function
 */
exports.sendInstantMessage = function (ticket, to, subject, message, cb) {
    var callback= function (code, msg) { };
    if (cb) callback = cb;
    if (to && subject && message) {
        Organ.findOne({ name: ticket.strOrgan }, function (err, organ) {
            var smtpConfig, username, data;
            if (err) return callback(500, err);
            if (!organ) return callback(500, 'Unknown Organization (strOrgan)');
            config.profiles.forEach(function (prof) {
                if (prof.name === organ.profile) {
                    smtpConfig = {
                        //pool: true,
                        host: prof.conn.sndhost,
                        port: prof.conn.sndport,
                        secure: prof.conn.secure,
                        auth: {
                            user: prof.conn.username,
                            pass: prof.conn.password
                        }
                    };
                    username = prof.conn.username;
                }
            });
            if (smtpConfig) {
                var transporter = Nodemailer.createTransport(smtpConfig);
                data = {
                    from: config.automuser,
                    to: to,
                    subject: subject,
                    html: message
                };
                transporter.use('compile', inlineBase64);
                transporter.sendMail(data, function (error, info) {
                    if (error) {
                        return callback(error);
                    }
                    return callback();
                });
            } else return callback(500, 'No smtp profile');
        });

    } else {
        return callback(500, 'Invalid message');
    }

};

function getAvatar(imgId, callback) {
    Image.findOne({ name: imgId }, function (err, result) {
        if (err || !result) {
            result = {
                type: 'image/png',
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AcVByc6FvG3zQAABrlJREFUWMO1mFtsXFcVhr+1z5mLPTc7noydxLEdO4mctiRuqlCCVBQESoVoBQJCVYQIUl8qUYF4gYc8gUBFeUFCqOItDxVQRWorhUugkKpqIdC0oqZOmpTUje04djO+xJ7xuHM7e/FwxsnMZMaXJF3SzGjmrNnrP//6115rH+EO7Up6QQAQQSq/qerN6ztSbXon68odADkIfA4YAgZEJAWEfDy6DEwB74vI28aYMz0dsQ/uOaCpTD5eLBS+o6qPAT1AOxAHWhqs4QE5EckozAucF5GXepPxF+8a0FxBQ9ls9jFUj6jqAaC/+roRcAxIZRWr4FnQmmSJJ8J5Vf2nMeaF3mT8jTsC9L9r6W2hUPiIqh5V1aFGQD4uwnwOlou+jlqDkIwpQdcHZutUJCJ/AU64rnuquz2SXzegsZnFrar6fRH5HhCtFusKkHRGGJuBsRnhxrIgApsi0J+y9HRAKqGEKsCqAKGqkyJyTFVf2pFqW1oT0LujE9F4PPELVX0acOqdrcLwhOH0sPDeNR+IMYCCAtbCUJ/y5SHL4FbFSH0KAciKyDOZzOLv9g70lKsvuPWesVj8p6r67Xow4Ac++77h1H+EazeEUKABvQ6MTAiZZYevPGT57G5LoXSbVwz4WSwWLwIv1MSoS9W3gMeBRKNUzmaFv40I0wuCa5oL0zEwNgvnRoWJWf97vanqdhE5OjG/dLAhoKnFjxPAM8DOZnk99yHMLgnKrcpqKMzKtdE0jFw1uE5T18PW855QVakBtOipKZZKT6rqA6vV4sVrQqEMzjp2L9fxGR2f9auyiRlVPTQ+m3m0BlBmMRdF9SmgdbUg8zmh7K1vOxWgUIJcQWoqrS5tAIOq+o1qhI7n2T3Ag42EXLv/bKzTiKFZlVVbSET2j80sbgMwcwWNgH4JUGkWsLJgKq4EnDUDVO4eQi5EwxBw13TfpKqHAcxyLhcGDqyWiJX493crLcH1AfIsdCWUgZTF89Z0T4jIgysaCgL3qarRNSId3GnpTCiydhooW9jVBQ/1Q8lbrSIFVaKqOliRhbiq2r0eqbYE4esHLDs7laIHZe8WeytMlj1YLsDDA8rn77PEwnpbT7td2OoCWwFca61ptGM3MmthV5fytQOWN0eFC5OGjxZ8BkTANdC9SXmgGw7usvQldV3prWi3BcA1xmCtXVfVrGyI+3qUZEzZsRmmbviMIBAJQneHsnc7tEd8MHb9c6OsALIbKWVVKJZhSwJ6Ovy/Fko+2NYAeOoz5tmNrKkABQC3XC57wDTQtZaOpGrX9iyUirXizhZ8Bo1UtRat1VkzTCJyHcAVMSURHVXVThGR1SpNK28iUChDNg/ZvJAvVkQfgmhIaWv1W4euM10ikgOuALgtrS353NLSW8Bn6ru/AI7jf15fFC5OCaPX4eq8sLAslMo+yJXAUmEm6Pga2t6h7O5SdnbBljal3DyVi6r6DoCbDJtcbolXgB9UewRdXxvnx4Vzo8LVeWEpLywXIV+Ekl1R+a08VzM4nxOmbggjExBrUXqSyqf7lU9t98VetjWjwYLrumduKmJ8NrNZVc+q6gCIBF1lfFY4e1l4b1KYvCHkCr42TL1GVhG/rbxUIRKC3qSyZ5tyaI+yKaqoBURUVV/ckWo7crPbd3TE5oCTQD7owpW08Nd3hVdGDJemhWLZ70sBp/aUsboufN+AU2G7DBeuCaeHDaf/a0gvij/6wofAn2rGj1IZFZETRuRKoaS8dlF4/ZIhX4JwYNV5Zt1mxL+pogenh4V3xoR8CRzRsyJyqgZQe0C0Nxn/IBSU316akvTEnM/KamPq3QBT4OKUcPkjM9wWkZf7NifmG87UnfHYs+mMvO3Zm3R+ImaMf8OXpjkZa0m83HTIFxHds935cb4k/wgHBFX0XoNR9Q+Uivx6X6/z/G1g6394uD9yvnez/GRzXP8dDiKevXdgrArRMGxrtye62uS5L94fmWxwirrdXj/5w4l/XQ5eVrQ94DKYy9eeJjbESIUVEehqg0iYXw5ukV8d+2r0UsPDQeOSTZaB1579Q3ZuLC2zKI8Uy+zOFW51b5HmjU+r+lfAgdYQGnJ5KxnnzONDpeOH97Yv3NXjmON/zDx1YVKemFsyvaDbrCVS8qp227oFXccHAswHHKZTCR3Z38fzT38h9ud7+sDqub9nH52ck6PXM7o/vSjxXEECjtHAyjoKVi3FtgilzgQzqbi+2peSE999JHr+E3uC9qPfL8nxJ6P6m1eXA/mS6c8XikOKiaFqHcNcKOi8eehwS3qfiB47meXn34xtqFL/D5av7scx5f7QAAAAAElFTkSuQmCC'
            };
        }
        callback(result);
    });

}
exports.getAvatar = getAvatar;

var messagehdr = "<!DOCTYPE html PUBLIC \"-\/\/W3C\/\/DTD XHTML 1.0 Transitional\/\/EN\" \"http:\/\/www.w3.org\/TR\/xhtml1\/DTD\/xhtml1-transitional.dtd\"><html><head><meta http-equiv=\"Content-Type\" content=\"text\/html; charset=utf-8\" \/><style type=\"text\/css\"> html, body {font-family: verdana,sans-serif,arial;font-size: 11pt;} table td {border-collapse: collapse;}  .delimiter {color: gainsboro;} .photo {width: 32px;display: inline-block;box-sizing: border-box;margin-right: 12px;border-radius: 50%;padding:4px;}  .fullname {color: dimgray;}  .username {color: silver;} .attachment {display:block;padding-right:4px;}  <\/style><\/head><body style=\"width: 100%!important; margin: 0; padding: 0;\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
var messagefdr = "</table></body></html>";

/*
 * Send e-mail to requester.
 * @method sendEmail
 * @param type {String} Type of mail
 * @param config {object} Configuration object
 * @param state {Object} State object
 * @param callback {Function} Callback function
 */
exports.sendEmail = function (type, config, state, callback) {
    //return callback(); //!!!!!
    var constructEmailMessage = function (callback) {
        var msgs = [];
        Ticket.findById(state.retval.items._id).populate('logs', '-__v', { event: { $ne: 'empty' } }).exec(function (err, ticket) {
            if (err) return callback();
            async.eachSeries(ticket.logs, function (objidlog, next) {
                TicketLog.findById(objidlog, function (err, log) {
                    if (log && !log.hidden) {
                        var mmessage = {};
                        msgs.push(mmessage);
                        
                        User.populate(log, { path: 'logUser' , select: '_id username fullname phone' }, function (err, log) {
                            getAvatar(log.logUser._id, function (avatar) {
                            var month = log.logDate.getMonth() + 1;
                            var day = log.logDate.getDate();
                            //var port = state.request.app.settings.port || config.serverPort;
                            //var urlpref = state.request.protocol + '://' + state.request.hostname + (port == 80 || port == 443 ? '' : ':' + port);
                            var port = config.serverFreePort;
                            var urlpref = 'http://' + state.request.hostname + (port == 80 || port == 443 ? '' : ':' + port);
                            var dattime = (day < 10 ? '0' : '') + day + "." 
                          + (month < 10 ? '0' : '') + month + '.' 
                          + log.logDate.getFullYear() 
                          + ' ' + ("00" + log.logDate.getMinutes()).slice(-2) 
                          + ':' + ("00" + log.logDate.getSeconds()).slice(-2);
                            
                            //var mmessage = {
                            //    urlpref: urlpref,
                            //    imageurl: urlpref + '/api/image/' + log.logUser._id,
                            //    fullname: log.logUser.fullname,
                            //    username: log.logUser.username + ' ' + dattime,
                            //    phone: log.logUser.phone,
                            //    comment: log.comment,
                            //    commenttxt: htmlToText.fromString(log.comment, { wordwrap: 80 }),
                            //    attachments: []
                            //};
                            //msgs.push(mmessage);
                            
                            mmessage.urlpref = urlpref;
                            //mmessage.imageurl = urlpref + '/api/image/' + log.logUser._id;
                            mmessage.imageurl = avatar.src;
                            mmessage.fullname = log.logUser.fullname;
                            mmessage.username = log.logUser.username + ' ' + dattime;
                            mmessage.phone = log.logUser.phone;
                            mmessage.comment = log.comment;
                            mmessage.commenttxt = htmlToText.fromString(log.comment, { wordwrap: 80 });                      ;
                            mmessage.attachments = [];
                            

                            if (log.atid) {
                                TicketAtt.findOne({ atid: log.atid }, function (err, attach) {
                                    var files = [];
                                    if (attach) {
                                        attach.attachment.map(function (att) {
                                            files.push({ uri: att.uri, filename: att.filename, type: att.type });
                                        });
                                        mmessage.attachments[log.atid] = files;
                                    };
                                    next();
                                });
                            } else {
                                next();
                            }

                            });

                        });
                    } else next();
                });
            }, function (err) {
                var retval = {
                    htm: messagehdr,
                    txt: ''
                };
                async.eachSeries(msgs, function (msg, nextmsg) {
                    retval.htm += '<tr><td colspan=\"10\" class=\"delimiter\">' + config.mesageDelimiter + '<\/td><\/tr>';
                    retval.htm += '<tr><td valign=\"top\"><img src=\"IMAGEURL\" class=\"photo\"><\/td><td><table widt=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td><small class=\"fullname\">FULLNAME<\/small><\/td><\/tr><tr><td><small class=\"username\">USERNAME<\/small><\/td><\/tr><tr><td>MESSAGE<\/td><\/tr><\/table><\/td><\/tr>'
                        .replace('IMAGEURL', msg.imageurl).replace('FULLNAME', msg.fullname).replace('USERNAME', msg.username).replace('MESSAGE', msg.comment);
                    for (var atid in msg.attachments) {
                        retval.htm += '<tr><td><\/td><td colspan=\"10\"><br \/>';
                        msg.attachments[atid].map(function (file) {
                            retval.htm += '<div class=\"attachment\"><a href="ATTACHID/ATTACHURL"><small>ATTACHFILENAME<\/small><\/a><\/div>'.replace('ATTACHID', msg.urlpref + '\/attachment\/' + atid).replace('ATTACHURL', file.uri).replace('ATTACHFILENAME', file.filename);
                        });
                        retval.htm += '<\/td><\/tr>';
                    };
                    retval.htm += '<tr><td colspan=\"10\"><br \/><\/td><\/tr>';
                    nextmsg();
                }, function (err) {
                    retval.htm += messagefdr;
                    callback(retval);
                });
            });
        });
    };
    

    Organ.findOne({ name: state.strOrgan }, function (err, organ) {
        var smtpConfig, username, data;
        if (err) return callback(500, err);
        if (!organ) return callback(500, 'Unknown Organization (strOrgan)');
        config.profiles.forEach(function (prof) {
            if (prof.name === organ.profile) {
                smtpConfig = {
                    //pool: true,
                    host: prof.conn.sndhost,
                    port: prof.conn.sndport,
                    secure: prof.conn.secure,
                    auth: {
                        user: prof.conn.username,
                        pass: prof.conn.password
                    }
                };
                username = prof.conn.username;
            }
        });
        if (smtpConfig) {
            var transporter = Nodemailer.createTransport(smtpConfig);
            transporter.use('compile', inlineBase64);
            if (type === 'normal') {
                //state.request.body.rowdata.comment
                constructEmailMessage(function (retval) {
                    if(!retval) return callback();          
                    data = {
                        from: username,
                        to: state.strRequester,
                        subject: exports.formatrSubject(state.request.body.rowdata.subject, state.retval.items.ticnum),
                        text: state.request.body.rowdata.lastComment,
                        html: retval.htm
                    };
                    if (state.strRequestcc) {
                        data.cc = state.strRequestcc;
                    }
                    if (state.strRequestbc) {
                        data.cc = state.strRequestbc;
                    }
                    transporter.sendMail(data, function (error, info) {
                        if (error) {
                            return callback(error);
                        }
                        //console.log('Message sent: ' + info.response);
                        return callback();
                    });
                });
            } else return callback(500, 'Bad message type');
            

        } else return callback(500, 'No smtp profile');
    });
}





/*
 * Check / create new user.
 * @method sendEmail
 * @param state {object} Type of mail
 * @param ticket {object} Ticket object
 * @param userObj {Object} User object
 * @param callback {Function} callback function
 */
exports.checkUserExist = function (state, ticket, userObj, callback) {
var useremail = userObj.emailaddress
    , username = userObj.name;
    
    User.findOne({ username : useremail }, function (err, result) {
        if (!result) {
            User.register(new User(
                {
                    username: useremail, 
                    email: useremail,
                    fullname: username,
                    created: new Date(),
                    role: 'guest',
                    usertype: 'suppliers'
                }),
                    useremail.split('@')[0], 
                function (err, account) {
                callback(err);
            });
        } else {
            callback();
        }
    });
}

/*
 * Convert native data to string.
 * @method toTicketString
 * @param result {object} Ticket result object
 */
exports.toTicketString = function (result) {
    var obj = result.toObject();
    obj.time = obj.time.toLocaleString().replace('.', ',');
    obj.transport = obj.transport.toLocaleString().replace('.', ',');
    obj.purchase = obj.purchase.toLocaleString().replace('.', ',');
    obj.price = obj.price.toLocaleString().replace('.', ',');
    
    if (obj.dueDate && obj.dueDate.getTime()) {
        var month = obj.dueDate.getMonth() + 1;
        var day = obj.dueDate.getDate();
        
        obj.dueDate = (day < 10 ? '0' : '') + day + "." 
                          + (month < 10 ? '0' : '') + month + '.' 
                          + obj.dueDate.getFullYear();
                          //+ ' ' + ("00" + obj.dueDate.getMinutes()).slice(-2) 
                          //+ ':' + ("00" + obj.dueDate.getSeconds()).slice(-2);
    } else {
        obj.dueDate = "";
    }
    return obj;
}
/*
 * Convert ticket strings to native data.
 * @method fromTicketString
 * @param jobj {object}  json object
 */
exports.fromTicketString = function (jobj) {
    //var tobj= {
    //    assignee: jobj.assignee,
    //    comment: jobj.comment,
    //    dueDate: dateStringParse(jobj.dueDate),        
    //    priority: jobj.priority,
    //    reimburse: jobj.reimburse,
    //    requestbc: jobj.requestbc,
    //    requestcc: jobj.requestcc,
    //    requester: jobj.requester,
    //    requital: jobj.requital,
    //    status: jobj.status,
    //    subject: jobj.subject,
    //    ticnum: jobj.ticnum,

    //    time: ticStrToNum(jobj.time),
    //    transport: ticStrToNum(jobj.transport),
    //    purchase: ticStrToNum(jobj.purchase),
    //    price: ticStrToNum(jobj.price)
    //}
    //return tobj;

    jobj.dueDate = dateStringParse(jobj.dueDate);       
    jobj.time = ticStrToNum(jobj.time);
    jobj.transport = ticStrToNum(jobj.transport);
    jobj.purchase = ticStrToNum(jobj.purchase);
    jobj.price = ticStrToNum(jobj.price);
    return jobj;
}
function ticStrToNum(numstr){
    if (typeof numstr === 'string') {
        return parseFloat(numstr.replace(',', '.'));
    } else {
        return numstr;
    }
}