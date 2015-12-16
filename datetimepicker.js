/* global angular

 Directive for bootstrap-datepicker and jquery-timepicker

 */
angular.module('ui.datetimepicker', [])
    .directive('datetimepicker', ['$window', '$filter', function ($window, $filter) {
        var TEMPLATE = '<div><input type="text" class="datepicker"/><input type="text" class="timepicker"/></div>';

        var moment = $window.moment;

        function isAMoment(date) {
            return moment !== undefined && moment.isMoment(date) && date.isValid();
        }

        function toDate(baseDate) {
            return isAMoment(baseDate) ? baseDate.toDate() : baseDate;
        }

        function isDateOrMoment(date) {
            return angular.isDefined(date) && date !== null &&
                ( angular.isDate(date) || isAMoment(date) );
        }

        function link(scope, element, attrs, ngModel) {

            /**
             * DateTimePicker initialization
             */

            var dateElement = element.find('.datepicker');
            var timeElement = element.find('.timepicker');

            scope.internalUpdated = false;
            scope.internalUpdatedPairedModel = false;

            function getNgModelDateValue() {
                var baseDate = isDateOrMoment(ngModel.$modelValue) ? ngModel.$modelValue : new Date();
                return toDate(baseDate);
            }

            ngModel.$render = function () {
                if (!dateElement.is(':focus') && !scope.internalUpdated) {
                    dateElement.datepicker('setDate', getNgModelDateValue());
                }
                if (!timeElement.is(':focus') && !scope.internalUpdated) {
                    timeElement.timepicker('setTime', getNgModelDateValue());
                }
            };

            scope.$watch('ngModel', function () {
                if (scope.internalUpdated) {
                    scope.internalUpdated = false;
                    return;
                }
                ngModel.$render();
            }, true);

            element.on('$destroy', function () {
                dateElement.datepicker('remove');
                timeElement.timepicker('remove');
            });

            dateElement.on('changeDate', function () {
                scope.$evalAsync(function () {
                    var currentTime = getNgModelDateValue();
                    var newDate = toDate(dateElement.datepicker('getDate'));
                    newDate.setHours(currentTime.getHours());
                    newDate.setMinutes(currentTime.getMinutes());
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);

                    scope.internalUpdated = true;
                    ngModel.$setViewValue(newDate);
                })
            });

            timeElement.on('changeTime', function () {
                scope.$evalAsync(function () {
                    var currentDate = getNgModelDateValue();
                    var newTime = timeElement.timepicker('getTime');
                    newTime.setDate(currentDate.getDate());
                    newTime.setMonth(currentDate.getMonth());
                    newTime.setFullYear(currentDate.getFullYear());

                    scope.internalUpdated = true;
                    ngModel.$setViewValue(newTime);
                })
            });

            var dateFormat = scope.dateFormat ? scope.dateFormat : 'yyyy-mm-dd';
            var timeFormat = scope.timeFormat ? scope.timeFormat : 'h:i a';
            dateElement.datepicker({
                format: dateFormat
            });
            timeElement.timepicker({
                timeFormat: timeFormat
            });

            /**
             * Pair with other date model
             */
            function isPaired() {
                return isDateOrMoment(scope.pairWith);
            }

            function getPairedModelDateValue() {
                return toDate(scope.pairWith);
            }

            scope.$watch('pairWith', function () {
                if (isPaired() && !scope.internalUpdatedPairedModel) {
                    scope.$evalAsync(function () {
                        updateThisModelToBeAfterPairedModel();
                        refreshAvailableValuesForTimePicker();
                    });
                }
                scope.internalUpdatedPairedModel = false;
            }, true);

            scope.$watch('ngModel', function () {
                if (isPaired() && !scope.internalUpdated) {
                    scope.$evalAsync(function () {
                        updatePairedModelToBeBeforeThisModel();
                        refreshAvailableValuesForTimePicker();
                    });
                }
                scope.internalUpdated = false;
            });

            function updateThisModelToBeAfterPairedModel() {
                var thisModelDate = getNgModelDateValue();
                var pairedModelDate = getPairedModelDateValue();
                if (thisModelDate < pairedModelDate) {
                    ngModel.$setViewValue(pairedModelDate);
                }
            }

            function updatePairedModelToBeBeforeThisModel() {
                var thisModelDate = getNgModelDateValue();
                var pairedModelDate = getPairedModelDateValue();
                if (thisModelDate < pairedModelDate) {
                    pairedModelDate.setFullYear(thisModelDate.getFullYear());
                    pairedModelDate.setMonth(thisModelDate.getMonth());
                    pairedModelDate.setDate(thisModelDate.getDate());

                    scope.internalUpdatedPairedModel = true;
                    scope.pairWith = pairedModelDate;
                }
            }

            function refreshAvailableValuesForTimePicker() {
                var thisModelDate = getNgModelDateValue();
                var pairedModelDate = getPairedModelDateValue();
                var minTime = '12:00 am';
                var maxTime = '11:30 pm';
                var showDuration = false;
                if (daysBetween(pairedModelDate, thisModelDate) === 0) {
                    var minTime = $filter('date')(pairedModelDate, 'hh:mm a');
                    showDuration = true;
                }

                timeElement.timepicker('option', {
                    'minTime': minTime,
                    'maxTime': maxTime,
                    'showDuration': showDuration
                });
            }

            function daysBetween(first, second) {
                return Math.floor(Math.abs(second.getTime() - first.getTime()) / 86400000);
            }
        }

        return {
            restrict: 'E',
            require: 'ngModel',
            template: TEMPLATE,
            scope: {
                ngModel: '=',
                dateFormat: '=',
                timeFormat: '=',
                pairWith: '='
            },
            link: link
        }
    }]);
