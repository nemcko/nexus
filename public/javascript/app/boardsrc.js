


app.factory('boardSrc', function ($rootScope, $timeout, $location, $routeParams, dataSet, dataSrc, dataRes, dataRes2, dataCache, md5, $sce, $http, $q, dataUri, Upload) {
    var loadBoardLinks = function (scope, loaddata) {
        if ($routeParams.vid) {
            dataSrc.post({
                oid: 'board',
                id: $routeParams.vid
            }, {
                acid : scope.accid
            }, function (data) {
                initBoardLinkData(scope, loaddata, data);
            });
        } else {
            dataSrc.post({
                oid: 'dashboard',
                id: (loaddata?$routeParams.id:1)
            }, {
                acid : scope.accid
            }, function (data) {
                initBoardLinkData(scope, loaddata, data);
            });
        }
    };
    function initBoardLinkData(scope, loaddata, data){
        var lindata = angular.copy(dataCache.get('panelBoard'));
        lindata.links = [];
        data.boards.forEach(function (pos) {
            lindata.links.unshift(pos);
        });
        scope.$parent.setPanel(lindata);
        
        if (loaddata) {
            scope.panels = scope.panels || {};
            scope.dashboard = data.current;
            scope.dashboard.hasSearchPanel = data.hasSearchPanel;
            
            angular.forEach(data.current.position, function (views, key) {
                angular.forEach(views, function (view, key) {
                    scope.initPanelViewData(view);
                });
            });
        }
    }
    
    return {
        initViewData: function (scope,options) {
            scope.userTypes = dataCache.get('userType');
            scope.dataPage = 'allof';
            scope.vwflds = dataCache.get('vwflds');
            scope.optassignee = [];
            scope.optrequester = [];
            scope.newitem = {};
            scope.accids = [];
            scope.allflds = dataCache.get('vwflds').concat(dataCache.get('actflds'));
            scope.charttype = dataCache.get('charttype');
            scope.chartstart = dataCache.get('chartstart');
            scope.chartperiod = dataCache.get('chartperiod');
            scope.msgflds = dataCache.get('msgflds');
            scope.charttimeunit = dataCache.get('charttimeunit');
            scope.bookfntype = dataCache.get('bookfntype');
            scope.accumfns = dataCache.get('accumfn');

            
            scope.lastFocused;
            scope.setLastFucus = function () {
                scope.lastFocused = document.activeElement;
            }
            scope.insertFldCode = function (msgfldsfield) {
                if (!(scope.lastFocused && msgfldsfield)) return;
                var input = scope.lastFocused;
                var text = '{{' + msgfldsfield + '}}';

                if (input == undefined) { return; }
                var scrollPos = input.scrollTop;
                var pos = 0;
                var browser = ((input.selectionStart || input.selectionStart == "0") ? 
                   "ff" : (document.selection ? "ie" : false));
                if (browser == "ie") {
                    input.focus();
                    var range = document.selection.createRange();
                    range.moveStart("character", -input.value.length);
                    pos = range.text.length;
                }
                else if (browser == "ff") { pos = input.selectionStart };
                
                var front = (input.value).substring(0, pos);
                var back = (input.value).substring(pos, input.value.length);
                input.value = front + text + back;
                pos = pos + text.length;
                if (browser == "ie") {
                    input.focus();
                    var range = document.selection.createRange();
                    range.moveStart("character", -input.value.length);
                    range.moveStart("character", pos);
                    range.moveEnd("character", 0);
                    range.select();
                }
                else if (browser == "ff") {
                    input.selectionStart = pos;
                    input.selectionEnd = pos;
                    input.focus();
                }
                input.scrollTop = scrollPos;
                //angular.element(input).trigger('input');
            }  
            
            

            if (options && options === 'nomsg') {
                var flds = [];
                scope.vwflds = angular.forEach(scope.vwflds,function (itm) {
                    if (!(itm.name === 'subject' || itm.name === 'message')) { 
                        flds.push(itm);
                    };
                });
                scope.vwflds = flds;
            }

            scope.actflds = dataCache.get('vwflds').concat(dataCache.get('actflds'));
           
            dataSrc.postquery({
                oid : 'optassignee'
            }, {
                acid : scope.accid
            }, function (data) {
                scope.optassignee = data;
            });
            
            dataSrc.postquery({
                oid : 'optrequester'
            }, {
                acid : scope.accid, search : ''
            }, function (data) {
                scope.optrequester = data;
            });
            
            dataSrc.postquery({
                oid : 'view', id : 'accids'
            }, function (data) {
                scope.accids = data;
            });
            
            scope.getListType = function (name) {
                var type = '';
                angular.forEach(scope.allflds, function (obj, key) {
                    if (obj.name === name) {
                        if (obj.type) {
                            type = obj.type;
                        }
                        return type;
                    }
                });
                return type;
            }
            
            scope.getListValues = function (name) {
                var items = [];
                angular.forEach(scope.allflds, function (obj, key) {
                    if (obj.name === name) {
                        if (obj.cache) {
                            items = dataCache.get(obj.cache);
                        } else if (obj.oid) {
                            switch (obj.oid) {
                                case 'automat': items = dataCache.get('operNull'); break;
                                case 'optassignee': items = scope.optassignee; break;
                                case 'optrequester': items = scope.optrequester; break;
                                case 'optover': items = dataCache.get('optover'); break;
                                case 'optticstatus': items = dataCache.get('optticstatus'); break;
                            }
                        }
                        return;
                    }
                });
                return items;
            }
            
            scope.getListOperands = function (name) {
                var items = [];
                angular.forEach(scope.allflds, function (obj, key) {
                    if (obj.name === name) {
                        if (obj.oid && obj.oid === 'automat')
                            items = dataCache.get('operSet');
                        else
                        if (obj.oid && obj.oid === 'optover')
                            items = dataCache.get('operDate');
                        else
                        if (obj.oid && obj.oid === 'optticstatus')
                            items = dataCache.get('operStrIn');
                        else
                        if (obj.name === 'tags')
                            items = dataCache.get('operIn');
                        else
                        if (obj.type)
                            items = dataCache.get('oper' + obj.type);
                        else
                            items = dataCache.get('operString');
                        return;
                    }
                });
                return items;
            }
            scope.addListItem = function (newitem, items) {
                if (newitem.field && newitem.oper){// && newitem.value) {
                    items.push(angular.copy(newitem));
                    scope.$parent.refresh();
                };
            }
            scope.delListItem = function (item, items) {
                angular.forEach(items, function (itm, key) {
                    if (itm.field === item.field && itm.oper === item.oper && itm.value === item.value) {
                        items.splice(key, 1);
                    }
                });
            }
            
            scope.addFieldsItem = function (newitem, items) {
                var found = false;
                angular.forEach(items, function (itm) {
                    if (itm === newitem) {
                        found = true;
                        return;
                    }
                });
                if (!found && newitem) {
                    items.push(angular.copy(newitem));
                    scope.$parent.refresh();
                };
                //items.push(angular.copy(newitem));
                //scope.$parent.refresh();

            }
            scope.delFieldsItem = function (item, items) {
                angular.forEach(items, function (itm, key) {
                    if (itm === item) {
                        items.splice(key, 1);
                    }
                });
            }
            
            scope.addGroupFieldsItem = function (newitem, items) {
                var found = false;
                angular.forEach(items, function (itm) {
                    if (itm.field === newitem.field) {
                        found = true;
                        return;
                    }
                });
                if (!found && newitem) {
                    newitem.asc = newitem.asc || false;
                    items.push(angular.copy(newitem));
                    scope.$parent.refresh();
                };
            }

            scope.addSortFieldsItem = function (newitem, items) {
                var found = false;
                angular.forEach(items, function (itm) {
                    if (itm.field === newitem.field) {
                        found = true;
                        return;
                    }
                });
                if (!found && newitem) {
                    newitem.asc = newitem.asc || false;
                    items.push(angular.copy(newitem));
                    scope.$parent.refresh();
                };
            }
            scope.delSortFieldsItem = function (item, items) {
                angular.forEach(items, function (itm, key) {
                    if (itm.field === item.field) {
                        items.splice(key, 1);
                    }
                });
            }
          
            scope.getFieldsItemLabel = function (fld) {
                var sellabel = '';
                angular.forEach(scope.vwflds, function (itm, key) {
                    if (fld.field) {
                        if (itm.name === fld.field) {
                            sellabel = itm.label;
                        }
                    } else {
                        if (itm.name === fld) {
                            sellabel = itm.label;
                        }
                    }
                });
                return sellabel;
            }

            scope.getListMessage = function (name) {
                var message = '';
                angular.forEach(scope.actflds, function (obj, key) {
                    if (obj.name === name) {
                        if (obj.msg) {
                            message = obj.msg;
                        }
                        return;
                    }
                });
                return message;
            }
            
            scope.setListMessage = function (item) {
                var msg = scope.getListMessage(item.field)
                if (msg) {
                    item.message = msg;
                } else {
                    if (item.message) {
                        delete item.message;
                    }
                }
                item.value = "";
            }
                       
            scope.addActionItem = function (newitem, items) {
                var found = false;
                angular.forEach(items, function (itm) {
                    if (itm === newitem) {
                        found = true;
                        return;
                    }
                });
                if (!found && newitem) {
                    var msg = scope.getListMessage(newitem.field)
                    if (msg) {
                        var itm = angular.copy(newitem);
                        itm.message = msg;
                        items.push(itm);
                    } else {
                        items.push(angular.copy(newitem));
                    }
                    scope.$parent.refresh();
                };
            }

            scope.addDataset = function (newitem, items) {
                var found = false;
                angular.forEach(items, function (itm) {
                    if (itm.label === newitem[0]) {
                        found = true;
                        return;
                    }
                });
                if (!found && newitem) {
                    var itm = angular.copy(scope.DatasetEmpty);
                    itm.label = newitem[0];
                    scope.seldataset = itm;
                    items.push(itm);
                    scope.$parent.refresh();
                };
            }
            scope.delDataset = function (item, items) {
                if (item) {
                    angular.forEach(items, function (itm, key) {
                        if (itm.label === item.label) {
                            items.splice(key, 1);
                        }
                    });
                    if (items.length) {
                        scope.curDatasetLabel = scope.seldataset.label;
                        scope.selDataset(items[0], items);
                        scope.$parent.refresh();
                    }
                }
            }
            scope.selDataset = function (item, items) {
                if (item) {
                    angular.forEach(items, function (itm, key) {
                        if (itm.label === item.label) {
                            scope.seldataset = items[key];
                            scope.curDatasetLabel = scope.seldataset.label;
                        }
                    });
                }
            }


        },
        initBpos: function (scope) {
            scope.boardtypes = dataCache.get('boardtypes');
            scope.bviewtype = dataCache.get('bviewtype');
            scope.chartratio = dataCache.get('chartratio');
            scope.optboards = [];
            scope.optviews = [];

            scope.getListSides = function (name) {
                var items = [];

                angular.forEach(scope.boardtypes, function (obj, key) {
                    if (obj.type === name) {
                        if (obj.cache) {
                            items = dataCache.get(obj.cache);
                        }
                        return;
                    }
                });
                return items;
            }

            dataSrc.postquery({
                oid : 'optviews'
            }, {
                acid : scope.accid, search : ''
            }, function (data) {
                scope.optviews = data;
            });
            
            scope.addListItem = function (newitem, items) {
                if (newitem.code && newitem.view){// && newitem.size) {
                    items.push(angular.copy(newitem));
                    scope.$parent.refresh();
                };
            }
            scope.delListItem = function (item, items) {
                angular.forEach(items, function (itm, key) {
                    if (itm.code === item.code && itm.view === item.view && itm.size === item.size) {
                        items.splice(key, 1);
                    }
                });
            }

        },
        loadBoardLinks: function (scope, loaddata) {
            loadBoardLinks(scope, loaddata);
        },
        initCardData: function (scope) {
            scope.cardtypes = dataCache.get('cardtypes');
            scope.accumfns = dataCache.get('accumfn');

            scope.iniCardtype = function (pos, type, cards) {
                if (pos) {
                    scope.curPosition=pos[0];
                } else {
                    scope.setCardtype(type, cards)
                }
            }

            scope.setCardtype = function (type, cards) {
                angular.forEach(cards, function (item) {
                    if (item.cardtype === type) {
                        scope.rowdata.position = angular.copy(item.position);
                        return;
                    } 
                });
            }
        },

        initTableData: function (scope) {
            scope.optassignee = [];
            scope.optrequester = [];
            scope.opttags = [];
            scope.optmacros = [];
            scope.optpriority = dataCache.get('optpriority');
            scope.optservice = dataCache.get('optservice');
            scope.optrequital = dataCache.get('optrequital');
            scope.opttime = dataCache.get('opttime');
            scope.opttransp = dataCache.get('opttransp');
            scope.ticstatus = dataCache.get('ticstatus');
            scope.ticketExt = 'comment';

            scope.vwflds = dataCache.get('vwflds').concat(dataCache.get('vwextflds'));
            scope.allflds = dataCache.get('vwflds').concat(dataCache.get('actflds'));
            scope.colorvalues = dataCache.get('colorvalues');
            scope.bookfntype = dataCache.get('bookfntype');
            
            dataSrc.postquery({
                oid : 'optassignee'
            }, {
                acid : scope.accid
            }, function (data) {
                scope.optassignee = data;
            });
            
            dataSrc.postquery({
                oid : 'optrequester'
            }, {
                acid : scope.accid, search : ''
            }, function (data) {
                scope.optrequester = data;
            });
            
            dataSrc.postquery({
                oid : 'optmacros'
            }, {
                acid : scope.accid, search : ''
            }, function (data) {
                scope.optmacros = data;
            });
            dataSrc.postquery({
                oid : 'opttags'
            }, {
                acid : scope.accid, search : ''
            }, function (data) {
                scope.opttags = data;
            });

            var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
            var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

            scope.getColumnTitle = function (name) {
                var tit = name;
                angular.forEach(scope.vwflds, function (itm) {
                    if (itm.name === name) {
                        tit = itm.label;
                        return tit;
                    }
                });
                return tit;
            }
            
            scope.getColumnWidth = function (flds, name, book) {
                var sizes = []
                  , total = (book?-5:0)
                  , colsize = 0;
                angular.forEach(scope.vwflds, function (itm) {
                    angular.forEach(flds, function (fld) {
                        if (itm.name === fld) {
                            var sz = itm.size?itm.size:10;
                            sizes.push({ name: itm.name, width: sz, w100: 0 });
                            total += sz;
                            return;
                        }
                    });
                });
                angular.forEach(sizes, function (size) {
                    size.w100 = Math.floor(size.width * 100 / total);
                });
                angular.forEach(sizes, function (itm) {
                    if (itm.name === name) {
                        colsize = itm.w100;
                        return;
                    }
                });
                return colsize;
            }

            scope.getColumnWidth100 = function (flds, book) {
                var sizes = []
                  , total = (book?-5:0)
                  , colsize = 100;
                angular.forEach(scope.vwflds, function (itm) {
                    angular.forEach(flds, function (fld) {
                        if (itm.name === fld) {
                            var sz = itm.size?itm.size:10;
                            sizes.push({ name: itm.name, width: sz, w100: 0 });
                            total += sz;
                            return;
                        }
                    });
                });
                angular.forEach(sizes, function (size) {
                    size.w100 = Math.floor(size.width * 100 / total);
                    colsize -= size.w100;
                });
                if (colsize >= 100)
                    return 0;
                else
                    return Math.max(0, colsize + 1);
            }
            
            scope.getColumnValue = function (name, value) {
                var formfun;
                angular.forEach(scope.vwflds, function (itm) {
                    if (itm.name === name) {
                        formfun = itm.formfun;
                        return;
                    }
                });
                if (formfun) {
                    switch (formfun) {
                        case 'dmy':
                            value = scope.getDmyValue(value);// + ' (' + scope.getDHM(value) + ')'
                            break;
                        case 'priority':
                            value = '<div style="display:inline-block;opacity: 0.87;background-color:' + scope.getValuecolor(formfun, value) + ';height:16px;width:16px;border-radius: 8px;padding:0;spacing:0;">&nbsp;</div>&nbsp;' + value;
                            break;
                        case 'requested':
                            value = '<div style="color:' + scope.getValuecolor('unsolved', scope.getMinuteDifference(value)) + '">' + scope.getDmyValue(value) + '</div>';
                            break;
                        case 'overdate':
                            value = '<span>' + scope.getDHM(value) + '</span>';
                            break;
                        case 'unsolved': 
                        case 'unasigned': 
                        case 'bookmarks': 
                        case 'overdue': 
                        case 'knowledge': 
                        case 'oldtickets':
                            value = '<div style="color:' + scope.getValuecolor(formfun, scope.getMinuteDifference(value)) + '">' + scope.getDHM(value) + '</div>';
                            break;
                    }
                }
                
                return value;
            }
            
            scope.getJsonDateValue = function (value) {
                var a = reISO.exec(value);
                if (a)
                    return new Date(value);
                a = reMsAjax.exec(value);
                if (a) {
                    var b = a[1].split(/[-+,.]/);
                    return new Date(b[0] ? +b[0] : 0 - +b[1]);
                }
                return new Date();
            }
            
            scope.getDmyValue = function (value) {
                var d = scope.getJsonDateValue(value);
                return d.getDate() + "." + (d.getMonth() + 1) + '.' + (d.getFullYear() - 2000);
            }
            
            scope.getMinuteDifference = function (start, end) {
                var timeStart, timeEnd, hourDiff;
                if (typeof start === 'string') {
                    timeStart = scope.getJsonDateValue(start).getTime();
                    timeEnd = (end === undefined? new Date():scope.getJsonDateValue(end)).getTime();
                } else {
                    timeStart = (start === undefined ? new Date() : start).getTime();
                    timeEnd = (end === undefined ? new Date() : end).getTime();
                }
                var hourDiff = timeEnd - timeStart;
                return hourDiff / 60 / 1000;
            }
            
            scope.getDHM = function (start, end) {
                var minDiff = scope.getMinuteDifference(start, end);
                var txt = "";
                var cnt;
                var bMinus = minDiff < 0;
                var numDays = 0;
                var numHours = 0;
                
                
                minDiff = Math.abs(minDiff);
                cnt = Math.floor(minDiff / 24 / 60);
                if (cnt) {
                    numDays = cnt;
                    txt += cnt + 'd ';
                    minDiff = minDiff - cnt * 24 * 60;
                }
                cnt = Math.floor(minDiff / 60);
                if (cnt) {
                    numHours = cnt;
                    txt += cnt + 'h ';
                    minDiff = minDiff - cnt * 60;
                }
                if (!(numDays || numHours)) {
                    cnt = Math.floor(minDiff);
                    if (cnt) {
                        txt += cnt + 'min ';
                    }
                }
                return (bMinus?'-':'') + txt.trim();
            }
            
            scope.getValuecolor = function (name, value) {
                var colorvals = scope.colorvalues[name]
                  , color = '';
                angular.forEach(colorvals, function (cval) {
                    if (!color)
                        switch (cval.oper) {
                            case 'd_lt':
                                if (value < eval(cval.value)) { color = cval.color; };
                                break;
                            case 'd_gte':
                                if (value >= eval(cval.value)) { color = cval.color; };
                                break;
                            case 's_eq':
                                if (value === cval.value) { color = cval.color; };
                                break;
                        }
                });
                return color;
            }
            
            scope.getGroupRow = function (panel, row, nrow) {
                var label = '', spanel = '';
                angular.forEach(scope.vwflds, function (itm) {
                    if (itm.name === panel.grpfld) {
                        label = itm.label;
                        return;
                    }
                });

                angular.forEach(panel.fields, function (fld) {
                    if (row._grpfld[fld] ) {
                        angular.forEach(scope.vwflds, function (itm) {
                            if (itm.name === fld && itm.name !== panel.grpfld) {
                                if (!spanel) spanel='<small class="app-right">&nbsp;'
                                spanel += '<span>';
                                spanel += '&#8721;'+itm.label +'= ';
                                spanel += row._grpfld[fld];
                                spanel += '&nbsp;&nbsp;</span>';
                                return;
                            }
                        });
                   }
                });
                if (spanel) spanel += '&nbsp;&nbsp;&nbsp;&nbsp;</small>';

                return '' + label + ': <b>' + row._grpfld[panel.grpfld] + '</b>&nbsp;&nbsp;&nbsp;&nbsp;' + spanel;
            }
            
            scope.getColumnAlign = function (name) {
                var cls = 'mdl-data-table__cell--non-numeric';
                angular.forEach(scope.vwflds, function (itm) {
                    if (itm.name === name) {
                        if (itm.align) {
                            cls = '';
                        }
                        return cls;
                    }
                });
                return cls;
            }
            
            scope.getBookmarkFunName = function (fnName) {
                var title = '';
                angular.forEach(scope.bookfntype, function (itm) {
                    if (itm.bookfn === fnName) {
                        title = itm.name;
                        return;
                    }
                });
                return title;
            }
            
            scope.getChartColor = function (type, row, col) {
                switch (type) {
                    case 'single':
                        return "mdl-color--blue-100";
                        break;
                    case 'columns3':
                        return "mdl-color--blue-100";
                        break;
                    default:
                        switch (col) {
                            case 1:
                                return "mdl-color--blue-100";
                                brea;
                            case 2:
                                return row % 2 ? "mdl-color--indigo-100" : "mdl-color--blue-50";
                                brea;
                            case 3:
                                return row % 2 ? "mdl-color--indigo-100" : "mdl-color--blue-50";
                                brea;
                        }
                        break;
                }
            }
            
            scope.getSeriesColor = function (num) {
                switch (num) {
                    case 0:
                        return "#d70206";
                    case 1:
                        return "#f05b4f";
                    case 2:
                        return "#f4c63d";
                    case 3:
                        return "#d17905";
                    case 4:
                        return "#453d3f";
                    case 5:
                        return "#59922b";
                    case 6:
                        return "#0544d3";
                    case 7:
                        return "#6b0392";
                    case 8:
                        return "#f05b4f";
                    case 9:
                        return "#dda458";
                    case 10:
                        return "#eacf7d";
                    case 11:
                        return "#86797d";
                    case 12:
                        return "#b2c326";
                    case 13:
                        return "#6188e2";
                    case 14:
                        return "#a748ca";
                }
            }

            scope.getTableColor = function (type, row, col) {
                switch (type) {
                    case 'columns3':
                        return "mdl-color--purple-200";
                        break;
                    case 'columns2l':
                        return "mdl-color--blue-400";
                        break;
                    default:
                        switch (col) {
                            case 1:
                                return "mdl-color--blue-400";
                                brea;
                            case 2:
                                return row % 2 ? "mdl-color--indigo-200" : "mdl-color--blue-400";
                                brea;
                            case 3:
                                return row % 2 ? "mdl-color--indigo-200" : "mdl-color--blue-400";
                                brea;
                        }
                        break;
                }
            }
            
            scope.getChartHeight = function (size, type, row, col) {
                //return "{ width: 100%; height: "+ 10*rows+"vw; }";
                //return "{ height: " + 10 * rows + "vw; }";
                return { 'height': 32 * size + 'px' };
                //return { 'width': '100%','height': 10 * rows + 'vw' };
            }
            
            scope.setBookmark = function (panel, row) {
                if (row.bookmark) {
                    dataRes2.delete({
                        oid : 'bookmark',
                        p1: row._id,
                        p2: panel.hasbookmarks
                    }, {
                        acid : scope.accid, search : ''
                    }, function (data) {
                        panel.pageMarked = data.num;
                        row.bookmark = false;
                        scope.setBookmarkRefresh(panel);
                    });
                } else {
                    dataRes2.set({
                        oid : 'bookmark',
                        p1: row._id,
                        p2: panel.hasbookmarks
                    }, {
                        acid : scope.accid, search : ''
                    }, function (data) {
                        panel.pageMarked = data.num;
                        row.bookmark = true;
                        scope.setBookmarkRefresh(panel);
                    });
                }
            }
            
            scope.setBookmarkAll = function (panel, remove) {
                var ids = {};
                angular.forEach(panel.items, function (row, key) {
                    if (remove && row.bookmark || !(remove || row.bookmark)) {
                        //ids.push(row._id);
                        ids['p' + key] = row._id;
                    }
                });
                dataRes2.set({
                    oid : 'setbookmarks',
                }, {
                    acid : scope.accid, search : '', ids: ids, remove: remove
                }, function (data) {
                    scope.setBookmarkRefresh();
                });
            }
            
            scope.setBookmarkRefresh = function (current) {
                if (current) {
                    if (!current.hasbookmarks) return;
                    angular.forEach(scope.dashboard.position, function (posview, pv) {
                        angular.forEach(posview, function (view, key) {
                            if (current.vid !== view.vid && view.hasbookmarks) {
                                scope.refreshPanelViewData(view);
                            }
                        });
                    });
                } else {
                    angular.forEach(scope.dashboard.position, function (posview, pv) {
                        angular.forEach(posview, function (view, key) {
                            if (view.hasbookmarks) {
                                scope.refreshPanelViewData(view);
                            }
                        })
                    })
                }
            }
            
            scope.setMarkers = function (panel, check) {
                angular.forEach(panel.items, function (itm, key) {
                    itm.marker = check;
                });
            }
            
            scope.getMarkerCount = function (panel) {
                var count = 0;
                angular.forEach(panel.items, function (itm, key) {
                    if (itm.marker) {
                        count++;
                    }
                });
                return count;
            }
            
            scope.applyMarkers = function (items) {
                scope.dataMarkers = {
                    tickets: {},
                    ids: {},
                    count: 0
                }
                if (items) {
                    angular.forEach(items, function (item, key) {
                        if (item.marker) {
                            scope.dataMarkers.count++;
                            scope.dataMarkers.ids['p' + key] = item._id;
                            if (item.ticnum)
                                scope.dataMarkers.tickets['p' + key] = '#' + item.ticnum;
                            else
                                scope.dataMarkers.tickets['p' + key] = '?' + key;
                        }
                    });
                } else {
                    angular.forEach(scope.dashboard.position, function (posview, pv) {
                        angular.forEach(posview, function (panel) {
                            if (panel.items) {
                                angular.forEach(panel.items, function (item, key) {
                                    if (item.marker) {
                                        scope.dataMarkers.count++;
                                        scope.dataMarkers.ids['p' + key] = item._id;
                                        if (item.ticnum)
                                            scope.dataMarkers.tickets['p' + key] = '#' + item.ticnum;
                                        else
                                            scope.dataMarkers.tickets['p' + key] = '?' + key;
                                    }
                                });
                            }
                        })
                    })
                }
                scope.rowid = null;
                scope.rowdata = angular.copy(scope.rowdataEmpty);
                scope.rowdata.status = '';
                scope.rowdata.assignee = ' ';
                scope.rowdata.priority = ' ';
                
                scope.rowdata.time = null;
                scope.rowdata.transport = null;
                scope.rowdata.purchase = null;
                scope.rowdata.price = null;
                scope.rowdata.reimburse = null;
            }
            
            scope.getLogs = function (logs, ext) {
                var newlogs = [];
                angular.forEach(logs, function (item) {
                    if (ext === 'comments') {
                        if (item.comment || item.atid) {
                            newlogs.push(item);
                        }
                    } else {
                        newlogs.push(item);
                    }
                });
                return newlogs;

            }
            
            scope.getChangeText = function (name, value) {
                var tit = name
                  , from = value.from
                  , to = value.to
                  , type;
                
                angular.forEach(scope.allflds, function (itm) {
                    if (itm.name === name) {
                        tit = itm.label;
                        type = itm.type;
                    }
                });
                if (type === "Date" || to.match(reISO)) {
                    from = scope.dateStringParse(from);
                    to = scope.dateStringParse(to);
                }
                if (typeof from === 'object') {
                    from = scope.dateStringParse(from);
                }
                if (typeof to === 'object') {
                    to = scope.dateStringParse(to);
                }
                return tit + ": " + (from?" from " + from: "") + (to?" to <b>" + to: "</b>");
            }
            
            scope.assignMe = function (row, id) {
                if ($rootScope.bLogged) {
                    row[id] = $rootScope.bLogged;
                    document.querySelector('#' + id).focus();
                }
            }

            function suggest_state(term) {
                var q = term.toLowerCase().trim();
                var results = [];
                
                for (var i = 0; i < scope.optrequester.length && results.length < 10; i++) {
                    var state = scope.optrequester[i].key;
                    if (term && state.toLowerCase().indexOf(q) >= 0 || term === undefined)
                        results.push({ label: '"' + scope.optrequester[i].name + '"   ' + scope.optrequester[i].key  , value: scope.optrequester[i].key });
                }
                
                return results;
            }
            
            function highlight(str, term) {
                var highlight_regex = new RegExp('(' + term + ')', 'i');
                return str.replace(highlight_regex, '<span class="ac-highlight">$1</span>');
            };
            
            function suggest_state_with_highlight(term) {
                term = term.split(";").pop();
                
                if (term.length < 2)
                    return;
                
                var suggestions = suggest_state(term);
                suggestions.forEach(function (s) {
                    s.label = $sce.trustAsHtml(highlight(s.label, term));
                });
                
                return suggestions;
            };
            
            function select_email(oldvalue, item) {
                var end = oldvalue.lastIndexOf(";");
                if (end >= 0) {
                    return oldvalue.substring(0, end) + '; ' + item.value;
                } else {
                    return item.value;
                }
            }
            
            scope.autocomplete_options = {
                suggest: suggest_state_with_highlight,
                do_select: select_email
            };
            
            
            
            scope.fopttime_dectype = true;
            scope.fopttime = function (itm) {
                return itm.dec === scope.fopttime_dectype;
            }
            scope.applyDropValue = function (objname, value) {
                assignPropertyValue(scope, objname, value);
                if (objname === 'rowdata.service') {
                    scope.fopttime_dectype = value === 'helpdesk';
                }
                if (scope.dropfocus_ids) {
                    var elem = document.querySelector('#' + scope.dropfocus_ids[objname]);
                    if (elem) elem.focus();
                }
            };
            
            scope.applyStatpri = function (objname, name, item) {
                assignPropertyValue(scope, objname, name);
                assignPropertyValue(scope, 'rowdata.option', item);
            };
            
            scope.files = [];
            //scope.$on("fileSelected", function (event, args) {
            //    scope.$apply(function () {
            //        scope.files.push(args.file);
            //    });
            //});
            scope.delAttachment = function (index) {
                scope.files.splice(index, 1);
            }
            
            scope.getFileicon = function (filename) {
                return 'images/fileicons/' + filename.split('.').pop() + '.png';
            }
            
            scope.addTag = function (tags,tag) {
                var index = tags.indexOf(tag);
                if (index === -1) {
                    tags.push(tag);
                    tag = " ";
                }
            }
            scope.deleteTag = function (tags,tag) {
                var index = tags.indexOf(tag);
                if (index > -1) {
                    tags.splice(index, 1);
                }
            }

            scope.iniTableViewData = function (view) {
                view.pageNumber = view.pageNumber || 1;
                view.pageLimit = view.pageLimit || view.size || 10
                view.search = view.search || '';
                view.pageCount = 0;
                view.pageNumbers = [1];
                view.pageLimits = [5, 10, 20, 50, 100, 500];
                view.err = '';
                view.visibleNavpanel = false;
                
                view.doCmd = function (cmd, cmdval) {
                    switch (cmd) {
                        case 'pageLimit':
                            view.pageLimit = cmdval;
                            break;
                        case 'pageNumber':
                            view.pageNumber = cmdval;
                            break;
                        case 'pgUp':
                            view.pageNumber = Math.max(1, view.pageNumber - 1);
                            break;
                        case 'pgDn':
                            view.pageNumber = Math.min(view.pageNumber + 1, view.pageCount);
                            break;
                        case 'pgFirst':
                            view.pageNumber = 1;
                            break;
                        case 'pgLast':
                            view.pageNumber = view.pageCount;
                            break;

                    }
                    scope.loadViewData(view);
                };
                view.pressSearch = function (keyEvent) {
                    switch (keyEvent.which) {
                        case 27:
                            view.search = '';
                            scope.loadViewData(view);
                            break;
                        case 13:
                        case 8:
                            scope.loadViewData(view);
                            break;
                    }
                };
                
                scope.pressSearchPanel = function (keyEvent) {
                    switch (keyEvent.which) {
                        //case 27:
                        //    scope.dashboard.searchPanelText = '';
                            //scope.loadSearchPanelData();
                            //break;
                        case 13:
                            //case 8:
                            
                            scope.loadSearchPanelData();
                            break;
                    }
                };                             
            };

            scope.loadViewData = function (view,par) {
                var params;
                if (view.vid)
                    params = {
                        vid: view.vid,
                        vref: view.vref,
                        bookmarkfn: view.hasbookmarks,
                        search : view.search || '',
                    };
                else {
                    params = {
                        acid: view.acid,
                        vref: view.vref,
                        bookmarkfn: view.hasbookmarks,
                        search : view.search || '',
                    };
                }
                
                if (par) {
                    angular.extend(params, par);
                }

                dataSrc.post({
                    oid : view.oid,
                    pageNumber : view.pageNumber,
                    pageLimit : view.pageLimit
                }, params , function (data) {
                    if (data.acc)
                        view.acc = data.acc;
                    else
                        view.acc = { 'oid': view.oid, 'read': true, 'create': true, 'update': true, 'delete': true };
                    
                    if (data.items) {
                        view.pageNumber = data.pageNumber || 1;
                        view.pageLimit = data.pageLimit || 0;
                        view.pageTotal = data.pageTotal || 0;
                        view.pageCount = data.pageCount || 0;
                        view.pageMarked = data.pageMarked || 0;
                        view.kbcheck = data.kbcheck;
                        view.pageNumber = Math.max(1, Math.min(view.pageNumber, view.pageCount));
                        view.pageNumbers = [];
                        view.grpfld = data.grpfld;
                        view.hasbookmarks = data.hasbookmarks;
                        view.pageMarked = data.pageMarked;
                        
                        if (data.fields) view.fields = data.fields;

                        var first = Math.max(1, view.pageNumber - 2);
                        for (var pg = 0; pg < 5; pg++) {
                            if (first + pg <= view.pageCount)
                                view.pageNumbers.push(first + pg);
                        }
                        
                        for (var i = 0; i < data.items.length; i++) {
                            var newField = '_expanded';
                            data.items[i][newField] = false;
                        }
                    }
                    view.items = data.items;
                    view.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                }, function (httpResponse) {
                    view.err = httpResponse.data.err;
                    inparams.scope.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                });
            };

            scope.refreshPanelViewData = function (view) {
                var rview = function () {
                    dataSrc.post({
                        oid : view.oid,
                        pageNumber : view.pageNumber,
                        pageLimit : view.pageLimit
                    }, {
                        vid: view.vid,
                        vref: view.vref,
                        bookmarkfn: view.hasbookmarks,
                        search : view.search || '',
                    }, function (data) {
                        if (data.acc)
                            view.acc = data.acc;
                        else
                            view.acc = { 'oid': view.oid, 'read': true, 'create': true, 'update': true, 'delete': true };
                        
                        if (data.items) {
                            view.pageNumber = data.pageNumber || 1;
                            view.pageLimit = data.pageLimit || 0;
                            view.pageTotal = data.pageTotal || 0;
                            view.pageCount = data.pageCount || 0;
                            view.pageMarked = data.pageMarked || 0;
                            view.kbcheck = data.kbcheck;
                            view.pageNumber = Math.max(1, Math.min(view.pageNumber, view.pageCount));
                            view.pageNumbers = [];
                            view.grpfld = data.grpfld;
                            view.hasbookmarks = data.hasbookmarks;
                            view.pageMarked = data.pageMarked;
                            
                            var first = Math.max(1, view.pageNumber - 2);
                            for (var pg = 0; pg < 5; pg++) {
                                if (first + pg <= view.pageCount)
                                    view.pageNumbers.push(first + pg);
                            }
                            
                            for (var i = 0; i < data.items.length; i++) {
                                var newField = '_expanded';
                                data.items[i][newField] = false;
                            }
                        }
                        view.items = data.items;
                        if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                    });
                };

                if (view.vref) {
                    switch (view.vref) {
                        case 'View':
                            rview();
                            return;
                        case 'Chart':
                            scope.iniChartWdg(view);
                            return;
                    }
                } else {
                    rview();
                }
            }

            scope.dateStringParse = function(value) {
                if (typeof value === 'string') {
                    var a = reISO.exec(value)
                      , d;
                    if (a) {
                        d = new Date(value);
                    } else {
                        a = reMsAjax.exec(value);
                        if (a) {
                            var b = a[1].split(/[-+,.]/);
                            d = new Date(b[0] ? +b[0] : 0 - +b[1]);
                        }
                    }
                    if (d) {
                        //return d.format('dd.MM.yyyy HH:mm');
                        var month = d.getMonth() + 1;
                        var day = d.getDate();
                        
                        return (day < 10 ? '0' : '') + day + "." 
                          + (month < 10 ? '0' : '') + month + '.' 
                          + d.getFullYear() 
                          + ' ' + ("00" + d.getMinutes()).slice(-2) 
                          + ':' + ("00" + d.getSeconds()).slice(-2);
                    }
                } else if (value && typeof value === 'object') {
                    return ("00" + value.getDate()).slice(-2) 
                          + '.' + ("00" + value.getMonth()).slice(-2) 
                          + '.' + value.getFullYear() 
                          + ' ' + ("00" + value.getMinutes()).slice(-2) 
                          + ':' + ("00" + value.getSeconds()).slice(-2);
                }
                return value;
            };

            scope.closeModalView = function (id,data) {
                var target, content;
                target = document.querySelector('#' + id);
                content = target.querySelector('#' + id + '_content');
                if (content) {
                    target.style.visibility = 'hidden';
                    angular.element(target).parent().removeClass('blur-content');
                    scope.slideUpToggle = false;
                }
                if (data && data.items)
                    data.items = null;
            }

            scope.saveTicketData = function (item, afiles) {
                var saveData = function (attach, callback) {
                    var bAuto = scope.rowdata.autoplay;
                    if (!bAuto && scope.slideUpToggle) {
                        var target = document.querySelector('#ticketdetail')
                          , content = target.querySelector('#ticketdetail_content');
                        
                        target.style.top = '100%';
                        angular.element(target).parent().removeClass('blur-content');
                        scope.slideUpToggle = false;
                    }
                    if (bAuto) {
                        scope.slideUpToggle = true;
                    }

                    if (scope.rowdata._id) {
                       dataSrc.update({
                            oid : scope.rowdataPanel.oid||'ticket'
                        }, {
                            vid: scope.rowdataPanel.vid,
                            vref: scope.rowdataPanel.vref,
                            rowdata : scope.rowdata,
                            option: item,
                            attachfiles: attach,
                            rowid: scope.rowdata._id,
                            autoplay: bAuto,
                            search: scope.rowdataPanel.search,
                            ticnum: scope.rowdata.ticnum
                        }, function (data) {
                            scope.rowdataPanel.processdata = false;
                            //scope.clearAttachment();
                            scope.clearattachment = null;


                            if (bAuto) {
                                callback(data.items);
                            } else {
                                scope.refreshAll();
                                callback();
                            }
                            //scope.refreshPanelViewData(scope.rowdataPanel);
                        }, function (httpResponse) {
                            scope.rowdataPanel.err = httpResponse.data.err;
                            scope.rowdataPanel.processdata = false;
                            scope.$parent.showMessage(scope.rowdataPanel.err);
                            //if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                            scope.clearAttachment();
                            callback();
                        });

                    } else {
                        dataSrc.post({
                            oid : scope.rowdataPanel.oid
                        }, {
                            vid: scope.rowdataPanel.vid,
                            vref: scope.rowdataPanel.vref,
                            rowdata : scope.rowdata,
                            option: item,
                            attachfiles: attach,
                            rowid: scope.rowdata._id,
                            autoplay: bAuto
                        }, function (data) {
                            scope.rowdataPanel.processdata = false;
                            scope.loadViewData(scope.rowdataPanel);
                            //if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                            scope.clearAttachment();
                            callback();
                        }, function (httpResponse) {
                            scope.rowdataPanel.err = httpResponse.data.err;
                            scope.rowdataPanel.processdata = false;
                            scope.$parent.showMessage(scope.rowdataPanel.err);
                            //if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                            scope.clearAttachment();
                            callback();
                        });

                    }
                };
                
                var attachFiles = function (callback) {
                    var promises = []
                      , attachfiles = [];
                    if (afiles && afiles.length) {
                        angular.forEach(afiles, function (file) {
                            promises.push(Upload.base64DataUrl(file, true).then(function (blob) {
                                //attachfiles.push({uri: Base64.encode(file.name), filename: file.name, type: file.type, data: blob });
                                attachfiles.push({ uri: removeDiacritic(file.name), filename: file.name, type: file.type, data: blob });
                            }));
                        });
                    }
                    var defer = $q.defer();
                    $q.all(promises).then(function () {
                        defer.resolve(attachfiles);
                    }, function (e) {
                        defer.reject(e);
                    });
                    return defer.promise;
                };
                
                scope.rowdataPanel.processdata = true;
                attachFiles().then(function (attachfiles) {
                    saveData(attachfiles, function (data) {
                        if (data) {
                            scope.rowdata = angular.copy(scope.rowdataEmpty);
                            scope.rowdata = data;
                            scope.$parent.refresh();
                            document.querySelector('#subject').focus();
                            scope.refreshAll();
                        }
                    });
                }, function (err) { 
                });
            };
            
            scope.loadTicket = function (ticnum) {
                scope.rowdata = angular.copy(scope.rowdataEmpty);
                if (ticnum) {
                    dataSrc.get({
                        oid : 'ticketnum',
                        id: ticnum
                    }, {
                        acid : scope.accid
                    }, function (data) {
                        scope.rowdata = data;
                        scope.$parent.refresh();
                        document.querySelector('#subject').focus();
                    });
                }
            }

            scope.refreshAll = function () {
                angular.forEach(scope.dashboard.position, function (posview, pv) {
                    angular.forEach(posview, function (view, key) {
                        scope.refreshPanelViewData(view);
                    });
                });
            }
            
            scope.getNextTicket = function (view, row) {
                dataSrc.post({
                    oid : 'nextticket',
                    pageNumber : (view.pageNumber?view.pageNumber:0),
                    pageLimit : (view.pageLimit?view.pageLimit:0)
                }, {
                    acid : scope.accid,
                    vid: view.vid,
                    vref: view.vref,
                    bookmarkfn: view.hasbookmarks,
                    search : view.search || '',
                    viewoid : view.oid,
                    bookmarkfn: view.hasbookmarks,
                    rowid: (row?row._id:null),
                    ticnum: (row && row.ticnum?row.ticnum:null),
                }, function (data) {
                    if (!scope.rowdataPanel) {
                        scope.rowdataPanel = view;
                    }
                    if (!scope.slideUpToggle) {
                        var target = document.querySelector('#ticketdetail')
                          , content = target.querySelector('#ticketdetail_content');
                        
                        content.style.border = '1px solid rgba(0,0,0,0)';
                        content.style.border = 0;
                        target.style.top = 0;
                        target.style.clientHeight = '100%';
                        angular.element(target).parent().addClass('blur-content');
                        scope.rowdata = angular.copy(scope.rowdataEmpty);
                        scope.rowdataPanel = view;
                    }
                    scope.rowdata = data;
                    scope.$parent.refresh();
                    document.querySelector('#subject').focus();
                });
            }

            scope.applyTicketChanges = function () {
                var changes = {}
                  , numchanges = 0
                  , setChange = function (name, conv) {
                        if (scope.rowdata[name] && scope.rowdata[name] !== null && scope.rowdata[name] !== ' ') {
                            numchanges++;
                            changes[name] = angular.copy(scope.rowdata[name]);
                            if (conv) {
                                switch (conv) {
                                    case 'n':
                                        changes[name] = parseFloat(changes[name].replace(',', '.'));
                                        break;
                                    case 'd': {
                                        var b = changes[name].split('.');
                                        var tzo = ((new Date()).getTimezoneOffset() / 60) * (-1);
                                        changes[name] = new Date(b[2], b[1] - 1, b[0]);
                                        changes[name].setHours(changes[name].getHours() + tzo);
                                    };
                                    break;
                                    case 'b':
                                        break;
                                }
                            }
                        }
                    }
                setChange('assignee');
                setChange('requester');
                setChange('requestcc');
                setChange('requestbc');
                setChange('subject');
                setChange('service');
                setChange('requital');
                setChange('time', 'n');
                setChange('transport', 'n');
                setChange('purchase', 'n');
                setChange('price', 'n');
                setChange('dueDate', 'd');
                setChange('reimburse', 'b');
                
                //setChange('priority');
                setChange('comment');
                setChange('statpri');
                
                
                if (numchanges && scope.dataMarkers.count) {
                    dataSrc.post({
                        oid : 'applyticketchanges',
                        pageNumber : 0,
                        pageLimit : 0
                    }, {
                        bookmarkfn: 'applyticketchanges',
                        changes: angular.toJson(changes),
                        ids: scope.dataMarkers.ids,
                        option: scope.rowdata.option,
                        statpri: scope.rowdata.statpri,
                        rowdata: { comment: scope.rowdata.comment },
                    }, function (data) {
                        scope.refreshAll();
                        if (scope.slideUpToggle) {
                            var target = document.querySelector('#changesdetail')
                          , content = target.querySelector('#changesdetail_content');
                            
                            target.style.top = '100%';
                            angular.element(target).parent().removeClass('blur-content');
                            scope.slideUpToggle = false;
                        }
                    });
                }
            }

            scope.toExcel = function (pref, seq, name) {
                var uri = 'data:application/vnd.ms-excel;base64,'
                , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><?xml version="1.0" encoding="UTF-8" standalone="yes"?><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
                , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
                , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }
                , table = pref + seq
                , link = document.createElement("a");
               
                if (!table.nodeType) table = document.getElementById(table);
                var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML };
                if (link.download !== undefined) { 
                    link.setAttribute("href", uri + base64(format(template, ctx)));
                    link.setAttribute("download", name+".xls");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            };
            scope.toCSV = function (name, headers, rows, data) {
                var csvData = [];               
                csvData.push(","+headers.join(","));
                for (var i = 0; i < rows.length; i++) {
                    var row = [];
                    for (var j = 0; j < rows.length; j++) {
                        for (var k = 0; k < headers.length;k++) {
                           if (j === 0 && k===0) row.push(rows[i]);
                           if (j===i) row.push(data[k][j]);
                        }
                    }
                    csvData.push(row.join(","));
                }

                var fileName = name+".csv";
                var buffer = csvData.join("\n");
                var blob = new Blob([buffer], {
                    "type": "text/csv;charset=utf8;"
                });
                var link = document.createElement("a");

                if (link.download !== undefined) { 
                    link.setAttribute("href", window.URL.createObjectURL(blob));
                    link.setAttribute("download", fileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            };
        },

        initBoardData: function (scope) {
            scope.dashboard = { name: '', type: '' };
            scope.accid = 'tickets';

            scope.rowdataEmpty = {
                ticnum: 0,
                status: 'new',
                assignee: '--',
                priority: 'normal',
                dueDate: ' ',
                requester: ' ',
                requestcc: ' ',
                requestbc: ' ',
                subject: ' ',
                service: 'helpdesk',
                time: 0,
                transport: 0,
                purchase: 0,
                price: 0,
                reimburse: false,
                requital: ' ',
                description: ' ',
                tags: [],
                hidden: false,  
                comment: '',
                statpri: ' '
            };           
            
            this.initTableData(scope);


            if (scope.rowdataEmpty) {
                scope.rowdata = angular.copy(scope.rowdataEmpty);
            } else {
                scope.rowdata = {};
            }
           
            loadBoardLinks(scope,scope.dashboard);
            
            scope.initPanelViewData = function (view) {
                var dataname = view.vref + view.seq; //md5.createHash(view.vid + idx)          
                
                view.oid = 'ticket';
                //view.oid = 'mail';
                view.vid = view.vid;
                view.vref = view.vref;
                view.pgId = dataname;
                
                switch (view.vref) {
                    case 'View':
                        return scope.iniViewWdg(view);
                    case 'Card':
                        return scope.iniCardWdg(view);
                    case 'Search':
                        return scope.iniSearchWdg(view);
                    case 'Chart':
                        return scope.iniChartWdg(view);
                }

            }
            
            scope.iniViewWdg = function (view) {
                scope.iniTableViewData(view);
                
                
                scope.clearAttachment = function () {
                    scope.rowdata = null;
                    
                    //var fileElem = angular.element(document.querySelector('#ngf-files'));
                    //if (fileElem) {
                    //    if (fileElem.val()) {
                    //        fileElem.val(null);
                    //    }
                    //}
                    
                    //angular.element(document.querySelector('#fileInput'))[0].click();
                    
                    $timeout(function () {
                        scope.clearattachment = true;
                        $timeout(function () {
                            scope.clearattachment = null;
                        });
                    }, 500);
                };
                
                scope.runMacro = function (view, cmd) {
                    dataSrc.get({
                        oid : 'ticnum'
                    }, {
                        acid : scope.accid, search : ''
                    }, function (data) {
                        if (!scope.rowdataEmpty) {
                            scope.rowdata = {};
                        }
                        scope.rowdata = angular.copy(scope.rowdataEmpty);
                        scope.rowdata.ticnum = data.ticnum;
                        if (cmd) {
                            angular.forEach(cmd.fields, function (fld, key) {
                                if (fld.field === 'tags') {
                                    scope.rowdata[fld.field] = fld.value.split(',');
                                } else {
                                    scope.rowdata[fld.field] = fld.value;
                                }
                            });
                            scope.rowdata.subject = cmd.message.title;// + ' (#' + data.ticnum + ')';
                            scope.rowdata.comment = cmd.message.body;
                        } 
                        scope.rowid = null;
                        scope.showTicketDetail(view);
                    });
                };
                
                scope.showTicketDetail = function (view, row, index) {
                    var olddata = angular.copy(scope.rowdata);
                    componentHandler.upgradeAllRegistered();
                    scope.rowdata = angular.copy(scope.rowdataEmpty);
                    scope.rowdata = angular.copy(olddata);
                    scope.files = [];
                    if (row) {
                        if (view.kbcheck) {
                            dataSrc.post({
                                oid : 'kbcheck',
                                id: row._id
                            }, {
                                acid : scope.accid
                            }, function (data) {
                                $location.path(data.url);
                            });
                        } else {
                            dataSrc.get({
                                oid : 'ticketdata',
                                id: row._id
                            }, {
                                acid : scope.accid
                            }, function (data) {
                                $timeout(function () {
                                    scope.rowdata = angular.copy(scope.rowdataEmpty);
                                    scope.rowdataPanel = view;
                                    scope.rowdataPanel.curindex = index;
                                    scope.rowdata = data;
                                    scope.$parent.refresh();
                                    
                                    document.querySelector('#subject').focus();
                                }, 500);
                            });
                        }
                    } else {
                        $timeout(function () {
                            scope.rowdataPanel = view;
                            //if (index >= 0) {
                            //    scope.rowdata = angular.copy(view.items[index]);
                            //    scope.rowdataPanel._id = view.items[index]._id;
                            //}
                            scope.$parent.refresh();
                            
                            document.querySelector('#subject').focus();
                        }, 500);
                    }
                }
                
                view.processdata = true;
                scope.loadViewData(view);
            };
                         
            scope.iniCardWdg = function (view) {
                view.chartid = view.pgId;
                view.search = view.search || '';
                view.err = '';
                view.visibleNavpanel = false;
                view.processdata = true;
                scope.loadCardWdgData(view);
            }

            scope.iniSearchWdg = function (view) {
                view.chartid = view.pgId;
                view.search = view.search || '';
                view.err = '';
                view.visibleNavpanel = false;
                view.processdata = true;
                scope.loadSearchWdgData(view);
            }

            scope.iniChartWdg = function (view) {
                view.chartid = view.pgId;
                //view.type = 'line';
                view.search = view.search || '';
                view.err = '';
                view.processdata = true;
                scope.loadChartWdg(view);
            }
            
            scope.$on('currentDate', function (event, args) {
                scope.refreshAll();
            });

            scope.loadSearchPanelData = function () {
                dataSrc.post({
                    oid : 'searchpanel',
                    pageNumber : 0,
                    pageLimit : 0
                }, {
                    vid: scope.dashboard.hasSearchPanel,
                    vref: 'Search',
                    search : scope.dashboard.searchPanelText || '',
                }, function (data) {
                    if (data._id) {
                        var view;
                        if (!scope.rowdataPanel) {
                            angular.forEach(scope.dashboard.position, function (posview, pv) {
                                angular.forEach(posview, function (panel) {
                                    if (panel.items) {
                                        view = panel;
                                        return;
                                    }
                                });
                            });
                        } else {
                            view = scope.rowdataPanel;
                        }
                        if (!scope.slideUpToggle) {
                            var target = document.querySelector('#ticketdetail')
                          , content = target.querySelector('#ticketdetail_content');
                            
                            content.style.border = '1px solid rgba(0,0,0,0)';
                            content.style.border = 0;
                            target.style.top = 0;
                            target.style.clientHeight = '100%';
                            angular.element(target).parent().addClass('blur-content');
                            scope.rowdata = angular.copy(scope.rowdataEmpty);
                            scope.rowdataPanel = view;
                        }
                        scope.rowdata = data;
                        scope.$parent.refresh();
                        document.querySelector('#subject').focus();

                    } else {
                        if (!scope.showHideToggle) {
                            var target, content;
                            target = document.querySelector('#modalview');
                            content = target.querySelector('#modalview_content');
                            
                            content.style.border = '1px solid rgba(0,0,0,0)';
                            content.style.border = 0;
                            target.style.visibility = 'visible';
                            angular.element(target).parent().addClass('blur-content');
                        }
                        scope.searchPanelData = data;
                        scope.searchPanelData.vid = scope.dashboard.hasSearchPanel;
                        scope.searchPanelData.search = scope.dashboard.searchPanelText;
                        $timeout(function () {
                            var doc = document.querySelector('#searchpanelBtn');
                            if (doc) doc.focus();
                        }, 500);
                    }
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                }, function (httpResponse) {
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                });
            };
            
            scope.doBookmarkFunction = function (view, bookmarkfn, id) {
                var ids = {};
                angular.forEach(view.items, function (row, key) {
                    if (row.marker) {
                        ids['p' + key] = row._id;
                    }
                });

                dataSrc.post({
                    oid : 'dobookmark',
                    pageNumber : view.pageNumber,
                    pageLimit : view.pageLimit
                }, {
                    vid: view.vid,
                    vref: view.vref,
                    bookmarkfn: view.hasbookmarks,
                    search : view.search || '',
                    viewoid : view.oid,
                    bookmarkfn: bookmarkfn,
                    markid: id,
                    ids: ids,
                }, function (data) {
                    scope.refreshAll();
                });
            }
            
            scope.mergeTickets = function (view, rowdata) {
                var data = angular.copy(rowdata);
                
                if (data.time)
                    data.time = parseFloat(data.time.replace(',', '.'));
                if (data.transport)
                    data.transport = parseFloat(data.transport.replace(',', '.'));
                if (data.purchase)
                    data.purchase = parseFloat(data.purchase.replace(',', '.'));
                if (data.price)
                    data.price = parseFloat(data.price.replace(',', '.'));

                dataSrc.post({
                    oid : 'dobookmark',
                    pageNumber : view.pageNumber,
                    pageLimit : view.pageLimit
                }, {
                    vid: view.vid,
                    vref: view.vref,
                    bookmarkfn: view.hasbookmarks,
                    search : view.search || '',
                    viewoid : view.oid,
                    bookmarkfn: 'mergeto',
                    rowdata : data,
                    ids: {}
                }, function (data) {
                    scope.rowdata = data;
                    view.pageMarked = data.pageMarked;
                    scope.$parent.refresh();
                    document.querySelector('#subject').focus();             
                });
            }

            scope.loadCardWdgData = function (view) {
                dataSrc.post({
                    oid : view.oid,
                    pageNumber : 0,
                    pageLimit : 0
                }, {
                    vid: view.vid,
                    vref: view.vref,
                    bookmarkfn: view.hasbookmarks,
                    search : view.search || '',
                }, function (panel) {
                    if (panel.acc)
                        view.acc = panel.acc;
                    else
                        view.acc = { 'oid': view.oid, 'read': true, 'create': true, 'update': true, 'delete': true };
                    
                    if (panel.data) {
                        view.carddata = panel.data;
                    }
                    view.cardtype = panel.cardtype;
                    view.title = panel.title;
                    view.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                }, function (httpResponse) {
                    view.err = httpResponse.data.err;
                    inparams.scope.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                });
            };

            scope.loadSearchWdgData = function (view) {
                dataSrc.post({
                    oid : view.oid,
                    pageNumber : 0,
                    pageLimit : 0
                }, {
                    vid: view.vid,
                    vref: view.vref,
                    bookmarkfn: view.hasbookmarks,
                    search : view.search || '',
                }, function (panel) {
                    if (panel.acc)
                        view.acc = panel.acc;
                    else
                        view.acc = { 'oid': view.oid, 'read': true, 'create': true, 'update': true, 'delete': true };
                    
                    if (panel.data) {
                        view.carddata = panel.data;
                    }
                    view.title = panel.title;
                    view.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                }, function (httpResponse) {
                    view.err = httpResponse.data.err;
                    inparams.scope.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                });
            };

            scope.loadChartWdg = function (view) {
                var curdate = ($rootScope.$$childHead.currentDate?$rootScope.$$childHead.currentDate:$rootScope.$$childHead.$$nextSibling.currentDate);
                dataSrc.post({
                    oid : view.oid,
                    pageNumber : 0,
                    pageLimit : 0
                }, {
                    vid: view.vid,
                    vref: view.vref,
                    currentDate: curdate,
                    search : view.search || '',
                }, function (panel) {
                    if (panel.acc)
                        view.acc = panel.acc;
                    else
                        view.acc = { 'oid': view.oid, 'read': true, 'create': true, 'update': true, 'delete': true };
                    
                    if (panel.data) {
                        view.chartdata = {
                            labels: panel.data.labels,
                            series: panel.data.series,
                        }
                        view.tabrownames = panel.data.tabrownames;
                        view.tabcolnames = panel.data.tabcolnames;
                        view.period = panel.period;
                        view.timeunit = panel.timeunit;
                        view.startDate = panel.startDate;
                        view.endDate = panel.endDate;
                        
                        switch (view.charttype) {
                            case 'line': {
                                view.chartoptions = {
                                    fullWidth: true,
                                    chartPadding: {
                                        right: 10
                                    },
                                    lineSmooth: Chartist.Interpolation.cardinal({
                                        fillHoles: true,
                                    }),
                                    low: 0
                                };
                                view.chartresponsive = {};
                            } break;
                            case 'bar': {
                                view.chartoptions = {
                                    seriesBarDistance: 10
                                };
                                view.chartresponsive = [
                                    ['screen and (max-width: 640px)', {
                                            seriesBarDistance: 5,
                                            axisX: {
                                                labelInterpolationFnc: function (value) {
                                                    return value[0];
                                                }
                                            }
                                        }]
                                ];
                            } break;
                            case 'stackedbar': {
                                view.chartoptions = {
                                    stackBars: true,
                                    axisY: {
                                        labelInterpolationFnc: function (value) {
                                            return value;
                                            //return (value / 1000) + 'k';
                                        }
                                    }
                                };
                                view.chartresponsive = [
                                ];
                                view.onDrawFn = function (data) {
                                    if (data.type === 'bar') {
                                        data.element.attr({
                                            style: 'stroke-width: 30px'
                                        });
                                    }
                                };
                            } break;
                            case 'pie': {
                                view.chartoptions = {
                                    labelInterpolationFnc: function (value) {
                                        return value[0]
                                    }
                                };
                                view.chartresponsive = [
                                    ['screen and (min-width: 640px)', {
                                            chartPadding: 30,
                                            labelOffset: 100,
                                            labelDirection: 'explode',
                                            labelInterpolationFnc: function (value) {
                                                return value;
                                            }
                                        }],
                                    ['screen and (min-width: 1024px)', {
                                            labelOffset: 80,
                                            chartPadding: 20
                                        }]
                                ];

                            } break;
                            case 'gauge': {
                                view.chartoptions = {
                                    donut: true,
                                    donutWidth: 60,
                                    startAngle: 270,
                                    total: 200,
                                    showLabel: false
                                }
                            } break;
                            case 'bpline': {
                                view.chartoptions = {
                                    high: 3,
                                    low: -3,
                                    showArea: true,
                                    showLine: true,
                                    showPoint: false,
                                    fullWidth: true,
                                    axisX: {
                                        showLabel: false,
                                        showGrid: false
                                    }
                                }
                            } break;
                            case 'hbar': {
                                view.chartoptions = {
                                    seriesBarDistance: 10,
                                    reverseData: true,
                                    horizontalBars: true,
                                    axisY: {
                                        offset: 70
                                    }
                                }
                            } break;
                        }
                    }
                    view.title = panel.title;
                    view.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                }, function (httpResponse) {
                    view.err = httpResponse.data.err;
                    inparams.scope.processdata = false;
                    if ($rootScope.$$childHead.refresh) $rootScope.$$childHead.refresh();
                });
            };
        }
    }

})
;