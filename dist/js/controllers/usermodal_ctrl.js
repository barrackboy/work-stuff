(function() {
  'use strict';
  angular.module('soneraiox').controller('userModalCtrl', function($modalInstance, c8yUser, c8yUserGroup, $scope, user, c8yInventory) {

    $scope.user = user;

    for(var i=0; i < user.groups.references.length; i++){
      var roles = [];
      roles.push(user.groups.references[i].group.name);
      if (roles.indexOf('admins') >= 0){
        $scope.userGroupValue = 2;
      }
      else if (roles.indexOf('business') >= 0){
        $scope.userGroupValue = 1;
      }
      else if (roles.indexOf('readers') >= 0){
        $scope.userGroupValue = 3;
      }

    }

    $scope.deleteUser = function(user) {
      swal({
        title: "Are you sure?",
        text: "This user will be deleted permanently!",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Yes, delete it!",
        closeOnConfirm: false
      },
      function(){
        c8yUser.remove($scope.user);
        deleteDashboardSettings(user);
        swal("Deleted!", "User has been deleted.", "success");
        $modalInstance.close();
      });
    }

    function deleteDashboardSettings (user) {
       c8yInventory.list({
         type: 'userDashboardSettings',
         owner: user,
         pageSize: 2
       }).then(function (settings) {
         if(settings && settings[0] && settings[0].id) {
           var moId = settings[0].id;
           c8yInventory.remove(moId);
         }
       });
    }


    $scope.saveUser = function (userGroupValue) {
      if(userGroupValue !== undefined){
        var groupIds = [userGroupValue];
        var userDetails = $scope.user;
        c8yUserGroup.updateGroups(userDetails, groupIds).then(function (){
          $modalInstance.close();
          $('.alert-success').fadeIn("slow").delay(5000).fadeOut('slow');
        });
      }
    }

  });

})();
