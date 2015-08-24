function newFarmFormController($scope, $http, searchService) {
	var map = new OSMMap();
	var resource;
	var farm;
	var farmSuggestion;
	var products;
	farm = this.farm = {};
	products = this.farm.products = [{}];
	farmSuggestion = this.farmSuggestion = {};

	this.showDetails = function(suggestion) {
		var coordinates = suggestion.geocodePoints[0].coordinates;
		resetFarmAddress(suggestion);
		map.resetView(coordinates);
		$scope.showMap = true;
	};

	this.showSuggestions = function() {
		var suggestion = farmSuggestion[0];
		resetFarmAddress(suggestion);
		this.showDetails(suggestion);
		$scope.showParsedAddress = true;
	}.bind(this);

	this.localize = function(searchStr) {
		var showSuggestions = this.showSuggestions;
		searchService.bingSearch(searchStr, function(response) {
			switch (response.status) {
				case 'NR':
					console.log('No result found');
					break;
				case 'ERR':
					console.log('Error! Try again.');
					break;
				case 'OK':
					for (var key in response.result) {
						farmSuggestion[key] = response.result[key];
					}
					break;
			}
			showSuggestions();
		});
		
	}.bind(this);

	this.submit = function() {
		var req = {
			method: 'post',
			url: '/newFarm.html',
			data: farm
		};
		$http(req).then(function() {
			console.log('ok');
			this.farm = {};
			this.farm.products = [{}];
		}, function() {
			console.log('error');
		});
		console.log('submit!');
	}.bind(this);

	this.addProduct = function() {
		products.push({});
	};

	this.removeProduct = function(index) {
		products.splice(index,1);
	};
	
	function OSMMap() {
		var image, style;
		this.coordinates = [];
		image = new ol.style.Circle({
					radius: 5,
			fill: null,
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 2
			})
		});

		style = new ol.style.Style({
			image: image
		});

		this.centerFeature = new ol.Feature(
			new ol.geom.Point(
				ol.proj.fromLonLat([this.coordinates[1], this.coordinates[0]])
			)
		);
		this.map = new ol.Map({
			target: "map",
			renderer: 'canvas',
			layers: [
				new ol.layer.Tile({
					source: new ol.source.OSM()
				}),
				new ol.layer.Vector({
					source: new ol.source.Vector({
						features: [this.centerFeature]
					}),
					style: style
				})
			],
			view: new ol.View({
				maxZoom: 18,
				zoom: 15
			})
		});
	}
	OSMMap.prototype.resetView = function(coordinates){
		this.coordinates = coordinates;
		this.map.getView().setCenter(ol.proj.fromLonLat([this.coordinates[1], this.coordinates[0]]));
		this.centerFeature.getGeometry().setCoordinates(
			ol.proj.fromLonLat([this.coordinates[1], this.coordinates[0]])
		);
	};
	
	function resetFarmAddress(suggestion) {
		var address = suggestion.address;
		farm.city = address.locality;
		farm.canton = address.adminDistrict;
		farm.streetLine = address.addressLine;
	}
}

newFarmFormController.$inject = ['$scope', '$http', 'searchService']; 