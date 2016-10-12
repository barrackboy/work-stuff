(function() {
  'use strict';
  angular.module('soneraiox').controller('UsersCtrl', function($scope, c8yUser, $modal, $timeout, $rootScope, $state) {

    if($rootScope.currentUserRoles.indexOf('admins') >= 0 !== true){
      $state.go("home");
    }

    $scope.refreshUserList = function() {
      $scope.loading = true;
      $(".fa-refresh").addClass("imageRot").one('webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd animationend', function() {
        $(".fa-refresh").removeClass("imageRot");
      });
      c8yUser.list().then(function(users) {
        $scope.loading = false;
        $scope.users = users;
      });
    }
    $scope.refreshUserList();

    $scope.userDetailsModal = function(user) {
      var userDetailsModalInstance = $modal.open({
        animation: true,
        templateUrl: 'views/modals/userDetailsModal.html',
        controller: 'userModalCtrl as usermodal',
        size: 'lm',
        resolve: {
          user: function() {
            return user;
          }
        }
      });
      userDetailsModalInstance.result.finally(function() {
          $timeout(function () {
            $scope.refreshUserList();
        }, 500);
      });
    }

    $scope.createNewUserModal = function() {
      var createUserModalInstance = $modal.open({
        animation: true,
        templateUrl: 'views/modals/createNewUserModal.html',
        controller: 'createNewUserModalCtrl as createusermodal',
        size: 'lm'
      });
      createUserModalInstance.result.finally(function() {
        $timeout(function () {
          $scope.refreshUserList();
          $scope.$apply();
      }, 500);
      });
    }

  });
})();
