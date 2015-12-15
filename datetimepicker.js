/* global angular

 Directive for bootstrap-datepicker and jquery-timepicker

 */
angular.module('ui.datetimepicker', [])
    .directive('datetimepicker', ['$window', function ($window) {
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
                if (!dateElement.is(':focus')) {
                    dateElement.datepicker('setDate', getNgModelDateValue());
                }
                if (!timeElement.is(':focus')) {
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
                    newDate.setUTCHours(currentTime.getUTCHours());
                    newDate.setUTCMinutes(currentTime.getUTCMinutes());
                    newDate.setUTCSeconds(0);
                    newDate.setUTCMilliseconds(0);

                    scope.internalUpdated = true;
                    ngModel.$setViewValue(newDate);
                })
            });

            timeElement.on('changeTime', function () {
                scope.$evalAsync(function () {
                    var currentDate = getNgModelDateValue();
                    var newTime = timeElement.timepicker('getTime');
                    newTime.setUTCDate(currentDate.getUTCDate());
                    newTime.setUTCMonth(currentDate.getUTCMonth());
                    newTime.setUTCFullYear(currentDate.getUTCFullYear());

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
                    updateThisModelToBeAfterPairedModel();
                }
                scope.internalUpdatedPairedModel = false;
            }, true);

            scope.$watch('ngModel', function() {
                if (isPaired() && !scope.internalUpdatedPairedModel) {
                    updatePairedModelToBeBeforeThisModel();
                }
                scope.internalUpdatedPairedModel = false;
            });

            function updateThisModelToBeAfterPairedModel() {

            }

            function updatePairedModelToBeBeforeThisModel() {
                var thisModelDate = getNgModelDateValue();
                var pairedModelDate = getPairedModelDateValue();
                if (thisModelDate < pairedModelDate) {
                    pairedModelDate.setUTCFullYear(thisModelDate.getUTCFullYear());
                    pairedModelDate.setUTCMonth(thisModelDate.getUTCMonth());
                    pairedModelDate.setUTCDate(thisModelDate.getUTCDate());

                    scope.internalUpdatedPairedModel = true;
                    scope.pairWith = pairedModelDate;
                }
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