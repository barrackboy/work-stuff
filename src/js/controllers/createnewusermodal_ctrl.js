(function() {
  'use strict';
  angular.module('soneraiox').controller('createNewUserModalCtrl', function($modalInstance, c8yUser, c8yUserGroup, $scope) {

    $scope.createUser = function(user, groups) {
    $scope.user = user;
    user.enabled = true;
    user.devicePermissions = {};
    //Application ID hardcoded for now
    user.applications = [{
      id: 4,
      type: 'HOSTED'
    }];
    user.passwordStrength = '';

    if (user.password.length >= 8 && groups) {
      c8yUser.save($scope.user).then(
        function success(response) {
          c8yUser.detail(response.data.id).then(function (res) {
            var userDetails = res.data;
            var groupIds = [groups.group];
            c8yUserGroup.updateGroups(userDetails, groupIds);
          });
          $modalInstance.close();
          $('.alert-success').fadeIn("slow").delay(5000).fadeOut('slow');
        },
        function error(response) {
          $('.alert-danger').slideDown("fast");
        });

    }
  }

});
})();
