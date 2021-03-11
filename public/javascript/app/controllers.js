
app.controller('EmptyCtrl', function ($scope, $timeout, $location, $routeParams) {
})
.controller('MainCtrl', function ($scope, $rootScope, $resource, $timeout, $location, $window, $routeParams, dataCache, socket, dataUri, $debounce) {
    var User = $resource(dataUri + '/user/:command', { command: '@cmd' })
      , PanelViews = $resource(dataUri + '/panelviews', { oid: 'tickets' }, { 'set': { method: 'POST', isArray: true } })
      , Dashboards = $resource(dataUri + '/dashboards', {}, { 'set': { method: 'POST', isArray: true } })    
      ;

    $scope.EmptyUser = { username: '' , photo: '/api/image/aaaaaaaaaa' };
    $scope.bRunning = false;
    $rootScope.bLogged = false;
    $scope.panel = { title: '', links: [] };
    $scope.largeMenu = true;
    $scope.panelviews = [];
    $scope.selpanelviews = 'read';

    $scope.currentUser = angular.copy($scope.EmptyUser);
    $scope.currentDate = new Date();
    
    $scope.mainmenu = [];
    $scope.mainmenu[0] = dataCache.get('panelBoard');
    $scope.mainmenu[1] = dataCache.get('panelUsers');
    $scope.mainmenu[2] = dataCache.get('panelViews');
    $scope.mainmenu[3] = dataCache.get('panelAuto');
    $scope.mainmenu[4] = dataCache.get('panelKbase');
    $scope.actsubmenu = null;
    
    $scope.onPikadaySelect = function (datim) {
        $scope.currentDate = datim._d;
        $rootScope.$broadcast('currentDate', $scope.currentDate);
    }

    $scope.selectSubmenu = function (submenu, name) {
        if ($scope.actsubmenu === submenu) {
            $scope.actsubmenu = null;
        } else {
            $scope.actsubmenu = submenu;
        }
        $scope.refresh(1000);
    }

    $scope.showMessage = function (msg) {
        document.querySelector('#message-toast').MaterialSnackbar.showSnackbar({ message: msg });
    }
    
    $scope.refresh = function (timeout) {
        $debounce(function () {
            componentHandler.upgradeAllRegistered();
        }, timeout || 500);
    }
    
    $scope.$on('$viewContentLoaded', function () {
        $timeout(function () {
            try {
                componentHandler.upgradeDom();
            } catch (e) { };
        }, 500);
        $scope.refresh(1500);
    });
    
    $scope.login = function (usr, pwd) {
        var username = usr
          , param = { 'username': usr, 'password': pwd }
          , oldusername = $scope.currentUser.username;
        
        $scope.bRunning = true;
        
        var logout = User.get({ command: 'logout' }, function () {
            var login = User.save({ command: 'login' }, param, function (result) {
                $scope.bRunning = false;
                $scope.currentUser = result;
                $rootScope.bLogged = true;
                $scope.loadPanelviews();
                $window.location.href = '/#/dashboard/1';
            }, function (result) {
                $scope.bRunning = false;
                $scope.showMessage(result.data.err.message);
                $rootScope.bLogged = false;
            });
        });
    };
    
    $scope.logout = function () {
        var logout = User.get({ command: 'logout' }, function () {
            $scope.currentUser = angular.copy($scope.EmptyUser);
            $rootScope.bLogged = false;
            $scope.loadPanelviews();
            $scope.refresh();
        });
    }
    
    $scope.isLogged = function () {
        return $rootScope.bLogged;
    }

    $scope.getCurrentUser = function (callback) {
        User.get({ command: 'current' }, function (data) {
            $scope.currentUser = data;
            $rootScope.bLogged = $scope.currentUser.username || false;
            return callback(data);
        });
    }

    $scope.setPwd = function (data,callback) {
        User.save({ command: 'setpwd' }, data, function (data) {
            return callback(data);
        });
    }

    $scope.getCurrentUser(function (data) {
        $rootScope.bLogged = $scope.currentUser.username || false;
    });

    $scope.getCurrentDate = function () {
        return $scope.currentDate;
    }

    
    $scope.setPanel = function (cacheId) {
        if (typeof cacheId === 'object') {
            $scope.panel = {};
            $scope.panel.links = cacheId.links;
            $scope.panel.title = cacheId.title;
        } else {
            $scope.panel = dataCache.get(cacheId);
        }
    };
    
    
    socket.on('news', function (data) {
        console.log(data);
        socket.emit('my other event', { my: 'data' });
    });
    
    socket.on('notice', function (msg) {
        switch (msg.type) {
            case 'login':
                $scope.showMessage(msg.data);
                break;
            case 'logout':
                $scope.showMessage(msg.data);
                break;
            case 'timeout':
                $scope.showMessage(msg.data);
                if ($scope.user.username === msg.data.username) {
                    $scope.user = { username: '' };
                    $rootScope.bLogged = false;
                }
                break;
            case 'Mailer':
                if ($rootScope.bLogged) $scope.showMessage('Message: ' + msg.data.subject);
                break;
            case 'Service':
                if ($rootScope.bLogged) $scope.showMessage('Service: ' + msg.data.subject);
                break;
            default:
                if ($rootScope.bLogged) $scope.$broadcast(msg.type, msg.data);
        }
    });
    
    $scope.showDrawer = function () {
        var elem = document.querySelector('.mdl-layout__drawer-right');
        if (angular.element(elem).hasClass('drawer-right-active'))
            angular.element(elem).removeClass('drawer-right-active');
        else
            angular.element(elem).addClass('drawer-right-active');
    };
    $scope.hideDrawer = function () {
        var elem = document.querySelector('.mdl-layout__drawer-right');
        if (angular.element(elem).hasClass('drawer-right-active')) {
            angular.element(elem).removeClass('drawer-right-active');
        }
    };

    $scope.loadPanelviews = function () {
        $scope.panelviews = [];
        PanelViews.set({oid:'tickets'},function (data) {
            $scope.panelviews = data;
        });

        $scope.mainmenu[0].links = [];
        Dashboards.set({ oid: 'tickets' }, function (data) {
            $scope.mainmenu[0].links = data;
        });
    }
    
    $scope.loadPanelviews();
})

