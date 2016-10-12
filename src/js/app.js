(function() {
    'use strict';
    var app = angular.module('soneraiox', [
        'chart.js',
        'c8y.sdk',
        'c8y.ui',
        'ngRoute',
        'ui.router',
        'ui.bootstrap',
        'leaflet-directive',
        'gridster'
    ]);

    app.config(function($routeProvider, $urlRouterProvider, $locationProvider, $stateProvider, c8yCumulocityProvider, $logProvider) {
        //cumulocity settings
        c8yCumulocityProvider.setAppKey('soneraIox');
        c8yCumulocityProvider.setBaseUrl('https://your.soneraiox.fi/');

        $logProvider.debugEnabled(false); //IF this is enabled openstreetmaps will do mouse event logs

        $urlRouterProvider.otherwise('/login');
        $stateProvider
            .state('home', {
                url: '/',
                views: {
                    '@': {
                        templateUrl: 'views/main.html',
                        controller: 'MainCtrl as main'
                    },
                    'content@home': {
                        templateUrl: 'views/sections/dashboard.html',
                        controller: 'DashboardCtrl as DashboardCtrl'
                    }
                }
            })
            .state('login', {
                url: '/login',
                views: {
                    '@': {
                        templateUrl: 'views/login.html',
                        controller: 'LoginCtrl as login'
                    }
                }
            })
            .state('home.alarms', {
                url: 'alarms',
                views: {
                    'content@home': {
                        templateUrl: 'views/sections/alarms.html',
                        controller: 'AlarmsCtrl as alarms'
                    }
                }
            })
            .state('home.devices', {
                url: 'devices',
                views: {
                    'content@home': {
                        templateUrl: 'views/sections/devices.html',
                        controller: 'DeviceCtrl as device'
                    }
                }
            })
            .state('home.users', {
                url: 'users',
                views: {
                    'content@home': {
                        templateUrl: 'views/sections/users.html',
                        controller: 'UsersCtrl as users'
                    }
                }
            })
            .state('home.rules', {
                url: 'rules',
                views: {
                    'content@home': {
                        templateUrl: 'views/sections/rules.html',
                        controller: 'MainCtrl as main'
                    }
                }
            })

        .state('home.helping', {
            url: 'helping',
            views: {
                'content@home': {
                    templateUrl: 'views/sections/helping.html',
                    controller: 'MainCtrl as main'
                }
            }
        })

        .state('home.feedback', {
            url: 'feedback',
            views: {
                'content@home': {
                    templateUrl: 'views/sections/feedback.html',
                    controller: 'MainCtrl as main'
                }
            }
        })

    }); //END OF CONFIG

})(); //END OF APP.JS