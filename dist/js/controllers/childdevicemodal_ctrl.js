(function() {
  'use strict';
  angular.module('soneraiox').controller('childDeviceModalCtrl', function($modalInstance, $scope, childDevice, c8yDevices, c8yBase, c8yDeviceGroup, c8yInventory) {

  $scope.childDevice = childDevice;
  $scope.mapIsReady = false;

  c8yDevices.detail($scope.childDevice)
  .then(c8yBase.getResData)
  .then(function (device) {
  if(device.c8y_Position){
    angular.extend($scope, {
        center: {
          lat: device.c8y_Position.lat,
          lng: device.c8y_Position.lng,
          zoom: 15
        },
        markers: {
            device: {
                lat: device.c8y_Position.lat,
                lng: device.c8y_Position.lng,
                focus: true,
                draggable: false
            }
        },
        defaults: {
            scrollWheelZoom: false
        }
    });
    $scope.mapIsReady = true;
    }
  });


  c8yDeviceGroup.list().then(function (res) {
    $scope.groups = res;
  });

  $scope.device = {};
  $scope.group = {};

  $scope.saveChildDevice = function (device, group) {
    if(device && device.name !== undefined && device.name !== "{{childDevice.name}}"){
      c8yDevices.save({
        id: $scope.childDevice.id,
        name: device.name
      });
    }

    if (group && group.id !== undefined){
    var moId = group.id;
    var moChild = {id: $scope.childDevice.id};
    c8yInventory.addChildAsset(moId, moChild);
   }

    $modalInstance.close();
  }

  });

})();
