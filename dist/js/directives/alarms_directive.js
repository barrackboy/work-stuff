(function() {
'use strict';
angular.module('soneraiox')
//TODO Make this controller available only for alarmDirective
    .controller('alarmDirectiveController', function(c8yAlarms, $scope, $interval) {

      getAlarms();

      $interval(getAlarms, 60000);

      function getAlarms() {
        c8yAlarms.list().then(function (alarms) {
          $scope.alarms = [];
          for (var i=0; i < alarms.length; i++){
            if(alarms[i].status !== "CLEARED"){
              $scope.alarms.push(alarms[i]);
            }
          }
        });
      }


    })
    .directive('alarmDirective', function () {
        return {
            templateUrl: 'views/directives/alarms-directive.html',
            restrict: 'E',
            controller: 'alarmDirectiveController as alarmDirectiveController'
        };

    });
})();
