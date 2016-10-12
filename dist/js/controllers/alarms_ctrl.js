(function() {
'use strict';
//Actual alarm section controller is in section_directive!!
angular.module('soneraiox').controller('AlarmsCtrl', function($scope, c8yAlarms, $interval) {
    $scope.severities = [{
        name: 'Critical',
        value: 'CRITICAL',
        cls: 'btn-danger'
    }, {
        name: 'Major',
        value: 'MAJOR',
        cls: 'btn-warning'
    }, {
        name: 'Minor',
        value: 'MINOR',
        cls: 'btn-primary'
    }, {
        name: 'Warning',
        value: 'WARNING',
        cls: 'btn-info'
    },{
        name: 'All',
        value: undefined,
        cls: 'btn-default'
    }];

    $scope.filterAlarms = function(severity) {
      $scope.filteredAlarm = severity;
    };

    $scope.getAllAlarms = function () {
      $scope.loading = true;
      c8yAlarms.list().then(function (alarms) {
        $scope.alarms = [];
        $scope.clearedAlarms = [];
        for (var i=0; i < alarms.length; i++){
          if(alarms[i].status !== "CLEARED"){
            $scope.alarms.push(alarms[i]);
          }
          else {
            $scope.clearedAlarms.push(alarms[i]);
          }
        }
        $scope.loading = false;
      });
    }
    $scope.getAllAlarms();

    $interval($scope.getAllAlarms, 60000);

    $scope.markAlarmSeen = function (alarmId) {
      c8yAlarms
      .update({
        id: alarmId,
        status: c8yAlarms.status.ACKNOWLEDGED
      })
      .then(function () {
        $scope.getAllAlarms();
      })
      .catch(function (err) {
      });
    }

    $scope.clearAlarm = function (alarmId) {
      c8yAlarms
      .update({
        id: alarmId,
        status: c8yAlarms.status.CLEARED
      })
      .then(function () {
        $scope.getAllAlarms();
      })
      .catch(function (err) {
      });
    }


});

})();