.controller('LoginCtrl', function ($scope) {
    $scope.$parent.setPanel('', []);
    $scope.login = function () {
        $scope.$parent.bRunning = true;
        if ($scope.form.$invalid) {
            angular.forEach($scope.form.$error, function (field) {
                angular.forEach(field, function (errorField) {
                    errorField.$setTouched();
                })
            });
            $scope.$parent.bRunning = false;
            $scope.$parent.showMessage('Form is invalid.');
        } else {
            $scope.$parent.login(this.data.username, this.data.password);
        }
    };


})

.controller('EmployCtrl', function ($scope, $timeout, $location, $routeParams, dataSet) {
    $scope.$on('user-login', function (event, data) {
        var x;
    });
    $scope.$on('user-logout', function (event, data) {
        var x;
    });
    
    $scope.$parent.setPanel('panelEmploy');
    
    dataSet.dataList({ oid: 'users', uri: 'employ/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'users', uri: 'employ', scope: $scope, dset: dataSet });
})

.controller('UserCtrl', function ($scope, $timeout, $location, $routeParams, $http, dataSet, dataCache, dataUri, Upload, boardSrc) {
    $scope.ticketview = {
        oid: 'usertickets',
        acid: 'users',
        pageLimit: 30
    };
    $scope.userTypes = dataCache.get('userType');
    $scope.detailtype = "detail";
    $scope.$parent.setPanel('panelUsers');
    dataSet.dataList({ oid: 'users', uri: 'user/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'users', uri: 'user', scope: $scope, dset: dataSet });
    $scope.currentUser = {};

    $scope.$parent.getCurrentUser(function (user) {
        $scope.currentUser = user;
    });
    
    $scope.register = function () {
        dataSet.newItem('user/register', { 'acid': 'users', 'username': $scope.rowdata.username, 'password': $scope.rowdata.password }).then(function (data) {
            $scope.items = []
            $scope.items[0] = data.items;
            $scope.items[0]['_expanded'] = false;
            $scope.expandedNew = false;
            $scope.panel.search = data.items.username;
        });
    };

    $scope.setUsertype = function () {
        angular.forEach($scope.userTypes, function (value, key) {
            if (value.code === $scope.rowdata.role) {
                $scope.rowdata.usertype = value.type;
            }
        });
    };
     
    $scope.upload = function (id, file, elem) {
        Upload.dataUrl(file, true).then(function (dataurl) {
            $http({
                method: 'PUT', 
                url: dataUri + '/image/' + id, 
                headers: { 'Content-Type': 'application/json' },
                data: { filename: file.name, type: file.type, data: dataurl }
            }).success(function (result) {
                $scope.setRnd();
            });
        });
    };

    $scope.setRnd = function () {
        var d = new Date();
        $scope.random = d.getMilliseconds();
    };

    $scope.setRnd();

    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm;
        $scope.panelCmd('refresh');
    };

    $scope.showDetailType = function (type) {
        $scope.detailtype = type;
        $scope.$parent.refresh();
    };

    $scope.canChangePwd = function (username) {
        return $scope.currentUser.usertype === 'admins' || username === $scope.currentUser.username;
    }

    $scope.changePassword = function (item){
        $scope.$parent.setPwd({
            username: $scope.rowdata.username,
            password: $scope.rowdata.password
        },function (result) {
            $scope.$parent.showMessage(result.message);
            $scope.closeDetail(item);
        });
    }

    $scope.showTickets = function () {
        
        if (!$scope.showHideToggle) {
            var target, content;
            target = document.querySelector('#modalview');
            content = target.querySelector('#modalview_content');
            
            content.style.border = '1px solid rgba(0,0,0,0)';
            content.style.border = 0;
            target.style.visibility = 'visible';
            angular.element(target).parent().addClass('blur-content');
        }
        $scope.ticketview.title = 'Tickets of ' + $scope.rowdata.username,
        $scope.loadViewData($scope.ticketview, {username: $scope.rowdata.username });
    };

    boardSrc.initTableData($scope);
    $scope.iniTableViewData($scope.ticketview);
})

.controller('GroupCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, dataCache, dataRes) {
    $scope.qparam = '';
    $scope.userTypes = dataCache.get('userType');
    $scope.$parent.setPanel('panelUsers');
    dataSet.dataList({ oid: 'users', uri: 'group/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'users', uri: 'group', scope: $scope, dset: dataSet });
    

    $scope.setRnd = function () {
        var d = new Date();
        $scope.random = d.getMilliseconds();
    }
    $scope.setRnd();

    $scope.organiz = [];
    dataRes.post({ oid : 'group', cmd: 'organs' }, {
        acid : 'users',
    }).$promise.then(function (data) {
        $scope.organiz = data;
    });

    $scope.agents = [];
    dataRes.post({ oid : 'group', cmd: 'agents' }, {
        acid : 'users',
    }).$promise.then(function (data) {
        $scope.agents = data;
    });
    $scope.toggleAgent = function (code) {
        if (!$scope.rowdata.agents) $scope.rowdata.agents = [];
        if ($scope.rowdata.agents.indexOf(code) === -1) {
            $scope.rowdata.agents.push(code);
        } else {
            $scope.rowdata.agents.splice($scope.rowdata.agents.indexOf(code), 1);
        }
    };
    $scope.findByKeyValue = findByKeyValue;

    $scope.setQueryParam = function(itm) {
        $scope.qparam = (itm?itm.name:'');
        $scope.panelCmd('refresh');
    };
})

.controller('OrganCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, dataCache, dataRes, boardSrc) {
    $scope.ticketview = {
        acid: 'users',
        pageLimit: 30
    };

    $scope.userTypes = dataCache.get('userType');
    $scope.$parent.setPanel('panelUsers');
    dataSet.dataList({ oid: 'users', uri: 'organ/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'users', uri: 'organ', scope: $scope, dset: dataSet });
    $scope.setRnd = function () {
        var d = new Date();
        $scope.random = d.getMilliseconds();
    }
    $scope.setRnd();
    
    $scope.usergroups = [];
    dataRes.post({ oid : 'group', cmd: 'grps' }, {
        acid : 'users',
    }).$promise.then(function (data) {
        $scope.usergroups = data;
    });

    $scope.profiles = [];
    dataRes.post({ oid : 'organ', cmd: 'profiles' }, {
        acid : 'users',
    }).$promise.then(function (data) {
        $scope.profiles = data;
    });

    $scope.showTickets = function () {      
        if (!$scope.showHideToggle) {
            var target, content;
            target = document.querySelector('#modalview');
            content = target.querySelector('#modalview_content');
            
            content.style.border = '1px solid rgba(0,0,0,0)';
            content.style.border = 0;
            target.style.visibility = 'visible';
            angular.element(target).parent().addClass('blur-content');
        }
        $scope.ticketview.title = 'Tickets of '+ $scope.rowdata.name,
        $scope.ticketview.oid = 'usertickets',
        $scope.loadViewData($scope.ticketview, { organ: $scope.rowdata.name });
    };
    $scope.showUsers = function () {      
        if (!$scope.showHideToggle) {
            var target, content;
            target = document.querySelector('#modalview');
            content = target.querySelector('#modalview_content');
            
            content.style.border = '1px solid rgba(0,0,0,0)';
            content.style.border = 0;
            target.style.visibility = 'visible';
            angular.element(target).parent().addClass('blur-content');
        }
        $scope.ticketview.title = 'Users of '+ $scope.rowdata.name,
        $scope.ticketview.oid = 'organusers',
        $scope.loadViewData($scope.ticketview, { organ: $scope.rowdata.name });
    };
    
    boardSrc.initTableData($scope);
    $scope.iniTableViewData($scope.ticketview);

})

.controller('AccessCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, dataCache) {
    $scope.userTypes = dataCache.get('userType');
    $scope.$parent.setPanel('panelUsers');
    dataSet.dataList({ oid: 'users', uri: 'access/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'users', uri: 'access', scope: $scope, dset: dataSet });
    
    $scope.changeAccess = function (acc, utype, value) {
        var index;
        acc.cando = acc.cando || [];
        index = acc.cando.indexOf(utype);
        
        if (index >= 0)
            acc.cando.splice(index, 1);
        if (value) {
            acc.cando.push(utype);
        }
    };
})

.controller('ViewCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelViews');
    dataSet.dataList({ oid: 'tickets', uri: 'view/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'tickets', uri: 'view', scope: $scope, dset: dataSet });
    
    $scope.rowdataEmpty = {
        name: '', anyof: [], allof: [], fields: [], grpflds: [], srtflds: []
    };
    
    boardSrc.initViewData($scope);
    
    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm;
        $scope.panelCmd('refresh');
    };

})

.controller('CardCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelViews');
    dataSet.dataList({ oid: 'tickets', uri: 'card/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'tickets', uri: 'card', scope: $scope, dset: dataSet });
    

    boardSrc.initCardData($scope);
    boardSrc.initViewData($scope,'');
    

})

.controller('SearchCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelViews');
    dataSet.dataList({ oid: 'tickets', uri: 'searchs/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'tickets', uri: 'searchs', scope: $scope, dset: dataSet });

    $scope.rowdataEmpty = {
        name: '', fields: []
    };
 

    boardSrc.initViewData($scope);
    

})

.controller('ChartCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelViews');
    dataSet.dataList({ oid: 'tickets', uri: 'chart/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'tickets', uri: 'chart', scope: $scope, dset: dataSet });
    $scope.seldataset = {};
    $scope.curDatasetLabel = "";
    
    $scope.rowdataEmpty = {
        name: '', charttype: '', period: '', timeunit: '', datasets: []
    };
    $scope.DatasetEmpty = {
        label: '', anyof: [], allof: [], start: '', field: '', group: '', accumfn: '', grpflds: [], srtflds: []
    };
    
    boardSrc.initViewData($scope, '');
    
    $scope.pressKey = function (keyEvent) {
        if (keyEvent.which === 13) {
            if ($scope.seldataset) {
                $scope.seldataset.label = document.querySelector('#curDatasetLabel').value;
                $scope.$parent.refresh();
            }
        }
    }
    
    $scope.clearGroupval = function () {
        if ($scope.seldataset && !$scope.seldataset.groupval) {
            $scope.seldataset.field = '';
        }
    }
    
    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm;
        $scope.panelCmd('refresh');
    };
})

.controller('AccviewCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, dataCache) {    
    $scope.viewTypes = dataCache.get('viewType');
    $scope.$parent.setPanel('panelViews');
    dataSet.dataList({ oid: 'tickets', uri: 'accview/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'tickets', uri: 'accview', scope: $scope, dset: dataSet });
    
    $scope.rowdataEmpty = {
        name: '', access: {
            acclient: 'clusr',
            acagent: 'agusr',
            privcomm: true
        }
    };
    
    $scope.changeAccess = function (acc, utype, value) {
        var index;
        acc.cando = acc.cando || [];
        index = acc.cando.indexOf(utype);
        
        if (index >= 0)
            acc.cando.splice(index, 1);
        if (value) {
            acc.cando.push(utype);
        }
    };
    
    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm?itm.code:null;
        $scope.panelCmd('refresh');
    };
})

.controller('TrigCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelAuto');
    dataSet.dataList({ oid: 'autom', uri: 'autotrg/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'autom', uri: 'autotrg', scope: $scope, dset: dataSet });
    
    $scope.rowdataEmpty = {
        name: '', active: false, anyof: [], allof: [], fields: []
    };
    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm;
        $scope.panelCmd('refresh');
    };
    boardSrc.initViewData($scope);
})

.controller('SvcCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelAuto');
    dataSet.dataList({ oid: 'autom', uri: 'autosvc/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'autom', uri: 'autosvc', scope: $scope, dset: dataSet });
    
    $scope.rowdataEmpty = {
        name: '', active: false, anyof: [], allof: [], fields: []
    };
    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm;
        $scope.panelCmd('refresh');
    };
    boardSrc.initViewData($scope);
})

.controller('AusrCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelViews');

    dataSet.dataList({ oid: 'tickets', uri: 'autousr/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'tickets', uri: 'autousr', scope: $scope, dset: dataSet });
    
    $scope.rowdataEmpty = {
        name: '', active: false, shared: false , fields: []
    };
    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm;
        $scope.panelCmd('refresh');
    };
    boardSrc.initViewData($scope,'nomsg');
})

.controller('TicketsCtrl', function ($scope, $sce, $q, $http, $timeout, dataPanel, dataCache, dataSrc) {
    $scope.$parent.setPanel('panelBoard');
    $scope.accid = 'users';
    
    $scope.optassignee = [];
    $scope.optrequester = [];
    $scope.optpriority = dataCache.get('optpriority');
    $scope.optservice = dataCache.get('optservice');
    $scope.optrequital = dataCache.get('optrequital');
    $scope.opttime = dataCache.get('opttime');
    $scope.opttransp = dataCache.get('opttransp');
    $scope.ticstatus = dataCache.get('ticstatus');
    
    dataSrc.postquery({
        oid : 'optassignee'
    }, {
        acid : $scope.accid
    }, function (data) {
        $scope.optassignee = data;
    });
    
    dataSrc.postquery({
        oid : 'optrequester'
    }, {
        acid : $scope.accid, search : ''
    }, function (data) {
        $scope.optrequester = data;
    });
    
    dataPanel.add($scope, 'panel1', 'ticket', $scope.accid, 20);
    dataPanel.add($scope, 'panel2', 'employ', $scope.accid, 5);
    dataPanel.add($scope, 'panel3', 'employ', $scope.accid, 5);
    dataPanel.add($scope, 'panel4', 'employ', $scope.accid, 5);
    
    $scope.showdetail = false;
    $scope.showdetails = [];
    
    $scope.rowdata = {};
    $scope.rowdata.requester = " ";
    $scope.rowdata.requestcc = " ";
    $scope.rowdata.requestbc = " ";
    $scope.rowdata.subject = " ";
    $scope.rowdata.description = " ";
    $scope.rowdata.assignee = " ";
    $scope.rowdata.priority = " ";
    $scope.rowdata.dueDate = " ";
    $scope.rowdata.service = " ";
    $scope.rowdata.time = 0;
    $scope.rowdata.transport = 0;
    $scope.rowdata.purchase = 0;
    $scope.rowdata.price = 0;
    $scope.rowdata.requital = " ";
        

    $scope.showDetail = function (idItem) {
        
        var show = !$scope.showdetails[idItem] || false;
        angular.forEach($scope.showdetails, function (item, key) {
            if (key !== idItem && item === show) {
                $scope.showdetails[key] = !show;
            }
        });
        $timeout(function () {
            $scope.showdetails[idItem] = show;
            $scope.$parent.refresh();
        }, 200);
    }
    $scope.getShowDetail = function (idItem) {
        return $scope.showdetails[idItem]
    }
    
    
    
    
    
    
    function suggest_state(term) {
        var q = term.toLowerCase().trim();
        var results = [];
        
        for (var i = 0; i < $scope.optrequester.length && results.length < 10; i++) {
            var state = $scope.optrequester[i].key;
            if (term && state.toLowerCase().indexOf(q) >= 0 || term === undefined)
                results.push({ label: '"' + $scope.optrequester[i].name + '"   ' + $scope.optrequester[i].key  , value: $scope.optrequester[i].key });
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
    
    $scope.autocomplete_options = {
        suggest: suggest_state_with_highlight,
        do_select: select_email
    };
    
    
    
    $scope.fopttime_dectype = true;
    $scope.fopttime = function (itm) {
        return itm.dec === $scope.fopttime_dectype;
    }
    $scope.applyDropValue = function (objname, value) {
        assignPropertyValue($scope, objname, value);
        if (objname === 'rowdata.service') {
            $scope.fopttime_dectype = value === 'helpdesk';
        }
        if ($scope.dropfocus_ids) {
            document.querySelector('#' + $scope.dropfocus_ids[objname]).focus();
        }
    };
    
    $scope.OpenTicket = function (index) {
        $scope.rowdata = {};
        $timeout(function () {
            $scope.rowdata = angular.copy($scope.panels.panel1.items[index]);
            $scope.rowdata.dueDate = moment($scope.rowdata.dueDate).format("DD.MM.YYYY");
            document.querySelector('#subject').focus();
        }, 500);
    }




})

.controller('BposCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelViews');
    //$scope.accid = 'tickets';
    //boardSrc.loadBoardLinks($scope);
    
    dataSet.dataList({ oid: 'tickets', uri: 'bpos/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'tickets', uri: 'bpos', scope: $scope, dset: dataSet });
    
    $scope.rowdataEmpty = {
        name: '', type: '', position: []
    };
    $scope.setQueryParam = function (itm) {
        $scope.qparam = itm;
        $scope.panelCmd('refresh');
    };
    $scope.selViewType = function (item,rowdata) {
        if (item.$ref === 'View' && !rowdata.size) {
            rowdata.size = "9999";
        }
    };
    
    boardSrc.initBpos($scope);
    
    $scope.selDataRef = function (view, options) {
        angular.forEach(options, function (opt, key) {
            if (opt.objref.$id === view.$id) {
                view.$ref = opt.objref.$ref;
                view.$id = opt.objref.$id;
                view.$db = opt.objref.$db;
            }
        });
    }
})

.controller('DashboardCtrl', function ($scope, $timeout, $sce, boardSrc, dataSrc) {    
    boardSrc.initBoardData($scope);
})

.controller('TicketCtrl', function ($scope, $timeout, $sce, Ticket, dataSrc) {
    /*
    //$scope.$parent.refresh();

    $scope.$parent.setPanel('', []);
    //$scope.$parent.setPanel('panelBoard');
    
    $scope.rowdata = {};
    $scope.rowdata.requester = "qwd@efewfrreqgbte.sk";
    $scope.rowdata.subject = "Testovaci zaznam";
    $scope.rowdata.description = '<h3>Lorem ipsum</h3><p><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perferendis enim illum, iure cumque amet. Eos quisquam, nemo voluptates. Minima facilis, recusandae atque ullam illum quae iure impedit nihil dolorum hic?</p><ol><li>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vitae ex repudiandae ratione, autem? Nulla voluptatem et soluta dolores facilis reiciendis, porro repudiandae, aperiam commodi minima repellat voluptas dignissimos corrupti itaque.</li><li>Quisquam cupiditate odit voluptatem eum quibusdam modi, facilis.</li><li>Obcaecati molestias quisquam numquam deserunt nobis recusandae perferendis.</li><li>Totam sequi quam omnis fuga, laboriosam suscipit libero.</li></ol></p>';
    $scope.rowdata.assignee = 'third';
    $scope.rowdata.priority = 'third';
    $scope.rowdata.dueDate = ' ';
    $scope.rowdata.service = 'third';
    $scope.rowdata.time = "1,2";
    $scope.rowdata.transport = 0;
    $scope.rowdata.purchase = 0;
    $scope.rowdata.price = 0;
    $scope.rowdata.requital = 'third';
    
    $scope.arr = ['first', 'second', 'third', 'fourth', 'fifth'];
    
    $scope.itemArray = [
        { id: 1, name: 'first' },
        { id: 11, name: 'first1' },
        { id: 12, name: 'first2' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' },
        { id: 4, name: 'fourth' },
        { id: 5, name: 'fifth' },
    ];
    
    $scope.selected = { value: $scope.itemArray[0] };
    
    $scope.onPikadaySelect = function (datim) {
        $scope.rowdata.dueDate = '1.1.2000';
    }
    //$scope.val = 0;
    //$scope.inc = function () {
    //    $debounce(increase, 5000);
    //};
    
    //var increase = function () {
    //    $scope.val++;
    //}   
    
    
    //---------------------------------------------------------------------------------------------
    //$scope.tagValues = {};
    //$scope.tagValues["host"] = ["host1", "host2", "host3"];
    
    //$scope.tagOptions = {};
    //$scope.tagOptions["host"] = {
    //    suggest: function (term) {
    //        return $scope.suggestTagValues(term, "host");
    //    }
    //};
    
    //$scope.tag_options_fn = {
    //    options: function (key) {
    //        return $scope.tagOptions[key];
    //    }
    //};
    
    function suggest_state(term) {
        var q = term.toLowerCase().trim();
        var results = [];
        
        for (var i = 0; i < $scope.itemArray.length && results.length < 10; i++) {
            var state = $scope.itemArray[i].name;
            if (term && state.toLowerCase().indexOf(q) >= 0 || term === undefined)
                results.push({ label: state, value: $scope.itemArray[i].id });
        }
        
        return results;
    }
    
    function highlight(str, term) {
        var highlight_regex = new RegExp('(' + term + ')', 'gi');
        return str.replace(highlight_regex,
    '<span class="ac-highlight">$1</span>');
    };
    
    function suggest_state_with_highlight(term) {
        if (term.length < 2)
            return;
        
        var suggestions = suggest_state(term);
        suggestions.forEach(function (s) {
            // In real life you should reuse the regexp object.
            s.label = $sce.trustAsHtml(highlight(s.label, term));
        });
        
        return suggestions;
    };
    
    $scope.autocomplete_options = {
        suggest: suggest_state_with_highlight
    };
*/ 
})

.controller('KbcategCtrl', function ($scope, $timeout, $location, $routeParams, dataSet, boardSrc) {
    $scope.$parent.setPanel('panelKbase');
    dataSet.dataList({ oid: 'users', uri: 'kbcateg/:pageNumber/:pageLimit', scope: $scope, dset: dataSet });
    dataSet.dataUpdate({ oid: 'users', uri: 'kbcateg', scope: $scope, dset: dataSet });
    
    $scope.rowdataEmpty = {
        name: ''
    };
})

.controller('KbaseCtrl', function ($scope, $timeout, $location, $routeParams, $q, dataSrc, Upload) {
    $scope.$parent.setPanel('panelKbase');
    $scope.detail = null;
    $scope.newlist = [];
    $scope.catlist = [];

    dataSrc.post({ oid : 'kbase', cmd: 'kbnew' }, {
        acid : 'users',
    }, function (data) {
        $scope.newlist = data.items;
    });
    dataSrc.post({ oid : 'kbase', cmd: 'catlist' }, {
        acid : 'users',
    }, function (data) {
        $scope.catlist = data.items;
    });

    $scope.pressKey = function (keyEvent) {
        if (keyEvent.which === 13) {
            $scope.load();
        }
    }

    $scope.load = function (){
        if ($scope.panel) $scope.panel.detail = null;

        if ($routeParams.slug) {
            dataSrc.post({ oid : 'kbase', cmd: 'detail' }, {
                acid : 'users',
                slug : $routeParams.slug,
            }, function (data) {
                $scope.panel['detail'] = data.items;
            });

        } else {
            dataSrc.post({ oid : 'kbase', cmd: 'search' }, {
                acid : 'users',
                search : $scope.panel.search,
            },function (data) {
                $scope.panel['items'] = data.items;
            });
        }
    }

    $scope.newArticle = function (cat){
        $scope.detail = {
            refCateg: cat._id,
            acid: 'users'
        };

        $timeout(function () {
            document.querySelector('#dettitle').focus();
        }, 500);
    }
    $scope.updArticle = function (article){
        $scope.detail = article;

        $timeout(function () {
            document.querySelector('#dettitle').focus();
        }, 500);
    }

    $scope.saveArticle = function (afiles) {
        $scope.attachFiles(afiles).then(function (attachfiles) {
            $scope.detail.acid = 'users';
            $scope.detail.attachfiles = attachfiles;

            dataSrc.post({
                oid : 'updarticle'
            }, $scope.detail, function (data) {

                if (!$scope.detail._id)
                    $location.path('/kbase/' + data.items[0].slug);
                else
                    $scope.panel['detail'] = data.items;
                
                if ($scope.slideUpToggle) {
                    var target = document.querySelector('#kbdetail'), content = target.querySelector('#kbdetail_content');
                    target.style.top = '100%';
                    angular.element(target).parent().removeClass('blur-content');
                }
            });
            
            $scope.$parent.refresh();
        }, function (err) { 
        });
    }
    
    $scope.delArticle = function (data) {
        dataSrc.post({
            oid : 'delarticle',
            id : data._id
        }, { acid : 'users' }, function (data) {
            $location.path('/kbase');
        });
    }
    

    $scope.newComment = function (art) {
        $scope.detail = {
            aid: art._id,
            aslug: art.slug,
            acid: 'users'
        };
        
        $timeout(function () {
            document.querySelector('#dettitle').focus();
        }, 500);
    }

    $scope.updComment = function (art,comment) {
        $scope.detail = comment;
        $scope.detail.aid = art._id;
        $scope.detail.aslug = art.slug;
        $scope.detail.acid = 'users';
    
        $timeout(function () {
            document.querySelector('#dettitle').focus();
        }, 500);
    }

    $scope.saveComment = function (afiles) {
        $scope.attachFiles(afiles).then(function (attachfiles) {
            $scope.detail.attachfiles = attachfiles;

            dataSrc.post({
                oid : 'updcomment'
            }, $scope.detail, function (data) {
                $scope.panel['detail'] = data.items;
                if ($scope.slideUpToggle) {
                    var target = document.querySelector('#kbcdetail'), content = target.querySelector('#kbdetail_content');
                    target.style.top = '100%';
                    angular.element(target).parent().removeClass('blur-content');
                }
            });
            $scope.$parent.refresh();
        }, function (err) { 
        });

    }

    $scope.delComment = function (data) {
        dataSrc.post({
            oid : 'delcomment',
            id : data.comment._id
        }, { acid : 'users', aslug: data.article.slug,aid: data.article._id }, function (data) {
            $scope.panel['detail'] = data.items;
        });
    }
    
    $scope.files = [];
    $scope.delAttachment = function (index) {
        $scope.files.splice(index, 1);
    }   
    $scope.getFileicon = function (filename) {
        return 'images/fileicons/' + filename.split('.').pop() + '.png';
    }
    $scope.attachFiles = function (afiles) {
        var promises = []
              , attachfiles = [];
        if (afiles && afiles.length) {
            angular.forEach(afiles, function (file) {
                promises.push(Upload.base64DataUrl(file, true).then(function (blob) {
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

    $scope.newKbItem = function (newitem) {
        $scope.detail = newitem;
        $scope.detail.acid = 'users';
        
        $timeout(function () {
            document.querySelector('#detname').focus();
        }, 500);
    }

    $scope.saveNewKbItem = function () {
        dataSrc.post({
            oid : 'savenewkbitem'
        }, $scope.detail, function (data) {
            $scope.newlist = data.items;
            if ($scope.slideUpToggle) {
                var target = document.querySelector('#kbdetail'), content = target.querySelector('#kbdetail_content');
                target.style.top = '100%';
                angular.element(target).parent().removeClass('blur-content');
            }
            $scope.$parent.refresh();
        });
    }
 

    $scope.load();
})




;