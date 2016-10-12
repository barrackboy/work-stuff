(function() {
  'use strict';
  angular.module('soneraiox').controller('deviceModalCtrl', function(
    $modalInstance,
    c8yUser,
    c8yUserGroup,
    c8yDeviceGroup,
    $scope,
    gateway,
    childDevices,
    CumulocityService,
    c8yDevices,
    c8yBase,
    c8yDeviceControl,
    c8yInventory) {

    $scope.mapIsReady = false;

    c8yDeviceGroup.list().then(function (res) {
      $scope.groups = res;
    });

    $scope.gatewayInfo = gateway;
    $scope.gatewayChildDevices = [];



    c8yDevices.detail($scope.gatewayInfo)
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


    var singleGatewayChildDevice = $scope.gatewayInfo.childDevices.references;
    for (var i=0; i < singleGatewayChildDevice.length; i++){
      var query = "inventory/managedObjects/" + singleGatewayChildDevice[i].managedObject.id;
      CumulocityService.getDataThroughRest(query).then(function (response){
        $scope.gatewayChildDevices.push(response.data);
      });
    }

    $scope.device = {};
    $scope.group = {};

    $scope.saveGatewayDetails = function (device, group) {

      if(device && device.name !== undefined && device.name !== "{{gatewayInfo.name}}"){
        c8yDevices.save({
          id: $scope.gatewayInfo.id,
          name: device.name
        });
      }

      if (group && group.id !== undefined){
      var moId = group.id;
      var moChild = {id: $scope.gatewayInfo.id};
      c8yInventory.addChildAsset(moId, moChild);
     }

      $modalInstance.close();
    }

    $scope.restartDevice = function (gatewayId) {
      var operation = {
        deviceId: gatewayId,
        description: 'Restart',
        c8y_Restart: {}
      };
      c8yDeviceControl.create(operation);
      //TODO THIS GIVES MATCH ERROR BUT WORKS??
      $('.alert-info').fadeIn("slow").delay(5000).fadeOut('slow');
    }

    $scope.deleteDevice = function (gatewayId) {
      swal({
        title: "Are you sure?",
        text: "Remove this device?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Yes, remove it!",
        closeOnConfirm: false
      },
      function(){
        //TODO: below code doesnt reset device conf and delete credentials, so find out how to do those first.
        //Steps are 1. change configuration 2. delete credentials 3. delete device. Below one does number 3 only.
        // c8yInventory.remove(gatewayId);
        swal("Removed!", "Your device has been removed.", "success");
        $modalInstance.close();
      });
    }

  });

})();
