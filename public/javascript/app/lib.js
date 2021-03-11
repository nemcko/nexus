function findByKeyValue(arraytosearch, key, valuetosearch, retkey) {
    for (var i = 0; i < arraytosearch.length; i++) {
        if (arraytosearch[i][key] == valuetosearch) {
            return arraytosearch[i][retkey];
        }
    }
    return '';
}

function assignPropertyValue(obj, prop, value) {
    if (typeof prop === "string")
        prop = prop.split(".");
    
    if (prop.length > 1) {
        var e = prop.shift();
        assignPropertyValue(obj[e] = (Object.prototype.toString.call(obj[e]) === "[object Object]" ? obj[e]: {}), prop, value);
    } else {
        obj[prop[0]] = value;
    };
}


function dateStringParse(value, output) {
    var retval = undefined
      , format = function (input) {
            var matches = input.match(/(\d+)\.(\d+)\.(\d+)\s+(\d+):(\d+)/); //input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4}) (\d{2}):(\d{2})$/);
            if (matches === null) {
                matches = input.match(/(\d+)\.(\d+)\.(\d+)/); //input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
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
                var date = new Date(year, month, day, hour, minute, 0);
                if (date.getFullYear() !== year 
          || date.getMonth() != month 
          || date.getDate() !== day 
          || date.getHours() !== hour 
          || date.getMinutes() !== minute
        ) {
                    return null;
                } else {
                    return date;
                }
            }

        }
    , regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/
    , convertDateStringsToDates = function (input) {
            var value = undefined
              , match;
            if (typeof input === "string" && (match = input.match(regexIso8601))) {
                var milliseconds = Date.parse(match[0])
                if (!isNaN(milliseconds)) {
                    var dtm = new Date(milliseconds);
                    value = dtm.getDate();
                    value += '.' + (dtm.getMonth() + 1);
                    value += '.' + dtm.getFullYear();

                    if (dtm.getHours() || dtm.getMinutes()) {
                        if (dtm.getHours() > 0 && dtm.getMinutes() > 0) {
                            value += ' ' + dtm.getHours();
                            value += ':' + dtm.getMinutes();
                        }
                    }
                }
            } else if (typeof input === "object") {
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
                } catch (e) { value = undefined; };
            }
            return value;
        }
    
    
    if (output) {
        retval = convertDateStringsToDates(value);
    } else {
        if (typeof value === "string") {
            retval = format(value);
        } else {
            retval = value;
        }
    }
    return retval;
};


var Base64 = {
    
    
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    
    
    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        
        input = Base64._utf8_encode(input);
        
        while (i < input.length) {
            
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            
            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }
        
        return output;
    },
    
    
    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        
        while (i < input.length) {
            
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
            
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            
            output = output + String.fromCharCode(chr1);
            
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }
        
        output = Base64._utf8_decode(output);
        
        return output;

    },
    
    _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        
        for (var n = 0; n < string.length; n++) {
            
            var c = string.charCodeAt(n);
            
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }
        
        return utftext;
    },
    
    _utf8_decode: function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        
        while (i < utftext.length) {
            
            c = utftext.charCodeAt(i);
            
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }
        
        return string;
    }

};

function removeDiacritic(phrase, bOnlyAscii) {
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

