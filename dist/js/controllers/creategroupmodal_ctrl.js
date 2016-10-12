(function() {
  'use strict';
  angular.module('soneraiox').controller('deviceGroupModalCtrl', function($modalInstance, $scope, c8yDeviceGroup, $rootScope) {

    //This modal is for creating new device group
    //Groupmodal_ctrl is for group details

    $scope.createNewDeviceGroup = function (devicegroup) {
      if (devicegroup && devicegroup.name){
        var group = {
          name: devicegroup.name,
          owner: $rootScope.currentUser.id,
          type: 'c8y_DeviceGroup'
        };
        c8yDeviceGroup.create(group);
        $modalInstance.close();
      }
    }

  });

})();
