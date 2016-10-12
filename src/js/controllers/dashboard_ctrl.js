(function() {
  'use strict';

  angular.module('soneraiox').controller('DashboardCtrl', [
    '$scope',
    '$modal',
    '$interval',
    'CumulocityService',
    'Converter',
    'ChartFactory',
    'aggregationTypes',
    'chartTypes',
    'c8yUser',
    'c8yInventory',
    '$http',
    '$timeout',
    DashboardCtrl
  ]);

  function DashboardCtrl(
    $scope,
    $modal,
    $interval,
    CumulocityService,
    Converter,
    ChartFactory,
    aggregationTypes,
    chartTypes,
    c8yUser,
    c8yInventory,
    $http,
    $timeout
  ) {

    $scope.aggregationType = aggregationTypes;

    $scope.currentState = "WAITING";
    $scope.settings = {};
    $scope.settings.types = chartTypes;
    $scope.charts = [];
    $scope.timers = [];

    $scope.$on(
      "$destroy",
      function(event) {
        for (var i = 0; i < $scope.timers.length; i++) {
          $interval.cancel($scope.timers[i]);
        }
      }
    );

    $scope.gridsterOptions = {
      resizable: {
        enabled: false
      },
      draggable: {
        enabled: false
      }
    };

  $scope.editDashboard = function () {
    if($scope.gridsterOptions.resizable.enabled === false && $scope.gridsterOptions.draggable.enabled === false){
      $("body").css("background-color","#D0D0D0");
      $scope.gridsterOptions.resizable.enabled = true;
      $scope.gridsterOptions.draggable.enabled = true;
      $scope.editMode = true;
    }
    else {
      $("body").css("background-color","#F7F7F7");
      $scope.gridsterOptions.resizable.enabled = false;
      $scope.gridsterOptions.draggable.enabled = false;
      $scope.editMode = false;
    }
  }

    $scope.getCurrentUser = function() {
      return c8yUser.current()
    }
    $scope.getCurrentUser().then(function(currentUser) {
      $scope.getCurrentUserDashboard(currentUser);
      $scope.user = currentUser;
    });

    $scope.saveDashboard = function() {
      if($scope.settingsId){
      var userSettings = {
        type: 'userDashboardSettings',
        chartsettings: $scope.charts,
        id: $scope.settingsId,
        timers: $scope.timers
      };
      c8yInventory.save(userSettings).then(function(){
        $('.alert-success').fadeIn("slow").delay(5000).fadeOut('slow');
      });
    }
    else {
      var createUserSettings = {
        type: 'userDashboardSettings',
        chartsettings: $scope.charts,
        timers: $scope.timers
      };
      c8yInventory.save(createUserSettings).then(function(){
        $('.alert-success').fadeIn("slow").delay(5000).fadeOut('slow');
      })
    }

    }

    $scope.getCurrentUserDashboard = function(curUser) {
        $scope.loading = true;
        c8yInventory.list({
          type: 'userDashboardSettings',
          owner: curUser.id,
          pageSize: 2
        }).then(function (settings) {
          $scope.loading = false;
          if(settings && settings[0] && settings[0].id) {
            $scope.settingsId = settings[0].id;
          }
          if(settings[0] && settings[0].chartsettings[0] && settings[0].timers){
            for (var i=0; i < settings[0].chartsettings.length; i++){
              $scope.charts.push(settings[0].chartsettings[i]);
            }
            for (var i=0; i < settings[0].timers.length; i++){
              $scope.timers.push(settings[0].timers[i]);
            }
          }
        });
      }


//Radial Gauge
    $scope.createGraph = function(graphParameters) {
      var chart = {
        id: $scope.charts.length,
        type: graphParameters.selectedChartType,
        title: graphParameters.title,
        dp: {
          min: 0,
          max: 100,
          yellowRangeMin: 75,
          yellowRangeMax: 90,
          redRangeMin: 90,
          redRangeMax: 100
        },
        posY:0,
        posX:0,
        width:widgetDefaultWidth(graphParameters.selectedChartType),
        height:widgetDefaultHeight(graphParameters.selectedChartType),
        data: []
      };
      var data = ChartFactory.createInitialChartMeasurementData(graphParameters);
      chart.data.push(data);
      $scope.charts.push(chart);
    }

    //Width is X value
    function widgetDefaultWidth (chartType) {
      if(chartType === chartTypes.ALARMS){
        return 3;
      }
      else if (chartType === chartTypes.HISTOGRAM){
        return 4;
      }
      else if (chartType === chartTypes.LINEAR_GAUGE){
        return 2;
      }
      else if (chartType === chartTypes.RADIAL_GAUGE){
        return 3;
      }
    }
    //Height is Y value
    function widgetDefaultHeight (chartType) {
      if(chartType === chartTypes.ALARMS){
        return 4;
      }
      else if (chartType === chartTypes.HISTOGRAM){
        return 2;
      }
      else if (chartType === chartTypes.LINEAR_GAUGE){
        return 1;
      }
      else if (chartType === chartTypes.RADIAL_GAUGE){
        return 3;
      }
    }

    $scope.startMeasurementUpdateTimers = function() {
      $scope.timers.push($interval($scope.getCurrentMeasurement, 8000));
      $scope.timers.push($interval($scope.getAggregatedMeasurement, 8000));
    }

    $scope.getGatewayDevices = function() {
      $scope.currentState = "LOADING";
      $scope.settings.devices = [];
      CumulocityService.fetchDevices().then(function(devices) {
        for (var i = 0; i < devices.length; i++) {
          if (devices[i].childDevices.references.length > 0) {
            CumulocityService.fetchDevice(devices[i].id).then($scope.createDeviceGatewayObject);
          }
        }
      });

      $scope.createDeviceGatewayObject = function(res) {
        var device = CumulocityService.createDeviceGatewayObject(res.data); //TODO rename $scope.settings.devices to gateways
        $scope.settings.devices.push(device);
        $scope.selectedDeviceSensors = [];
        $scope.selectedDeviceSensors.push(device.sensors);
        $scope.currentState = "OK";
      }
    }

    $scope.getCurrentMeasurement = function() {
      var visualizedDevices = getVisualizedDevices();
      angular.forEach(visualizedDevices, updateSensorData);
    }

    function updateSensorData(sensor) {
      CumulocityService.updateSensorData(sensor.id, sensor.fragmentType)
        .then($scope.onMeasurement.bind(this, sensor.id, sensor.fragmentType));
    }

    $scope.getAggregatedMeasurement = function() {
      var visualizedDevices = getVisualizedDevices();
      angular.forEach(visualizedDevices, updateChildDeviceAggregatedData);
    }

    function getVisualizedDevices(){
      var visualizedDevices = [];
      angular.forEach($scope.charts, function(chart) {
        angular.forEach(chart.data, function(measurementSubscription) {
          var device = {
            id: measurementSubscription.childDeviceId,
            fragmentType: measurementSubscription.fragmentType,
            series: measurementSubscription.series
          };
          visualizedDevices.push(device);
        });
      });
      return visualizedDevices;
    }

    $scope.onClickCreate = function() {
      var modalInstance = $scope.openModal($scope.settings);
      modalInstance.result.then($scope.createGraph);
    }

    $scope.onClickDelete = function($index) {
      $scope.charts.splice($index,1);
    }

    $scope.clearDashboard = function() {
      $scope.charts.splice(0,$scope.charts.length);
    }

    function updateHighMeasurement(measurementSubscription, values, aggregationType) {
      var max_measurement = Converter.getHighMeasurement(values.aggregatedMax);
      measurementSubscription[aggregationType].max = {
        value: max_measurement
      };
    }

    function updateLowMeasurement(measurementSubscription, values, aggregationType) {
      var min_measurement = Converter.getLowMeasurement(values.aggregatedMin);
      measurementSubscription[aggregationType].min = {
        value: min_measurement
      };
    }

    $scope.onAggregatedMeasurement = function(childDeviceId, aggregationType, response) {
      var convertedData = Converter.convertAggregatedMeasurementData(response.data);
      angular.forEach(convertedData, function(aggregatedData) {
        updateAggregatedMeasurementForAllSubscribedCharts(aggregatedData, childDeviceId, aggregationType);
      });
    }

    function updateAggregatedMeasurementForAllSubscribedCharts(aggregatedData, childDeviceId, aggregationType) {
      // TODO: suggestion: use hashmap to store chart-data instead of arrays
      // --> var measurementSubscription = chart.data[childDeviceId][childDeviceId][aggregatedData.fragmentType][aggregatedData.series]
      // ---->  instead of this 2d-forloop
      angular.forEach($scope.charts, function(chart) {
        angular.forEach(chart.data, function(measurementSubscription) {
          var chartHasSubscribed = measurementSubscription.childDeviceId === childDeviceId &&
            measurementSubscription.fragmentType === aggregatedData.fragmentType &&
            measurementSubscription.series === aggregatedData.series;
          if (chartHasSubscribed) {
            updateAggregatedMeasurements(measurementSubscription, aggregationType, aggregatedData);
          }
        });
      });
    }

    function updateAggregatedMeasurements(measurementSubscription, aggregationType, data) {
      switch (aggregationType) {
        case $scope.aggregationType.HOURLY:
          Converter.filterHourlyValuesForLast24Hours(data);
          measurementSubscription[aggregationType].labels = Converter.getHourlyLabelsForAggregatedMeasurements(data.measurementTimeStamps);
          break;
        case $scope.aggregationType.DAILY:
          Converter.filterDailyValuesForLast7Days(data);
          measurementSubscription[aggregationType].labels = Converter.getDailyLabelsForAggregatedMeasurements(data.measurementTimeStamps);
          break;
      }
      measurementSubscription[aggregationType].averages = [Converter.calculateAveragesFromAggregatedMeasurements(data)];
      measurementSubscription.unit = data.unit;
      updateHighMeasurement(measurementSubscription, data, aggregationType);
      updateLowMeasurement(measurementSubscription, data, aggregationType);
    }



    $scope.onMeasurement = function(childDeviceId, fragmentType, data) {
      if (data.length <= 0 || data[0][fragmentType] === undefined) {
        return;
      }

      var newestMeasurementOfDevice = data[0];
      for (var series in newestMeasurementOfDevice[fragmentType]) {
        var measurement = extractMeasurementForSeries(newestMeasurementOfDevice, fragmentType, series);
        updateCurrentMeasurementForSubsribedCharts(measurement, childDeviceId, fragmentType, series);
      }
    }

    function extractMeasurementForSeries(newestMeasurementOfDevice, fragmentType, series) {
      var measurement = {};
      measurement.value = newestMeasurementOfDevice[fragmentType][series].value;
      measurement.unit = newestMeasurementOfDevice[fragmentType][series].unit;
      measurement.timestamp = newestMeasurementOfDevice.time;
      measurement.sourceid = newestMeasurementOfDevice.source.id;
      return measurement;
    }

    function updateCurrentMeasurementForSubsribedCharts(measurement, childDeviceId, fragmentType, series) {
      angular.forEach($scope.charts, function(chart) {
        updateCurrentMeasurementIfChartHasSubscribed(chart, measurement, childDeviceId, fragmentType, series);
      });
    }

    function updateCurrentMeasurementIfChartHasSubscribed(chart, measurement, childDeviceId, fragmentType, series) {
      angular.forEach(chart.data, function(measurementSubscription) {
        var chartHasSubscribed = measurementSubscription.childDeviceId === childDeviceId &&
          measurementSubscription.fragmentType === fragmentType &&
          measurementSubscription.series === series;
        if (chartHasSubscribed) {
          measurementSubscription.measurement = {
            value: measurement.value
          };
        }
      });
    }

    $scope.openModal = function(settings, chart) {
      return $modal.open({
        animation: true,
        templateUrl: 'views/modals/createChartModal.html',
        controller: 'createChartModalCtrl as vm',
        size: 'lm',
        resolve: {
          settings: function() {
            return settings;
          }
        }
      });
    }

    function updateGatewayCurrentData(gateway) {
      angular.forEach(gateway.devices, updateChildDeviceCurrentData);
    }

    function updateChildDeviceCurrentData(childDevice) {
      // TODO: suggestion: instead of filtering by fragmentType one could get multiple all latest measurements for a child device at once
      //
      //      CumulocityService.updateSensorData() needs to be changed as follows:
      //           var filter = angular.extend(c8yBase.timeOrderFilter(), {
      //   revert: true,
      //   reverse: true,
      //   fragmentType: fragmentType, <- REMOVE THIS
      //   source: childDeviceId,
      //   pageSize: 1 <- This has to be changed to include multiple measurements, one measurement includes only 1 fragmentType
      // });              pageSize defines the amount of measurements that we want to get
      for (var i in childDevice.sensor) {
        updateSensorData(childDevice.id, childDevice.sensor[i].sensor);
      }
    }


    function updateGatewayAggregatedData(gateway) {
      angular.forEach(gateway.devices, updateChildDeviceAggregatedData);
    }

    function updateChildDeviceAggregatedData(childDevice) {
      CumulocityService.updateDailyAggregatedSensorData(childDevice)
        .then($scope.onAggregatedMeasurement.bind(this, childDevice.id, $scope.aggregationType.DAILY));
      CumulocityService.updateHourlyAggregatedSensorData(childDevice)
        .then($scope.onAggregatedMeasurement.bind(this, childDevice.id, $scope.aggregationType.HOURLY));
    }


    $scope.getGatewayDevices();
    $scope.startMeasurementUpdateTimers();
  }

})();
