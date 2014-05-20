(function () {
    'use strict';
    var controllerId = 'transactions';
    angular.module('app').controller(controllerId, ['common', '$rootScope', '$timeout', '$scope', 'date', 'transaxns', '$translate', transactions]);

    function transactions(common, $rootScope, $timeout, $scope, date, transaxns, $translate) {
        var vm = this;
        var logInfo = common.logger.getLogFn(controllerId, 'log');
        var logError = common.logger.getLogFn(controllerId, 'logError');
        vm.tags = [];
        vm.trs = [];
        vm.newTnx = null;
        vm.isAdding = false;
        vm.selectedTnx = null;
        vm.sort = null;
        vm.showTransactionForm = false;
        vm.isLoading = false;
        vm.curDateTime = date.format(date.now());
        vm.isLoading = true;
        function editedTransactionNotValid() {
            return !vm.editedTnx || !vm.editedTnx.id || !vm.selectedTnx;
        }

        function validateAndAddErrors() {
            if ($scope.newTransactionForm && !$scope.newTransactionForm.$valid) {
                $translate('CHECK_FORM_DATA').then(function (msg) {
                    vm.createError = msg;
                });
                return false;
            }
            if (!vm.newTnx) {
                vm.createError = "некорректные данные";
                return false;
            }
            return true;
        }

        vm.selectTransaction = function (transaction, $event) {
            vm.selectedTnx = transaction;

            $event.stopPropagation();
        };

        vm.showMap = function (transaction) {
            $rootScope.showMap = true;
            $rootScope.mapCenter = new google.maps.LatLng(transaction.latitude, transaction.longitude);
            $rootScope.zoom = 17;
            $rootScope.transaction = transaction;
            $rootScope.markers = [
                {
                    id: transaction.id,
                    location: {
                        lat: transaction.latitude,
                        lng: transaction.longitude
                    },
                    options: function () {
                        return null;
                    }
                }
            ];

            $rootScope.overlayIsOpen = true;
        };

        vm.pickAddress = function () {
            $rootScope.markers = [
                {
                    id: 0,
                    location: {
                        lat: 55.80,
                        lng: 49.11
                    },
                    options: function () {
                        return {
                            draggable: true
                        };
                    }
                }
            ];
            $rootScope.zoom = 13;
            $rootScope.mapCenter = new google.maps.LatLng(55.80, 49.11);
            $rootScope.overlayIsOpen = true;
        };

        vm.changeSorting = function (column) {
            vm.sort = transaxns.updateSorting(column);
            $rootScope.showSpinner = true;
            transaxns.sort()
                .success(function (transactions) {
                    vm.trs=null;
                    vm.trs = transactions;
                    $rootScope.showSpinner = false;
                });
        };
        // vm.search = function() {
        //     vm.trs = trs.filter(function(tranx) {
        //         var matchedTags = tranx.tags.filter(function(tag) {
        //             return tag.indexOf(vm.searchPattern) != -1
        //         })
        //         return matchedTags.length > 0;
        //     });
        // };
        // vm.searchPattern = "";

        vm.loadTags = function () {
            return common.$q.when(transaxns.getUserTags());
        };

        vm.getSortingForColumn = transaxns.getSortingForColumn;

        vm.total = function () {
            return transaxns.getTotalAmout(vm.trs);
        };

        vm.filterByTags = function () {
            vm.trs = transaxns.filterByTags(vm.tags);
        };

        vm.filterByDate = function (fromDate, toDate) {
            vm.trs = transaxns.filterByDate(fromDate, toDate);
            $rootScope.$apply();
        };

        function _tagIsAlreadyAdded(tag) {
            return vm.tags.some(function (t) {
                return t.text === tag;
            });
        }

        vm.showImage = function (imgUrl) {
            $rootScope.showImage = true;
            $rootScope.imgUrl = imgUrl;
            $rootScope.overlayIsOpen = true;
        };

        vm.loadMoreTransactions = function ($inview, $inviewpart) {
            if (vm.isLoading || !$inview || !$inviewpart === "bottom")
                return;
//            logInfo('loading next transactions');
            vm.isLoading = true;
            transaxns.getTransaxns()
                .success(function (result) {
                    if (result && result.length && result.length > vm.trs.length) {
                        vm.trs = result;
                        vm.isLoading = false;
                    }
                    else {
                        vm.richedTheEnd = true;
                    }
                })
                .error(function () {
                    vm.isLoading = false;
                    logError('error loading next batch');
                });
        };

        vm.toggleAdding = function () {
            if (!vm.isAdding) {
                vm.curDateTime = date.format(date.now());
                vm.isAdding = !vm.isAdding;
                common.$timeout(function () {
                    vm.showTransactionForm = !vm.showTransactionForm;
                });
            } else {
                vm.showTransactionForm = !vm.showTransactionForm;
                vm.isAdding = !vm.isAdding;
            }
        };

        vm.toggleEditing = function (transaction) {
            if (!vm.selectedTnx || !transaction || transaction.id !== vm.selectedTnx.id)
                return;
            if (!vm.isEditing) {
                vm.editedTnx = angular.copy(vm.selectedTnx);
                vm.selectedTnxDate = date.format(vm.selectedTnx.timestamp);
                common.$timeout(function () {
                    vm.isEditing = !vm.isEditing;
                });
                common.$timeout(function () {
                    vm.showEditForm = !vm.showEditForm;
                }, 300);
            } else {
                common.$timeout(function () {
                    vm.showEditForm = !vm.showEditForm;
                    vm.isEditing = !vm.isEditing;
                });
                common.$timeout(function () {
                    vm.editedTnx = null;
                }, 300);
            }
        };

        vm.saveTnx = function () {
            if (editedTransactionNotValid()) {
                vm.editError = "Неверные данные";
                logError('Неверные данные при редактировании транзакции');
                return;
            }

            return transaxns.update(vm.editedTnx)
                .then(function () {
                    angular.copy(vm.editedTnx, vm.selectedTnx);
                    vm.toggleEditing(vm.selectedTnx);
                },
                function (msg) {
                    vm.editError = msg;
                }
            );
        };
        vm.remove = function (transaction) {
            if (!vm.selectedTnx || !transaction || vm.selectedTnx.id !== transaction.id)
                return;
            transaxns.remove(vm.selectedTnx.id)
                .then(function () {
                    var index = transaxns.getTransactionIndex(vm.selectedTnx.id, vm.trs);
                    vm.trs.splice(index, 1);
                },
                function (msg) {
                    logError(msg);
                }
            );
        };
        vm.addTag = function (tag) {
            if (_tagIsAlreadyAdded(tag)) {
                return;
            }

            vm.tags.push({
                text: tag
            });
            vm.trs = transaxns.filterByTags(vm.tags);
        };

        vm.addTnx = function () {
            var newTransactionIsValid = validateAndAddErrors();
            if (!newTransactionIsValid)
                return;
            transaxns.create(vm.newTnx)
                .then(function (tnx) {
                    vm.trs.push(tnx);
                    vm.newTnx = {};
                },
                function (msg) {
                    vm.createError = msg;
                }
            );
        };

        function _getTransactions() {
            return transaxns.getTransaxns()
                .success(function (trs) {
                    vm.trs = trs;
                    if (trs.length) {
                        vm.minDate = transaxns.getMinDate();
                        vm.maxDate = transaxns.getMaxDate();
                        vm.sort = transaxns.sortOptions;
                    }
                });
        }

        function activate() {
            var promises = [_getTransactions()];
            common.activateController(promises, controllerId)
                .then(function () {
                    vm.isLoading = false;
                    common.logger.logSuccess('Данные загружены');
                });
        }

        activate();
    }
})();
