(function() {
  'use strict';

  angular.module('soneraiox')
  .constant('aggregationTypes', {
    HOURLY: "HOURLY",
    DAILY : "DAILY"
  })
  .constant('chartTypes', {
    HISTOGRAM    : "Graph",
    LINEAR_GAUGE : "Cumulocity Linear Gauge",
    RADIAL_GAUGE : "Cumulocity Radial Gauge",
    ALARMS : 'Alarms'
  });

})();
