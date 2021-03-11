
app.config(function ($routeProvider) {
    $routeProvider
    .when('/dashboard/:id', {
        controller: 'DashboardCtrl',
        templateUrl: 'partials/board/board.tpl.html'
    })
    .when('/board/:vid', {
        controller: 'DashboardCtrl',
        templateUrl: 'partials/board/board.tpl.html'
    })
    .when('/user', {
        controller: 'UserCtrl',
        templateUrl: 'partials/user/user.tpl.html'
    })
    .when('/group', {
        controller: 'GroupCtrl',
        templateUrl: 'partials/group/group.tpl.html'
    })
    .when('/organ', {
        controller: 'OrganCtrl',
        templateUrl: 'partials/organ/organ.tpl.html'
    })
    .when('/access', {
        controller: 'AccessCtrl',
        templateUrl: 'partials/access/access.tpl.html'
    })
    .when('/login', {
        controller: 'LoginCtrl',
        templateUrl: 'partials/user/login.tpl.html'
    })
   .when('/ticket/:ticnum', {
        controller: 'TicketCtrl',
        templateUrl: 'partials/ticket/ticket_det.tpl.html'
    })
    .when('/employ', {
        controller: 'EmployCtrl',
        templateUrl: 'partials/test/employ.tpl.html'
    })
    .when('/tables', {
        controller: 'ViewCtrl',
        templateUrl: 'partials/view/view.tpl.html'
    })
    .when('/charts', {
        controller: 'ChartCtrl',
        templateUrl: 'partials/view/chart.tpl.html'
    })
    .when('/cards', {
        controller: 'CardCtrl',
        templateUrl: 'partials/view/card.tpl.html'
    })
    .when('/searchs', {
        controller: 'SearchCtrl',
        templateUrl: 'partials/view/search.tpl.html'
    })
    .when('/accview', {
        controller: 'AccviewCtrl',
        templateUrl: 'partials/view/accview.tpl.html'
    })
    .when('/automs', {
        controller: 'TrigCtrl',
        templateUrl: 'partials/autom/trig.tpl.html'
    })
    .when('/svcs', {
        controller: 'SvcCtrl',
        templateUrl: 'partials/autom/svc.tpl.html'
    })
    .when('/bpos', {
        controller: 'BposCtrl',
        templateUrl: 'partials/board/bpos.tpl.html'
    })
    .when('/ausr', {
        controller: 'AusrCtrl',
        templateUrl: 'partials/autom/ausr.tpl.html'
    })
    .when('/kbcateg', {
        controller: 'KbcategCtrl',
        templateUrl: 'partials/kbase/kbcateg.tpl.html'
    })
    .when('/kbase', {
        controller: 'KbaseCtrl',
        templateUrl: 'partials/kbase/kbartic.tpl.html'
    })
    .when('/kbase/:slug', {
        controller: 'KbaseCtrl',
        templateUrl: 'partials/kbase/kbartic.tpl.html'
    })
    .when('/kbasenew', {
        controller: 'KbaseCtrl',
        templateUrl: 'partials/kbase/kbnew.tpl.html'
    })

        
    .otherwise({
        redirectTo: '/dashboard/1'
    });
})


;