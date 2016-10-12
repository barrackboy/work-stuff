(function () {
  'use strict';
 angular.module('soneraiox').directive('radialGauge', [radialGauge]);

  function radialGauge() {
    return {
      templateUrl: 'views/directives/radial_gauge_directive.html',
      restrict: 'CEA',
      scope: {
        dp: '=dp',
        measurement: '=measurement'
      }
    };
  }
})();
