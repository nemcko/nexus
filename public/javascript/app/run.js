
app.run(['$rootScope', '$location', function ($rootScope, $location) {
        $rootScope.$on('$routeChangeStart', function (event) {
            
            if (!$rootScope.bLogged) {
                $location.path('/login');
            }
        });
    }])


;