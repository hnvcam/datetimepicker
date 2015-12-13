/* global angular

 Directive for bootstrap-datepicker and jquery-timepicker

 */
angular.module('ui.datetimepicker', [])
    .directive('datetimepicker', ['$window', function ($window) {
        var moment = $window.moment;

        function link(scope, element, attrs, ngModel) {
            var dateElement = element.find('.datepicker');
            var timeElement = element.find('.timepicker');

            ngModel.$render = function() {
                var date = ngModel.$modelValue;
                timeElement.timepicker('setTime', date);
            };

            scope.$watch('ngModel', function() {
                ngModel.$render();
            }, true);

            element.on('$destroy', function() {
                dateElement.datepicker('remove');
                timeElement.timepicker('remove');
            });

            dateElement.on('changeDate', function() {
                scope.$evalAsync(function() {
                    var date = dateElement.datepicker('getDate');
                    console.log(date);
                })
            });

            timeElement.on('changeTime', function() {
                scope.$evalAsync(function() {
                    var time = timeElement.timepicker('getTime');
                    console.log(time);
                })
            });

            dateElement.datepicker();
            timeElement.timepicker();
        }

        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                ngModel: '='
            },
            link: link
        }
    }]);