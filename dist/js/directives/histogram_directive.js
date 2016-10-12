(function() {
    'use strict';

    angular.module('soneraiox').directive('histogram', ['$interval', 'Converter', 'aggregationTypes', histogram]);

    function histogram() {
        return {
            templateUrl: 'views/directives/histogram_directive.html',
            restrict: 'E',
            scope: {
                dataArray: '=data'

            },

            controller: histogramController,
            controllerAs: 'vm'
                //   helpers.retinaScale(histogram);
                //
                // return histogram;
        };


        function histogramController($scope, $interval, Converter, aggregationTypes) {
            $scope.charts = [];

            $scope.currentState = "LOADING";
            $scope.activeChartOptions = getDefaultOptions();
            $scope.activeChartIndex = 0;
            $scope.aggregationTypes = aggregationTypes;
            $scope.aggregation = $scope.aggregationTypes.HOURLY;
            $interval(showHistogramWhenDataIsLoaded, 500);

            $scope.$on('create', function(event, chart) {
                $scope.charts.push(chart);
            });

            $scope.$on("$destroy", function(event) {
                $interval.cancel($scope.timer);
            });

            $scope.changeActiveChart = function(index) {
                var newUnit = $scope.dataArray[index].unit;
                if ($scope.unit !== newUnit) {
                    $scope.unit = newUnit;
                    $scope.activeChartIndex = index;
                    updateCharts();
                }
            }




            function getDefaultOptions() {
                return {

                    animation: false,
                    showScale: true,
                    scaleShowGridLines: true,
                    datasetFill: true,
                    pointDot: false,
                    scaleShowLabels: true,





                    //USE THE CODE BELOW TO AFFECT THE Y-AXIS AGGREGATION

                    // scaleOverride: true,
                    // scaleSteps: 3,
                    //  scaleStartValue:5,
                    //  scaleStepWidth:10,








                    //  showXLabels: true,
                    //  showXLabels: 10,


                    // pointRadius: 1,
                    // pointHitRadius: 40,







                    showTooltips: false,
                    tooltipYPadding: 10,
                    // tooltipCaretSize: 2,
                    // tooltipEvents: ["touchmove"],
                    // tooltipFillColor: "rgba(0,0,0,0.8)",












                    responsive: true,
                    maintainAspectRatio: true,











                    scaleLabel: function(valuePayload) {
                        return valuePayload.value + " " + $scope.unit;
                    }
                };
            }

            function showHistogramWhenDataIsLoaded() {
                var dataStillLoading = $scope === undefined ||  
                    $scope.dataArray === undefined ||
                    $scope.dataArray.length === 0 ||  
                    $scope.dataArray[0].unit === undefined;
                if (dataStillLoading === false) {
                    $interval.cancel($scope.timer);
                    var newUnit = $scope.dataArray[$scope.activeChartIndex].unit;
                    $scope.unit = newUnit;
                    updateCharts();
                    $scope.currentState = "OK";
                }
            }

            $scope.showOneDay = function() {
                $scope.aggregation = $scope.aggregationTypes.HOURLY;
                updateCharts();
            }

            $scope.showOneWeek = function() {
                $scope.aggregation = $scope.aggregationTypes.DAILY;
                updateCharts();
            }

            function updateCharts() {
                for (var i = 0; i < $scope.charts.length; i++) {
                    $scope.charts[i].update();
                }
            }
        }
    }
})();