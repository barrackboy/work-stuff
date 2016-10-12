(function () {
  'use strict';

  angular.module('soneraiox').controller('MainCtrl', function($location, $routeParams, $state, c8yUser, c8yApplication, $scope, $rootScope){

    $scope.init = function(){
      $scope.state = $state.current.name;
      $scope.filter = {};

      c8yUser.current().then(function (user) {
        $rootScope.currentUser = user;
        $rootScope.currentUserRoles = [];
        for (var i=0; i < user.groups.references.length; i++){
          $rootScope.currentUserRoles.push(user.groups.references[i].group.name);
        }
        $rootScope.isReader = false;
        if ($rootScope.currentUserRoles.length === 1 && $rootScope.currentUserRoles.indexOf("readers") >=0){
          $rootScope.isReader = true;
        }

      });

      c8yUser.current().catch(function () {
        $location.path('/login');
      });

      c8yApplication.getCurrent().then(function (currentApplication) {
        //TODO hardcoded for now, current application returns an empty object for some reason
        var applicationId = 4;
        c8yApplication.detail(applicationId).then(function (res) {
          $scope.currentApplication = res.data;
          $scope.createApplicationList();
        });
      });

    };

    //Sidebar logic
    $scope.showSideBar = function () {
      $('.sidebar').animate({width:'toggle'},150);
    }
    //Sidebar logic
    $(window).resize(function(){
      if ($(window).width() > 768){
        $('.sidebar').show();
      }
      if ($(window).width() < 768){
        $('.sidebar').hide();
      }
    });

    $scope.createApplicationList = function(){
      c8yApplication.list().then(function (applications) {
        $scope.applications = [];
        applications.forEach(function (app) {
          if (!app.manifest.noAppSwitcher && app.id != $scope.currentApplication.id){
            $scope.applications.push(app);
          }
        });
      });
    };

    $scope.logout = function () {
      $location.path('/login');
    };

    $scope.init();
  });

})();
