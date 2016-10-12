(function () {
  'use strict';

  angular.module('soneraiox').factory('ChartFactory', [ChartFactory]);

  function ChartFactory() {
    return {
      createInitialChartMeasurementData
    };

    function createInitialChartMeasurementData(graphParameters) {
      return {
        fragmentType: graphParameters.fragmentType,
        childDeviceId: graphParameters.childDeviceId,
        series: graphParameters.series,
        HOURLY: createEmptyAggregatedMeasurements(),
        DAILY:  createEmptyAggregatedMeasurements(),
        measurement: {
          value: 0
        }
      };
    }

    function createEmptyAggregatedMeasurements(){
      return {
        min: undefined,
        max: undefined,
        averages: [
          []
        ],
        labels: []
      };
    }

  }
})();
