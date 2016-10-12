(function() {
'use strict';
  angular.module('soneraiox').controller('DeviceCtrl', function(
    $scope,
    c8yBase,
    $modal,
    c8yDeviceRegistration,
    c8yDevices,
    $http,
    $rootScope,
    c8yDeviceGroup,
    $timeout) {

  $scope.refreshDevicesPage = function () {
    $scope.getAllDevices();
    $scope.getAllRegisteredDevices();
    $scope.getDeviceGroups();
    $("#refreshDevices").addClass("imageRot").one('webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd animationend', function() {
        $(".fa-refresh").removeClass("imageRot");
    });
  }

  $scope.getAllDevices = function() {
    $scope.loading = true;
      c8yDevices.list().then(function(devices) {
        $scope.loading = false;
          $scope.gateways = [];
          $scope.childDevices = [];
          for (var i = 0; i < devices.length; i++) {
              if (devices[i].childDevices.references.length > 0 || devices[i].type === 'c8y_Tracker') {
                  $scope.gateways.push(devices[i]);
              } else {
                  $scope.childDevices.push(devices[i]);
              }
          }
      });
  }
  $scope.getAllDevices();

  $scope.getDeviceGroups = function () {
  c8yDeviceGroup.list().then(function (res) {
    $scope.groups = res;
  });
  }
  $scope.getDeviceGroups();

  $scope.deleteGroup = function (deviceGroupId) {
    swal({
      title: "Are you sure?",
      text: "Your will not be able to recover this group!",
      type: "warning",
      showCancelButton: true,
      confirmButtonClass: "btn-danger",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: false
    },
    function(){
      c8yDeviceGroup.detail(deviceGroupId).then(function (res) {
        var deviceGroup = res.data;
        c8yDeviceGroup.remove(deviceGroup);
        $scope.getDeviceGroups();
      });
      swal("Deleted!", "Your group has been deleted.", "success");
    });
  }

  $scope.createDeviceGroup = function () {
    var createDeviceGroupModal = $modal.open({
      animation: true,
      templateUrl: 'views/modals/createDeviceGroupModal.html',
      controller: 'deviceGroupModalCtrl as devicegroupmodal',
      size: 'lm',
    });
    createDeviceGroupModal.result.finally(function() {
        $timeout(function () {
          $scope.getDeviceGroups();
      });
    });
  }

  $scope.groupDetails = function (groupId){
    var groupDetailsModalInstance = $modal.open({
      animation: true,
      templateUrl: 'views/modals/groupDetailsModal.html',
      controller: 'groupModalCtrl as groupmodal',
      size: 'lm',
      resolve: {
        groupId: function() {
          return groupId;
        }
      }
    });
    // groupDetailsModalInstance.result.finally(function() {
    //     $timeout(function () {
    //       $scope.getAllDevices();
    //       $scope.$apply();
    //   }, 500);
    // });
  }

  $scope.registerDevice = function(devReg) {
    if(devReg !== undefined){
      var newDevice = {
          id: devReg
      };
      c8yDeviceRegistration.create(newDevice).then(pendingDevice);
    }
  }

  function pendingDevice(response) {
      $scope.deviceRegistrations.push(response.config.data);
  }

  $scope.getAllRegisteredDevices = function() {
      c8yDeviceRegistration.list().then(function(deviceRegistrations) {
          $scope.deviceRegistrations = deviceRegistrations;
      });
  }
  $scope.getAllRegisteredDevices();

  $scope.cancelRegistration = function(devReg) {
      var elementPos = getDevicePosition(devReg);
      $scope.deviceRegistrations.splice(elementPos, 1);
      c8yDeviceRegistration.cancel(devReg);
  }

  $scope.acceptDevice = function(devReg) {
      c8yDeviceRegistration.detail(devReg).then(function(res) {
          if (res.data.status === 'PENDING_ACCEPTANCE') {
              c8yDeviceRegistration.accept(devReg);
              var elementPos = getDevicePosition(devReg);
              $scope.deviceRegistrations.splice(elementPos, 1);
          }
      });
  }

  var getDevicePosition = function(devReg) {
      var elementPos = $scope.deviceRegistrations.map(function(x) {
          return x.id;
      }).indexOf(devReg);
      return elementPos;
  }

  $scope.deviceDetailsModal = function(gateway, childDevices) {
    var deviceDetailsModalInstance = $modal.open({
      animation: true,
      templateUrl: 'views/modals/deviceDetailsModal.html',
      controller: 'deviceModalCtrl as devicemodal',
      size: 'lm',
      resolve: {
        gateway: function() {
          return gateway;
        },
        childDevices: function() {
          return childDevices;
        }
      }
    });
    deviceDetailsModalInstance.result.finally(function() {
        $timeout(function () {
          $scope.getAllDevices();
      });
    });
  }

  $scope.childDeviceDetailsModal = function (childDevice) {
    var childDeviceDetailsModalInstance = $modal.open({
      animation: true,
      templateUrl: 'views/modals/childDeviceDetailsModal.html',
      controller: 'childDeviceModalCtrl as childdevicemodal',
      size: 'lm',
      resolve: {
        childDevice: function() {
          return childDevice;
        }
      }
    });
    childDeviceDetailsModalInstance.result.finally(function() {
        $timeout(function () {
          $scope.getAllDevices();
      });
    });
  }

  $scope.hoverIn = function(){
    this.hoverEdit = true;
  };

  $scope.hoverOut = function(){
    this.hoverEdit = false;
  };

});
})();
