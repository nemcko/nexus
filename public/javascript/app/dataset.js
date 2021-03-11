
app.factory('dataSet', function ($rootScope, $http, $q, md5, $timeout, dataUri) {
    function req(m, p, d) {
        var deferred = $q.defer();
        var par = { responseType: 'json', method: m, url: dataUri + '/' + p };
        if (d) par.data = d;
        $http(par).success(function (result) {
            deferred.resolve(result);
        }).error(function (result) {
            deferred.reject(result);
        });
        return deferred.promise;
    };
    return {
        getItems: function (uri) {
            return req('GET', uri);
        },
        newItem: function (uri, data) {
            return req('POST', uri, data);
        },
        delItem: function (uri, data) {
            return req('DELETE', uri, data);
        },
        updItem: function (uri, data) {
            return req('PUT', uri, data);
        },
        setValues: function (uri, data) {
            return req('PUT', uri, data);
        },
        dict: function (inparams) {
            this.getDataItems(inparams.uri, inparams.field).then(function (data) {
                inparams.scope[inparams.dict] = data;
            });
        },
        clearInputData: function (data) {
            if (data) {
                if (typeof data.isArray !== "undefined") {
                    for (var i = 0; i < data.length; i++) {
                        if ("_expanded" in data[i]) {
                            delete data[i]["_expanded"];
                        }
                    }
                }
            }
            return data;
        },
        clearOutputData: function (data) {
            if (data && angular.isArray(data) && data[0] === false) {
                data.splice(0, 1);
            }
            return data;
        },
        paramData: function (uri, dat) {
            var formatted = uri;
            if (angular.isArray(dat) || ((!!dat) && (dat.constructor === Object))) {
                for (var itm in dat) {
                    formatted = formatted.replace(":" + itm, dat[itm]);
                }
            } else {
                formatted = formatted.replace(":" + uri, dat);
            }
            return formatted;
        },
        iniPanel: function (inparams) {
            inparams.scope.$parent.refresh();
            inparams.scope.panel = inparams.scope.panel || {};
            inparams.scope.panel.pageNumber = inparams.scope.panel.pageNumber || 1;
            inparams.scope.panel.pageLimit = inparams.scope.panel.pageLimit || 10;
            inparams.scope.panel.search = inparams.scope.panel.search || '';
            inparams.scope.panel.pageCount = 0;
            inparams.scope.panel.pageNumbers = [1];
            inparams.scope.panel.pageLimits = [5, 10, 20, 50, 100, 500];
            inparams.scope.panel.pgId = md5.createHash(inparams.uri);
        },
        preList: function (inparams) {
            inparams.scope.processData = true;
            inparams.scope.expandedNew = false;
            inparams.scope.rowdata = {};
            inparams.scope.rowid = null;
            inparams.scope.openDetail = function (item) {
                var target, content;
                if (!target) target = document.querySelector('updateForm');
                
                if (item) {
                    if (inparams.scope.expandedNew)
                        inparams.scope.expandedNew = false;
                    inparams.scope.rowdata = {};
                    inparams.scope.rowid = null;
                    if (inparams.scope.items) {
                        for (var i = 0; i < inparams.scope.items.length; i++) {
                            if (item !== inparams.scope.items[i]) {
                                inparams.scope.items[i]._expanded = false;
                            } else {
                                inparams.scope.rowdata = inparams.scope.items[i];
                                inparams.scope.rowid = inparams.scope.items[i]._id;
                                if (!item._expanded)
                                    item._expanded = true;
                            }
                        }
                    }
                } else {
                    if (inparams.scope.rowdataEmpty) {
                        inparams.scope.rowdata = angular.copy(inparams.scope.rowdataEmpty);
                    } else {
                        inparams.scope.rowdata = {};
                    }
                    inparams.scope.rowid = null;
                    if (inparams.scope.items) {
                        for (var i = 0; i < inparams.scope.items.length; i++) {
                            if (inparams.scope.items[i]._expanded)
                                inparams.scope.items[i]._expanded = false;
                        }
                    }
                    if (!inparams.scope.expandedNew)
                        inparams.scope.expandedNew = true;
                }
                inparams.scope.$parent.refresh();

            };
            inparams.scope.closeDetail = function (item) {
                if (item) {
                    if (inparams.scope.items) {
                        for (var i = 0; i < inparams.scope.items.length; i++) {
                            inparams.scope.items[i]._expanded = false;
                        }
                    }
                } else {
                    inparams.scope.expandedNew = false;
                }
                inparams.scope.$parent.refresh();
            };
            inparams.scope.checkData = function (item) {
                var rowdata = angular.copy(inparams.scope.rowdata);
                inparams.scope.processData = true;
                var vref = inparams.uri.split('/')[0];
                vref = vref.charAt(0).toUpperCase() + vref.slice(1);
                rowdata['vref'] = vref;
                inparams.dset.updItem(inparams.dset.paramData('test'+inparams.uri, inparams.scope.panel), rowdata).then(function (data) {
                    inparams.scope.processData = false;
                    document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: data.msg });
                }, function (data) {
                    inparams.scope.processData = false;
                    document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: data.msg });
                });
                inparams.scope.$parent.refresh();
            };

        },
        setAcc: function (inparams, data) {
            if (data.acc)
                inparams.scope.panel.acc = data.acc;
            else
                inparams.scope.panel.acc = { 'oid': inparams.scope.panel.oid, 'read': true, 'create': true, 'update': true, 'delete': true };
        },
        posList: function (inparams, data) {
            data.items = this.clearOutputData(data.items);
            inparams.dset.setAcc(inparams, data);
            if (data.items) {
                inparams.scope.panel.pageNumber = data.pageNumber || 1;
                inparams.scope.panel.pageLimit = data.pageLimit || 0;
                inparams.scope.panel.pageCount = data.pageCount || 0;
                
                inparams.scope.panel.pageNumber = Math.max(1, Math.min(inparams.scope.panel.pageNumber, inparams.scope.panel.pageCount));
                inparams.scope.panel.pageNumbers = [];
                var first = Math.max(1, inparams.scope.panel.pageNumber - 2);
                for (var pg = 0; pg < 5; pg++) {
                    if (first + pg <= inparams.scope.panel.pageCount)
                        inparams.scope.panel.pageNumbers.push(first + pg);
                }
                
                for (var i = 0; i < data.items.length; i++) {
                    var newField = '_expanded';
                    data.items[i][newField] = false;
                }
            }
            inparams.scope.items = data.items;
            inparams.scope.processData = false;
            inparams.scope.$parent.refresh();
        },
        load: function (inparams) {
            var me = this;
            this.preList(inparams);
            inparams.scope.panel.uri = this.paramData(inparams.uri, inparams.scope.panel);
            this.newItem(inparams.scope.panel.uri, { 'acid': inparams.oid, 'search': inparams.scope.panel.search, 'qparam': inparams.scope.qparam }).then(function (data) {
                me.posList(inparams, data);
            }, function (data) {
                inparams.scope.processData = false;
                document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: data.err });
            });
        },
        dataList: function (inparams) {
            inparams.scope.panelCmd = function (cmd, cmdval) {
                switch (cmd) {
                    case 'pageLimit':
                        inparams.scope.panel.pageLimit = cmdval;
                        break;
                    case 'pageNumber':
                        inparams.scope.panel.pageNumber = cmdval;
                        break;
                    case 'pgUp':
                        inparams.scope.panel.pageNumber = Math.max(1, inparams.scope.panel.pageNumber - 1);
                        break;
                    case 'pgDn':
                        inparams.scope.panel.pageNumber = Math.min(inparams.scope.panel.pageNumber + 1, inparams.scope.panel.pageCount);
                        break;
                    case 'pgFirst':
                    case 'refresh':
                        inparams.scope.panel.pageNumber = 1;
                        break;
                    case 'pgLast':
                        inparams.scope.panel.pageNumber = inparams.scope.panel.pageCount;
                        break;
                    default:
                        inparams.scope.panel.pageNumber = 1;
                }
                inparams.dset.load(inparams);
            }
            inparams.scope.pressSearch = function (keyEvent) {
                switch (keyEvent.which) {
                    case 27:
                        inparams.scope.panel.search = '';
                        inparams.dset.load(inparams);
                        break;
                    case 13:
                    case 8:
                        inparams.dset.load(inparams);
                        break;
                }
            }
            this.iniPanel(inparams);
            this.load(inparams);
        },
        dataUpdate: function (inparams) {
            inparams.scope.save = function () {
                var rowdata = angular.copy(inparams.scope.rowdata);
                delete rowdata['_expanded'];
                rowdata['acid'] = inparams.oid;
                inparams.scope.processData = true;
                
                if (inparams.scope.rowid == undefined) {
                    inparams.dset.newItem(inparams.dset.paramData(inparams.uri, inparams.scope.panel), rowdata).then(function (data) {
                        data.items = inparams.dset.clearOutputData(data.items);
                        inparams.dset.setAcc(inparams, data);
                        if (data.items) {
                            inparams.scope.items = [];
                            inparams.scope.panel.pageNumber = data.pageNumber || 1;
                            inparams.scope.panel.pageLimit = data.pageLimit || 0;
                            inparams.scope.panel.pageCount = data.pageCount || 0;
                            
                            inparams.scope.panel.pageNumber = Math.max(1, Math.min(inparams.scope.panel.pageNumber, inparams.scope.panel.pageCount));
                            inparams.scope.panel.pageNumbers = [];
                            var first = Math.max(1, inparams.scope.panel.pageNumber - 2);

                            for (var pg = 0; pg < 5; pg++) {
                                if (first + pg <= inparams.scope.panel.pageCount)
                                    inparams.scope.panel.pageNumbers.push(first + pg);
                            }

                            for (var i = 0; i < data.items.length; i++) {
                                inparams.scope.items[i] = data.items[i];
                                inparams.scope.items[i]._expanded = false;
                            }
                        }

                        inparams.scope.expandedNew = false;
                        inparams.scope.processData = false;
                    }, function (data) {
                        inparams.scope.processData = false;
                        document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: data.err });
                    });
                } else {
                    inparams.dset.updItem(inparams.dset.paramData(inparams.uri, inparams.scope.panel), rowdata).then(function (data) {
                        data.items = inparams.dset.clearOutputData(data.items);
                        inparams.dset.setAcc(inparams, data);
                        if (data.items) {
                            for (var i = 0; i < inparams.scope.items.length; i++) {
                                if (inparams.scope.items[i]._id === data.items._id) {
                                    inparams.scope.items[i]._expanded = false;
                                    for (var prop in data.items) {
                                        inparams.scope.items[prop] = data.items[prop];
                                    }
                                }
                            }
                        }
                        inparams.scope.expandedNew = false;
                        inparams.scope.processData = false;

                    }, function (data) {
                        inparams.scope.processData = false;
                        document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: data.err });
                    });
                }
            }
            
            inparams.scope.destroy = function (ev, id) {
                var dialog = document.querySelector('dialog');
                var div = document.getElementById('div');
                var closeListener = function (event) {
                    dialog.close();
                    deleteListeners();
                };
                var deleteListener = function (event) {
                    inparams.scope.processData = true;
                    dialog.close();
                    inparams.dset.delItem(inparams.uri + '/' + inparams.oid + '/' + id).then(function (data) {
                        inparams.dset.preList(inparams);
                        inparams.dset.newItem(inparams.scope.panel.uri, { 'acid': inparams.oid, 'search': inparams.scope.panel.search }).then(function (data) {
                            inparams.dset.posList(inparams, data);
                        }, function (data) {
                            inparams.scope.processData = false;
                            document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: data.err });
                        });
                    }, function (data) {
                        inparams.scope.processData = false;
                        document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: data.err });
                    });
                    deleteListeners();
                };
                var deleteListeners = function () {
                    dialog.querySelector('.pgDelButtonClose').removeEventListener('click', closeListener);
                    dialog.querySelector('.pgDelButton').removeEventListener('click', deleteListener);
                }
                
                inparams.scope.expandedNew = false;
                for (var i = 0; i < inparams.scope.items.length; i++) {
                    inparams.scope.items[i]._expanded = false;
                }
                
                if (!dialog.showModal) {
                    dialogPolyfill.registerDialog(dialog);
                }
                dialog.showModal();
                dialog.querySelector('.pgDelButtonClose').addEventListener('click', closeListener);
                dialog.querySelector('.pgDelButton').addEventListener('click', deleteListener);
                
                ev.preventDefault();
                ev.stopPropagation();
            };
        },            
        values: function (inparams) {
            this.getItems(inparams.uri).then(function (data) {
                inparams.scope.items = data;
            });
            inparams.scope.DataSaved = false;
            inparams.scope.showAlert = function () {
                inparams.scope.DataSaved = true;
                $timeout(function () {
                    inparams.scope.DataSaved = false;
                }, 2000);
            }
            inparams.scope.closeAlert = function () {
                inparams.scope.DataSaved = false;
            };
            inparams.scope.save = function () {
                inparams.dset.setValues(inparams.uri, inparams.scope.items).then(function (data) {
                    inparams.scope.showAlert();
                });
            };
        },
        setCalendar: function (scope, uri, event) {
            scope.openCalendar = function (uri, event) {
                event.preventDefault();
                event.stopPropagation();
                angular.forEach(scope.opened, function (value, key) {
                    scope.openedCalendars[key] = false;
                }, log);
                scope.openedCalendars[uri] = true;
            }
        }

    };
})
;