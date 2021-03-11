'use strict';

var app = angular.module('app', ['ngRoute', 'ngResource', 'ngAnimate', 'ngWig', 'pikaday', 'ngMd5', 'btford.socket-io', 'ngFileUpload', 'cfp.hotkeys'])
.value('dataUri', 'api')
.value('ioAddr', 'IOSERVERADDR')

.config(['pikadayConfigProvider', '$sceProvider', function (pikaday, $sceProvider) {
        
        var locales = {
            sk: {
                previousMonth : 'Predch.mesiac',
                nextMonth     : 'Nasl.mesiac',
                months: ["január", "február", "Marec", "apríl", "máj", "jún", "júl", "August", "septembra", "október", "novembr", "december"],
                weekdays: ["nedeľa", "pondelok", "utorok", "streda", "štvrtok", "piatok", "sobota"],
                weekdaysShort: ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"]
            }
        };
        
        pikaday.setConfig({
            format: "DD.MM.YYYY",
            i18n: locales.sk,
            locales: locales

        });
        $sceProvider.enabled(false);
    }])

.config(["$httpProvider", function ($httpProvider) {
        $httpProvider.defaults.transformResponse.push(function (responseData) {
            //convertDateStringsToDates(responseData);
            return responseData;
        });
    }])

.factory('socket', function (socketFactory, ioAddr) {
    return socketFactory({ prefix: '', ioSocket: io.connect(ioAddr)});
})

.factory('dataCache', function ($cacheFactory) {
    return $cacheFactory('dataCache');
})


.factory('Ticket', function ($resource, dataUri) {
    return $resource(dataUri + '/ticket/:ticket_id', { ticket_id: '@id' }); 
})

.factory('$debounce', ['$rootScope', '$browser', '$q', '$exceptionHandler',
    function ($rootScope, $browser, $q, $exceptionHandler) {
        var deferreds = {},
            methods = {},
            uuid = 0;
        
        function debounce(fn, delay, invokeApply) {
            var deferred = $q.defer(),
                promise = deferred.promise,
                skipApply = (angular.isDefined(invokeApply) && !invokeApply),
                timeoutId, cleanup,
                methodId, bouncing = false;
            
            // check we dont have this method already registered
            angular.forEach(methods, function (value, key) {
                if (angular.equals(methods[key].fn, fn)) {
                    bouncing = true;
                    methodId = key;
                }
            });
            
            // not bouncing, then register new instance
            if (!bouncing) {
                methodId = uuid++;
                methods[methodId] = { fn: fn };
            } else {
                // clear the old timeout
                deferreds[methods[methodId].timeoutId].reject('bounced');
                $browser.defer.cancel(methods[methodId].timeoutId);
            }
            
            var debounced = function () {
                // actually executing? clean method bank
                delete methods[methodId];
                
                try {
                    deferred.resolve(fn());
                } catch (e) {
                    deferred.reject(e);
                    $exceptionHandler(e);
                }
                
                if (!skipApply) $rootScope.$apply();
            };
            
            timeoutId = $browser.defer(debounced, delay);
            
            // track id with method
            methods[methodId].timeoutId = timeoutId;
            
            cleanup = function (reason) {
                delete deferreds[promise.$$timeoutId];
            };
            
            promise.$$timeoutId = timeoutId;
            deferreds[timeoutId] = deferred;
            promise.then(cleanup, cleanup);
            
            return promise;
        }
        
        
        // similar to angular's $timeout cancel
        debounce.cancel = function (promise) {
            if (promise && promise.$$timeoutId in deferreds) {
                deferreds[promise.$$timeoutId].reject('canceled');
                return $browser.defer.cancel(promise.$$timeoutId);
            }
            return false;
        };
        
        return debounce;
    }])


;


