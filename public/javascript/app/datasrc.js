

app.factory('dataRes', function ($resource, dataUri) {
    return $resource(dataUri + '/:oid/:cmd', { oid: '@oid', cmd: '@cmd' }, {
        'get': { method: 'GET', isArray: true },
        'post': { method: 'POST', isArray: true },
        'set': { method: 'POST' },
        'update': { method: 'PUT', isArray: true },
        'delete': { method: 'DELETE' }
    });
})

app.factory('dataRes2', function ($resource, dataUri) {
    return $resource(dataUri + '/:oid/:p1/:p2', { oid: '@oid', p1: '@p1', p2: '@p2' }, {
        'get': { method: 'GET', isArray: true },
        'post': { method: 'POST', isArray: true },
        'set': { method: 'POST' },
        'update': { method: 'PUT', isArray: true },
        'delete': { method: 'DELETE' }
    });
})

.factory('dataSrc', function ($resource, dataUri) {
    return $resource(dataUri + '/:oid/:id:pageNumber:cmd/:pageLimit', {
        oid: '@oid',
        id: '@id',
        cmd: '@cmd',
        pageNumber: '@pageNumber',
        pageLimit: '@pageLimit',
    }, {
        'query': { method: 'GET', isArray: true },
        'get': { method: 'GET' },
        'post': { method: 'POST' },
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }, 
        'postquery': { method: 'POST', isArray: true  }
    });
})

.factory('dataPanel', function ($rootScope, dataSrc, md5) {
    return {
        add: function (scope, dataname, oid, acid, limit) {
            if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
            
            scope.panels = scope.panels || [];
            scope.panels[dataname] = scope.panels[dataname] || {};
            scope.panels[dataname].oid = oid;
            scope.panels[dataname].accid = acid || oid;
            scope.panels[dataname].pageNumber = scope.panels[dataname].pageNumber || 1;
            scope.panels[dataname].pageLimit = scope.panels[dataname].pageLimit || limit || 10;
            scope.panels[dataname].search = scope.panels[dataname].search || '';
            scope.panels[dataname].pageCount = 0;
            scope.panels[dataname].pageNumbers = [1];
            scope.panels[dataname].pageLimits = [5, 10, 20, 50, 100, 500];
            scope.panels[dataname].pgId = md5.createHash(dataname);
            scope.panels[dataname].err = '';
            
            scope.panels[dataname].load = function () {
                dataSrc.post({
                    oid : scope.panels[dataname].oid,
                    pageNumber : scope.panels[dataname].pageNumber,
                    pageLimit : scope.panels[dataname].pageLimit
                }, {
                    acid : scope.panels[dataname].accid,
                    search : scope.panels[dataname].search,
                }, function (data) {
                    if (data.acc)
                        scope.panels[dataname].acc = data.acc;
                    else
                        scope.panels[dataname].acc = { 'oid': scope.panels[dataname].oid, 'read': true, 'create': true, 'update': true, 'delete': true };
                    
                    if (data.items) {
                        scope.panels[dataname].pageNumber = data.pageNumber || 1;
                        scope.panels[dataname].pageLimit = data.pageLimit || 0;
                        scope.panels[dataname].pageCount = data.pageCount || 0;
                        scope.panels[dataname].pageNumber = Math.max(1, Math.min(scope.panels[dataname].pageNumber, scope.panels[dataname].pageCount));
                        scope.panels[dataname].pageNumbers = [];
                        var first = Math.max(1, scope.panels[dataname].pageNumber - 2);
                        for (var pg = 0; pg < 5; pg++) {
                            if (first + pg <= scope.panels[dataname].pageCount)
                                scope.panels[dataname].pageNumbers.push(first + pg);
                        }
                        
                        for (var i = 0; i < data.items.length; i++) {
                            var newField = '_expanded';
                            data.items[i][newField] = false;
                        }
                    }
                    scope.panels[dataname].items = data.items;
                    scope.panels[dataname].processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                }, function (httpResponse) {
                    scope.panels[dataname].err = httpResponse.data.err;
                    inparams.scope.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                });
            };
            
            scope.panels[dataname].doCmd = function (cmd, cmdval) {
                switch (cmd) {
                    case 'pageLimit':
                        scope.panels[dataname].pageLimit = cmdval;
                        break;
                    case 'pageNumber':
                        scope.panels[dataname].pageNumber = cmdval;
                        break;
                    case 'pgUp':
                        scope.panels[dataname].pageNumber = Math.max(1, scope.panels[dataname].pageNumber - 1);
                        break;
                    case 'pgDn':
                        scope.panels[dataname].pageNumber = Math.min(scope.panels[dataname].pageNumber + 1, scope.panels[dataname].pageCount);
                        break;
                    case 'pgFirst':
                        scope.panels[dataname].pageNumber = 1;
                        break;
                    case 'pgLast':
                        scope.panels[dataname].pageNumber = scope.panels[dataname].pageCount;
                        break;

                }
                scope.panels[dataname].load();
            };
            
            scope.panels[dataname].pressSearch = function (keyEvent) {
                switch (keyEvent.which) {
                    case 27:
                        scope.panels[dataname].search = '';
                        scope.panels[dataname].load();
                        break;
                    case 13:
                    case 8:
                        scope.panels[dataname].load();
                        break;
                }
            };
            
            scope.panels[dataname].processdata = true;
            scope.panels[dataname].load();
        }
    };
})
;