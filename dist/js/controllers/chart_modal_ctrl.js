(function() {
'use strict';
angular.module('soneraiox').controller('createChartModalCtrl', function($modalInstance, $scope, settings, chartTypes) {

  $scope.settings = settings;
  $scope.enableAllSensorsSelection = false;

  $scope.state = {
      CHART_TYPE: 0,
      DEVICEGW: 1,
      DEVICE: 2,
      NAME: 3,
      SENSOR: 4
  };

 $scope.currentState = $scope.state.CHART_TYPE;

  $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
  }

  $scope.ok = function () {
      var choice = {
          childDeviceId: $scope.selectedDevice,
          fragmentType: $scope.fragmentType,
          series: $scope.series,
          selectedChartType: $scope.selectedChartType,
          title: this.chartName
      };
      $modalInstance.close(choice);
  }

  $scope.selectChartType = function (type) {
      $scope.selectedChartType = type;
      if (type === chartTypes.HISTOGRAM) {
          $scope.enableAllSensorsSelection = true;
      }
      if (type === chartTypes.ALARMS){
        $scope.currentState = $scope.state.NAME;
      }
      else {
        $scope.currentState = $scope.state.DEVICEGW;
      }
  }

  $scope.selectDeviceGW = function (device) {
      $scope.selectedDeviceGW = device;
      $scope.currentState = $scope.state.DEVICE;
  }

  $scope.selectDevice = function (deviceId, device) {
      $scope.selectDeviceName = device.name;
      $scope.selectedDeviceSensors = device.sensor;
      $scope.selectedDevice = deviceId;
      $scope.currentState = $scope.state.SENSOR;
  }

  $scope.selectSensor = function (series, sensor) {
      $scope.series = series;
      $scope.fragmentType = sensor;
      $scope.currentState = $scope.state.NAME;
  }

  $scope.selectAllSensorsForSelectedDevice = function () {
      $scope.device = $scope.selectedDevice;
      $scope.currentState = $scope.state.NAME;
  }

});

})();
