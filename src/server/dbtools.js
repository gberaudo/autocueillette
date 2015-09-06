var http = require('http');
var nano = require('nano')('http://localhost:5984');
var request = require('request');


function convertCoordinates(coordinates) {
	return coordinates[0] + ',' + coordinates[1];
}


function checkDbExistence(doc, dbName, callback) {
	var res = {};
	var db = nano.db.use(dbName);
	db.view('farms', 'by_location', {keys: [[doc.city, doc.canton]]},
		function(err, body) {
			if (!err) {
				var result = body.rows;
				if (result.length === 0)
					res = {exists: false};
				for (var i = 0; i < result.length; i++) {
					if (result[i].value.formattedAddress === doc.formattedAddress) {
						res = {exists: true};
					}
				}
				if (!res.exists) {
					var closeFarms = findCloseFarms(doc, result);
					if (closeFarms.length > 0) {
						res.closeFarms = closeFarms;
					}
				}
				if (callback) {
					callback(res);
				}
			}
		}
	);
}


function findCloseFarms(doc, list) {
	var radius = 1; //km
	var closeFarms = [];
	list.forEach(function(item) {
		var distance = getStraightDistance(doc.coordinates, item.value.coordinates);
		if (distance < radius)
			closeFarms.push(item);
	});
	return closeFarms;
}


function updateDb(doc, dbName, callback) {
	var db = nano.db.use(dbName);
	db.insert(doc, callback);
}


function getStraightDistance(x, y) {
	var R = 6371; //earth's radius
	var h;
	var d;
	h = haversine(toRad(x[0] - y[0])) + Math.cos(toRad(x[0])) * Math.cos(toRad(y[0])) * haversine(toRad(x[1] - y[1]));
	d = 2 * R * Math.asin(Math.sqrt(h));
	console.log(d);
	return d;
}


function haversine(a) {
	return (Math.sin(a / 2)) * (Math.sin(a / 2));
}


function toRad(l) {
	return l * Math.PI / 180;
}


function solrIndex(farm, id) {
	var coordinates = convertCoordinates(farm.coordinates);
	var name = farm.name;
	var short_addr = farm.formattedAddress; // FIXME
	var product = [];
	if (farm.products) {
		for (var i = 0; i < farm.products.length; i++) {
			product.push(farm.products[i].name);
		}
	}
	var doc = [{
		id: id,
		farm_name: name,
		coordinates: coordinates,
		short_address: short_addr,
		product: product
	}];

	var url = 'http://localhost:8983/solr/autocueillette/update/json?commit=true';
	request.post({url: url, json: doc}, function(err, res, body) {
		if (err) {
			console.log('solr post error', err);
		} else {
			console.log('success', body);
		}
	});
}


function getFarm(id, callback) {
	var url = 'http://localhost:5984/autocueillette_farms/' + id;
	var options = {
		url: url,
		method: 'get'
	};
	request(options, function(err, res, body) {
		callback(err, body);
	});
}


function updateFarm(farm, callback) {
	var db = nano.db.use('autocueillette_farms');
	db.insert(farm, callback);
}


function searchIndex(data, callback) {
	var coordinates = convertCoordinates(data.coordinates);
	var product = data.product.match(/\w+|"(?:\\"|[^"])+"/g); /*Split string 'salade "haricot vert"' into ['salade', 'haricot vert']*/
	var d = 50; /*default radius = 50km*/
	var url ='http://localhost:8983/solr/autocueillette/select?';
	var q = '';
	for (var i = 0; i < product.length - 1; i++) {
		q += 'product:' + product[i] + ' ';
	}
	q += 'product:' + product[product.length - 1];

	var qs = {
		q: q,
		fq:'{!geofilt}',
		sort: 'geodist() asc',
		fl: '_dist_:geodist() id coordinates name short_address product',
		pt: coordinates,
		sfield: 'coordinates',
		d:'50',
		wt: 'json'
	};
	var options = {
		method: 'get',
		url: url,
		qs: qs,
		useQueryString: true
	};
	request(options, function(err, res, body) {
		callback(err, body);
	});
}

module.exports.checkDbExistence = checkDbExistence;
module.exports.updateDb = updateDb;
module.exports.solrIndex = solrIndex;
module.exports.getFarm = getFarm;
module.exports.updateFarm = updateFarm;
module.exports.searchIndex = searchIndex;