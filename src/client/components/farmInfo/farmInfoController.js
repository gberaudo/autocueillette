(function() {
    'use strict';

    angular.module('app')
    .controller('FarmInfoController', farmInfoController);

    farmInfoController.$inject = ['$state', '$stateParams', '$http', 'OLServices', '$timeout', 'searchService', '$scope', '$anchorScroll', '$location'];

    function farmInfoController($state, $stateParams, $http, OLServices, $timeout, searchService, $scope, $anchorScroll, $location) {
        /* jshint validthis: true*/
        var farmId = $stateParams.farmId;
        var farmInfoCtrl = this;
        var map = new OLServices.OLMap();
        $location.hash('');
        $scope.mode = {};
        $scope.newComment = {};
        $scope.editor = {};
        farmInfoCtrl.farm = {};
        getFarm(farmId).then(function() {
            setup();
        }).then(function() {
            getComments(farmId);
        });
        farmInfoCtrl.sendComment = sendComment;
        farmInfoCtrl.getSenderInfo = getSenderInfo;
        farmInfoCtrl.getEditorInfo = getEditorInfo;
        farmInfoCtrl.sendUpdate = sendUpdate;
        farmInfoCtrl.cancelEdit = cancelEdit;
        farmInfoCtrl.toEditMode = function() {
            $state.go('farmInfo.edit', {farmId: farmId}, {reload: true});
        };
        farmInfoCtrl.reportBadAddr = reportBadAddr;
        farmInfoCtrl.showHistoryFn = showHistory;
        farmInfoCtrl.format = function(farm) {
            return [farm.street, farm.city, farm.canton, farm.country].filter(Boolean).join(', ');
        };
        function getFarm(id) {
            var req = {
                method: 'post',
                url: '/getFarm',
                data: {id: id}
            };
            return $http(req).then(function(res) {
                if (!res.data.err) {
                    farmInfoCtrl.farm = res.data.farmInfo;
                }
            }, function(err) {
                console.log(err);
            });
        }

        function setup() {
            var farm = farmInfoCtrl.farm;
            $timeout(function() {
                map.map.setTarget('map1');
                map.resetView([farm.lat, farm.lon]);
            });
            $scope.edit = {
                name: farm.name,
                phone: farm.phone,
                products: farm.products
            };
        }
        function sendComment(comment) {
            var req = {
                method: 'post',
                url: '/postComment',
                data: {
                    id: farmInfoCtrl.farm.id,
                    message: comment.text,
                    author: comment.senderName,
                    email: comment.senderEmail
                }
            };
            $http(req).then(function(res) {
            }, function(err) {
                console.log('send comment error', err);
            });

            $state.go('farmInfo.view', {farmId: farmInfoCtrl.farm.id}, {reload: true});
        }

        function update(farm) {
            var req = {
                method: 'post',
                url: '/updateFarm',
                data: farm
            };
            $http(req).then(function(res) {
            }, function(err) {
                console.log('update error', err);
            });
        }

        function getSenderInfo() {
            if (!$scope.newComment.text) {
                return;
            }
            $scope.getSenderInfo = true;
            $location.hash('senderInfo');
            $anchorScroll();
        }

        function getEditorInfo() {
            var farm = farmInfoCtrl.farm;
            if (($scope.edit.name === farm.name) &&
                ($scope.edit.phone === farm.phone) &&
                ($scope.edit.products === farm.products) &&
                (!$scope.edit.comment)) {
                return;
            }
            $scope.getEditorInfo = true;
            $location.hash('editorInfo');
            $anchorScroll();
        }

        function sendUpdate() {
            var farm = farmInfoCtrl.farm;
            var author = $scope.edit.author;
            var email = $scope.edit.email;
            farm.name = $scope.edit.name;
            farm.phone = $scope.edit.phone;
            farm.products = $scope.edit.products;
            farm.author = $scope.edit.author;
            checkContributor(author, email)
            .then(function(res) {
                if (res.data.err) {
                    console.log('error', res.data.err);
                    return;
                }
                if (res.data.status === 'invalid') {
                    /*TODO: alert invalid identity*/
                    $scope.invalidIdentity = true;
                    console.log('invalid identity');
                    return;
                }
                if (res.data.status === 'available') {
                    addContributor(author, email);
                }
                update(farm);

                $state.go('farmInfo.view', {farmId: farmInfoCtrl.farm.id}, {reload: true});
            }, function(err) {
                console.log('error', err);
            });
        }

        function checkContributor(name, email) {
            var req = {
                method: 'post',
                url: '/checkContributor',
                data: {name: name, email: email}
            };
            return $http(req);
        }

        function addContributor(name, email) {
            var req = {
                method: 'post',
                url: '/addContributor?',
                data: {name: name, email: email}
            };
            $http(req).then(function(res) {
            }, function(err) {
                console.log('error', err);
            });
        }

        function cancelEdit() {
            $state.go('farmInfo.view', {farmId: farmInfoCtrl.farm.id}, {reload: true});
        }

        function reportBadAddr() {
        }

        function showHistory() {
            var req = {
                method: 'get',
                url: '/getFarmHistory?id=' + farmInfoCtrl.farm.id
            };
            return $http(req).then(function(res) {
                if (res.data.err) {
                    return;
                }
                farmInfoCtrl.farmHistory = res.data;
                farmInfoCtrl.showHistory = true;
            }, function(err) {
                console.log(err);
            });
        }

        function getComments(farmId) {
            var req = {
                method: 'get',
                url: '/getComments?id=' + farmId
            };
            return $http(req).then(function(res) {
                if (res.data.err) {
                    return;
                }
                farmInfoCtrl.comments = res.data;
            }, function(err) {
                console.log('get comments error', err);
            });
        }
    }
})();
