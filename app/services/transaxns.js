(function () {

    'use strict';

    var serviceId = "transaxns";
    angular.module('app').factory(serviceId, ['datacontext', 'common', 'color', 'date', transaxns]);

    function transaxns(datacontext, common, color, date) {
        var transactions = [],
            userTags = [],
            sort = {
                column: 'timestamp',
                descending: true
            };

        function sortByDateDesc(a, b) {
            var d1 = parseInt(a.timestamp);
            var d2 = parseInt(b.timestamp);
            if (d1 > d2) {
                return -1;
            } else if (d1 < d2) {
                return 1;
            } else {
                return 0;
            }
        }

        function updateSorting(column) {
            if (sort.column == column) {
                sort.descending = !sort.descending;
            } else {
                sort.column = column;
                sort.descending = false;
            }
            return sort;
        }

        function getTransactionIndex(transactionGuid, array) {
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i].guid === transactionGuid) {
                    return i;
                }
            }
        }

        function getSortingForColumn(column) {
            if (sort.column !== column) {
                return 'sorting';
            } else {
                if (sort.descending === true) {
                    return 'sorting_desc';
                } else if (sort.descending === false) {
                    return 'sorting_asc';
                } else {
                    return '';
                }
            }
        }

        function filterByTags(tags) {
            if (tags.length === 0) {
                return transactions.slice(0);
            }
            return transactions.filter(function (t) {
                for (var i = 0; i < tags.length; i++) {
                    for (var j = 0; j < t.tags.length; j++) {
                        if (t.tags[j].text === tags[i].text)
                            return true;
                    }
                }
            });
        }

        function filterByDate(fromDate, toDate) {
            return transactions.filter(function (t) {
                return (!fromDate || t.timestamp >= fromDate) && (!toDate || t.timestamp <= toDate);
            });
        }

        function _colorAndSaveTags(tags) {
            if (!tags)
                return;
            for (var i = tags.length - 1; i >= 0; i--) {
                if (!tags[i].text) {
                    var text = tags[i];
                    tags[i] = {
                        text: text,
                        color: _getTagColor(text)
                    };
                }
                else {
                    tags[i].color = _getTagColor(tags[i].text);
                }
                if (_userTagsContains(tags[i]) === false) {
                    userTags.push(tags[i]);
                }
            }
        }

        function _userTagsContains(tag) {
            return userTags.some(function (t) {
                return t.text === tag.text;
            });
        }

        function _getTagColor(tagText) {
            var tag = userTags.filter(function (t) {
                return t.text === tagText;
            });
            if (tag.length && tag[0].color) {
                return tag[0].color;
            } else {
                return color.get(true, 0.3);
            }
        }

        function copy(tnx) {
            return {
                guid: tnx.guid,
                timestamp: tnx.timestamp,
                amountInBaseCurrency: tnx.amountInBaseCurrency,
                tags: tnx.tags,
                latitude: tnx.latitude,
                longitude: tnx.longitude
            };
        }

        function getTotalAmout() {
            var sum = 0;
            for (var i = 0; transactions && i < transactions.length; i++) {
                sum += parseInt(transactions[i].amountInBaseCurrency);
            }
            return sum;
        }

        function getMinDate() {
            var minDate = transactions[transactions.length - 1].timestamp;
            return date.format(minDate);
        }

        function getMaxDate() {
            var maxDate = transactions[0].timestamp;
            return date.format(maxDate);
        }

        function getTransaxns() {
            var def = common.$q.defer();

            datacontext.getTransaxns()
                .then(function (tnxs) {
                    if (tnxs && tnxs.data instanceof Array) {
                        transactions = tnxs.data.sort(sortByDateDesc);
                        transactions.forEach(function (t) {
                            _colorAndSaveTags(t.tags);
                        });
                        def.resolve(transactions.slice(0));
                    }
                    else {
                        def.reject();
                    }
                }, function (resp) {
                    console.log(resp)
                });

            return def.promise;
        }

        function getLocalTransaxns() {
            return transactions.slice(0);
        }

        function update(tnx) {
            var def = common.$q.defer();
            datacontext.updateTransaction(tnx)
                .then(function () {
                    var transaction = transactions.filter(function (t) {
                        return t.guid === tnx.guid;
                    });

                    if (!transaction.length) {
                        console.log("transaction not found");
                        def.reject("Не удалось найти транзкцию");
                        return;
                    }
                    angular.copy(tnx, transaction[0]);
                    def.resolve();
                },
                function () {
                    console.log("error");
                    def.reject("При сохранении проихошла ошибка.")
                }
            );
            return def.promise;
        }

        function create(tnx) {
            var def = common.$q.defer();
            if (!tnx.DateTime) {
                tnx.DateTime = date.now();
            } else {
                tnx.DateTime = date.toUnix(tnx.DateTime);
            }
            console.log(datacontext.createTransaction);
            datacontext.createTransaction(tnx)
                .then(function (guid) {
                    _colorAndSaveTags(tnx.tags);

                    var newTransaxn = {
                        guid: guid,
                        amountInBaseCurrency: parseInt(tnx.amountInBaseCurrency) || 0,
                        tags: tnx.tags ? angular.copy(tnx.tags) : [],
                        timestamp: tnx.DateTime,
                        latitude: tnx.latitude,
                        longitude: tnx.longitude
                    };
                    transactions.push(newTransaxn);
                    def.resolve(newTransaxn);
                }, function () {
                    def.reject();
                });
            return def.promise;
        }

        function remove(transactionGuid) {
            var def = common.$q.defer();
            datacontext.deleteTransaction(transactionGuid)
                .then(function () {
                    var index = getTransactionIndex(transactionGuid, transactions);
                    transactions.splice(index, 1);
                    def.resolve();
                },
                function () {
                    def.reject("При удалении произошла ошибка.")
                }
            );
            return def.promise;
        }

        return {
            getLocalTransaxns: getLocalTransaxns,
            getTransaxns: getTransaxns,
            updateSorting: updateSorting,
            getSortingForColumn: getSortingForColumn,
            filterByDate: filterByDate,
            filterByTags: filterByTags,
            getTotalAmout: getTotalAmout,
            create: create,
            getMinDate: getMinDate,
            getMaxDate: getMaxDate,
            userTags: userTags,
            sort: sort,
            sortByDateDesc: sortByDateDesc,
            update: update,
            getTransactionIndex: getTransactionIndex,
            remove: remove
        };
    }
})();
