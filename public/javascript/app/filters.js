
app.filter('', function ($filter) {
    return function (dateString) {
        var timebits = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]*)(\.[0-9]*)?)?(?:([+-])([0-9]{2})([0-9]{2}))?/;
        var m = timebits.exec(dateString);
        var resultDate;
        if (m) {
            resultDate = m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6];
        } else {
            resultDate = null;
        }
        return resultDate;
    };
})

.filter("mena", function (numberFilter) {
    function isNumeric(value) {
        return (!isNaN(parseFloat(value)) && isFinite(value));
    }
    
    return function (inputNumber, currencySymbol, decimalSeparator, thousandsSeparator, decimalDigits) {
        if (isNumeric(inputNumber)) {
            currencySymbol = (typeof currencySymbol === "undefined") ? "€" : currencySymbol;
            decimalSeparator = (typeof decimalSeparator === "undefined") ? "," : decimalSeparator;
            thousandsSeparator = (typeof thousandsSeparator === "undefined") ? " " : thousandsSeparator;
            decimalDigits = (typeof decimalDigits === "undefined" || !isNumeric(decimalDigits)) ? 2 : decimalDigits;
            
            if (decimalDigits < 0)
                decimalDigits = 0;
            
            var formattedNumber = numberFilter(inputNumber,
                    decimalDigits);
            
            var numberParts = formattedNumber.split(".");
            
            numberParts[0] = numberParts[0].split(",").join(
                thousandsSeparator);
            
            var result = numberParts[0];
            
            if (numberParts.length == 2) {
                result += decimalSeparator + numberParts[1];
            }
            
            return result + currencySymbol;
        } else {
            return inputNumber;
        }
    };
})


.filter("tonum", function (numberFilter) {
    function isNumeric(value) {
        return (!isNaN(parseFloat(value)) && isFinite(value));
    }
    
    return function (inputNumber, decimalDigits, decimalSeparator, thousandsSeparator) {
        if (isNumeric(inputNumber)) {
            decimalSeparator = (typeof decimalSeparator === "undefined") ? "," : decimalSeparator;
            thousandsSeparator = (typeof thousandsSeparator === "undefined") ? " " : thousandsSeparator;
            decimalDigits = (typeof decimalDigits === "undefined" || !isNumeric(decimalDigits)) ? 2 : decimalDigits;
            
            if (decimalDigits < 0)
                decimalDigits = 0;
            
            var formattedNumber = numberFilter(inputNumber,
                    decimalDigits);
            
            var numberParts = formattedNumber.split(".");
            
            numberParts[0] = numberParts[0].split(",").join(
                thousandsSeparator);
            
            var result = numberParts[0];
            
            if (numberParts.length == 2) {
                result += decimalSeparator + numberParts[1];
            }
            
            return result;
        } else {
            return inputNumber;
        }
    };
})



;