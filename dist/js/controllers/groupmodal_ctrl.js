(function() {
  'use strict';
  angular.module('soneraiox').controller('groupModalCtrl', function($modalInstance, $scope, c8yDeviceGroup, groupId, c8yDevices, c8yInventory, $timeout) {

    //This controller is for device group details and actions

    $scope.getDeviceGroups = function () {
    c8yDeviceGroup.detail(groupId).then(function (res) {
      $scope.group = res.data;
    });
    }
    $scope.getDeviceGroups();

    $scope.deleteDeviceFromGroup = function (deviceId, groupId) {
      swal({
        title: "Are you sure?",
        text: "Remove device from this group?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Yes, remove it!",
        closeOnConfirm: false
      },
      function(){
        var moChild = {id: deviceId};
        c8yInventory.removeChildAsset(groupId, moChild).then(function (){
          $timeout(function () {
            $scope.getDeviceGroups();
          });
          swal("Removed!", "Your device has been removed from the group.", "success");
        });
      });
    }

  });

})();
