(function() {
  'use strict';

  angular.module('soneraiox').factory('CumulocityService', [
    'c8yBase',
    'c8yMeasurements',
    'c8yDevices',
    '$http',
    'aggregationTypes',
    CumulocityService
  ]);

  function CumulocityService(
    c8yBase,
    c8yMeasurements,
    c8yDevices,
    $http,
    aggregationTypes
  ) {
    return {
      fetchDevice,
      fetchDevices,
      updateSensorData,
      updateDailyAggregatedSensorData,
      updateHourlyAggregatedSensorData,
      createDeviceGatewayObject,
      getDataThroughRest
    };

    function fetchDevice(id) {
      return c8yDevices.detail(id);
    }

    function fetchDevices() {
      return c8yDevices.list();
    }

    function updateHourlyAggregatedSensorData(childDevice) {
      return updateAggregatedSensorData(childDevice, aggregationTypes.HOURLY, c8yBase.todayFilter().dateFrom, c8yBase.todayFilter().dateTo);
    }

    function updateDailyAggregatedSensorData(childDevice) {
      return updateAggregatedSensorData(childDevice, aggregationTypes.DAILY, c8yBase.timeOrderFilter().dateFrom, c8yBase.todayFilter().dateTo);
    }

    function updateAggregatedSensorData(childDevice, aggregationType, dateFrom, dateTo) {
      var query = "measurement/measurements/series?aggregationType=" + aggregationType + "&source=" + childDevice.id + "&dateFrom=" + dateFrom + "&dateTo=" + dateTo;
      return getDataThroughRest(query);
    }

    function getDataThroughRest(query) {
      var url = c8yBase.url(query);
      return $http.get(url);
    }

    function updateSensorData(childDeviceId, fragmentType) {

      var filter = angular.extend(c8yBase.timeOrderFilter(), {
        revert: true,
        reverse: true,
        fragmentType: fragmentType,
        source: childDeviceId,
        pageSize: 1
      });

      return c8yMeasurements.list(filter);
    }

    function createDeviceGatewayObject(device) {
      return {
        id: device.id,
        name: device.name,
        devices: fetchChildDevices(device.childDevices.references)
      };
    }

    function fetchChildDevices(device) {
      var childDevices = [];
      for (var i in device) {
        var child = device[i].managedObject;
        var sensorsAndSeries = fetchSupportedSeries(child.id);

        var childDeviceObject = {
          id: child.id,
          name: child.name,
          sensor: sensorsAndSeries
        };

        childDevices.push(childDeviceObject);
      }
      return childDevices;
    }

    function fetchSupportedSeries(childDeviceId) {
        var sensorsAndSeries = [];
        var query = "inventory/managedObjects/" + childDeviceId + "/supportedSeries";
        getDataThroughRest(query).success(storeSensor);
        return sensorsAndSeries;

        function storeSensor(response){
          for (var i in response.c8y_SupportedSeries){
            var sensor = {
              sensor: response.c8y_SupportedSeries[i].substring(0, response.c8y_SupportedSeries[i].indexOf('.')),
              series: response.c8y_SupportedSeries[i].substring(response.c8y_SupportedSeries[i].indexOf('.') + 1)
            };
          sensorsAndSeries.push(sensor);
          }
        }
    }

  }
})();
