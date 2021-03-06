(function() {
	'use strict';

	angular.module('app')
	.directive('aspectRatio', aspectRatioDirective);
	function aspectRatioDirective() {
		var directive = {
			restrict: 'A',
			link: linkFn
		};
		return directive;
		function linkFn(scope, element, attrs) {
			var str = attrs['aspectRatio'];
			try {
				var values = str.split(':');
				var height = parseFloat(values[0]);
				var width = parseFloat(values[1]);
				var ratio = height / width;
				scope.$watch(function() {
					return element[0].clientWidth;
				}, function(newWidth) {
					var newHeight = newWidth * ratio;
					element.css('height', newHeight + 'px');
				});
			} catch (err) {
			}
		}
	}
})();

