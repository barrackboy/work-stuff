(function () {
  'use strict';
  angular.module('soneraiox').directive('datapoint', [datapoint]);

  function datapoint() {
    return {
      restrict: 'E',
      scope: {
        dp: '='
      },
      templateUrl: 'views/templates/datapoint.html'
    };
  }
  
})();
