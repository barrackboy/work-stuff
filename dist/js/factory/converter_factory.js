(function() {
    'use strict';

    angular.module('soneraiox').factory('Converter', [
        Converter
    ]);

    function Converter() {
        return {
            aggregate,
            getCurrentMeasurement,
            getHighMeasurement,
            getLowMeasurement,
            getMeasurementValues,
            getLabelsForMeasurements,
            getValuesFromAggregatedMeasurements,
            calculateAveragesFromAggregatedMeasurements,
            getHourlyLabelsForAggregatedMeasurements,
            getDailyLabelsForAggregatedMeasurements,
            filterHourlyValuesForLast24Hours,
            filterDailyValuesForLast7Days,
            hexToRgb,
            convertAggregatedMeasurementData
        };


        function aggregate(timeSortedMeasurements) {
            var aggregatedValues = getHourlyArrays(timeSortedMeasurements);
            return calculateAverages(aggregatedValues);
        }

        function getCurrentMeasurement(measurements) {
            return measurements[measurements.length - 1];
        }

        function getHighMeasurement(measurements) {
            return Math.max.apply(Math, measurements);
        }

        function getLowMeasurement(measurements) {
            return Math.min.apply(Math, measurements);
        }

        function getMeasurementValues(measurementArray) {
            var values = [];
            for (var i = 0; i < measurementArray.length; ++i) {
                values.push(measurementArray[i].value);
            }
            return values;
        }

        function getLabelsForMeasurements(timeSortedMeasurements) {
            var ar = [];
            var key = "";
            for (var i in timeSortedMeasurements) {
                var element = timeSortedMeasurements[i];
                var time = element.timestamp.substr(0, 13);
                if (time != key) {
                    var label = time.substr(time.length - 2, time.length);
                    ar.push(label);
                    key = time;
                }
            }
            return ar;
        }

        // function getHourlyLabelsForAggregatedMeasurements(timeStamps) {
        //   //SUPER AWKWARD way TO FIX TIMESTAMPS ROFLROFL
        //     for (var i = 0; i < timeStamps.length; ++i) {
        //       var date = new Date(timeStamps[i]);
        //       timeStamps[i] = date.getHours()-2 + ":" + date.getMinutes() + "0";
        //     }
        //     return timeStamps;
        //   }


        function getHourlyLabelsForAggregatedMeasurements(timeStamps) {
            //SUPER AWKWARD way TO FIX TIMESTAMPS ROFLROFL
            for (var i = 0; i < timeStamps.length; ++i) {
                var date = new Date(timeStamps[i]);
                timeStamps[i] = date.getHours() + ":" + date.getMinutes() + "0";

            }
            return timeStamps;
        }


        function getDailyLabelsForAggregatedMeasurements(timeStamps) {
            var weekday = new Array(7);
            weekday[0] = "Sunday";
            weekday[1] = "Monday";
            weekday[2] = "Tuesday";
            weekday[3] = "Wednesday";
            weekday[4] = "Thursday";
            weekday[5] = "Friday";
            weekday[6] = "Saturday";

            for (var i = 0; i < timeStamps.length; ++i) {
                timeStamps[i] = weekday[new Date(timeStamps[i]).getDay()];
            }
            return timeStamps;
        }

        function filterDailyValuesForLast7Days(aggregatedMeasurements) {
            var daysInWeek = 7;
            filterValues(aggregatedMeasurements, daysInWeek);
        }

        function filterHourlyValuesForLast24Hours(aggregatedMeasurements) {
            var hoursInDay = 6;
            filterValues(aggregatedMeasurements, hoursInDay);
        }

        function filterValues(aggregatedMeasurements, amount) {
            aggregatedMeasurements.aggregatedMin = aggregatedMeasurements.aggregatedMin.slice(aggregatedMeasurements.aggregatedMin.length - amount, aggregatedMeasurements.aggregatedMin.length);
            aggregatedMeasurements.aggregatedMax = aggregatedMeasurements.aggregatedMax.slice(aggregatedMeasurements.aggregatedMax.length - amount, aggregatedMeasurements.aggregatedMax.length);
            aggregatedMeasurements.measurementTimeStamps = aggregatedMeasurements.measurementTimeStamps.slice(aggregatedMeasurements.measurementTimeStamps.length - amount, aggregatedMeasurements.measurementTimeStamps.length);
        }

        function getValuesFromAggregatedMeasurements(aggregatedMeasurements, includeMinValues, includeMaxValues) {
            var values = [];
            for (var key in aggregatedMeasurements) {
                if (aggregatedMeasurements.hasOwnProperty(key)) {
                    var value = aggregatedMeasurements[key][0];
                    if (includeMinValues) {
                        values.push(value.min);
                    }
                    if (includeMaxValues) {
                        values.push(value.max);
                    }
                }
            }
            return values;
        }

        function convertAggregatedMeasurementData(originalData) {
            var convertedDataArray = [];
            for (var i = 0; i < originalData.series.length; i++) {
                var measurementIdentifier = originalData.series[i];
                var fragmentType = measurementIdentifier.type;
                var series = measurementIdentifier.name;
                var unit = measurementIdentifier.unit;
                var convertedDataObject = {
                    fragmentType: fragmentType,
                    series: series,
                    unit: unit,
                    aggregatedMin: [],
                    aggregatedMax: [],
                    measurementTimeStamps: []
                };
                convertedDataArray.push(convertedDataObject);
            }

            for (var key in originalData.values) {
                for (var i = 0; i < originalData.values[key].length; i++) {
                    var element = originalData.values[key][i];
                    if (element !== null) {
                        convertedDataArray[i].aggregatedMin.push(element.min);
                        convertedDataArray[i].aggregatedMax.push(element.max);
                        convertedDataArray[i].measurementTimeStamps.push(key);
                    }
                }
            }
            return convertedDataArray;
        }

        function getHourlyArrays(timeSortedMeasurements) {
            var ar = [];
            var key = "";
            for (var i in timeSortedMeasurements) {
                var element = timeSortedMeasurements[i];
                var time = element.timestamp.substr(0, 13);
                if (time != key) {
                    ar.push([]);

                    key = time;
                }
                ar[ar.length - 1].push(element.value);
            }
            return ar;
        }

        function calculateAveragesFromAggregatedMeasurements(aggregatedMeasurements) {
            var averages = [];
            var minArray = aggregatedMeasurements.aggregatedMin;
            var maxArray = aggregatedMeasurements.aggregatedMax;
            for (var i = 0; i < maxArray.length; i++) {
                var maxValue = maxArray[i];
                var minValue = minArray[i];
                var avg = calculateAverage([minValue, maxValue]);
                averages.push(avg);
            }
            return averages;
        }

        function calculateAverages(a) {
            var averages = [];
            for (var i in a) {
                var hourArray = a[i];
                var avg = calculateAverage(hourArray);
                averages.push(avg);
            }
            return averages;
        }

        function calculateAverage(measurementArray) {
            var total = 0;
            for (var j in measurementArray) {
                var value = measurementArray[j];
                total += value;
            }
            var avg = total / measurementArray.length;
            return avg;
        }

        function hexToRgb(hex) {
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

    }
})();