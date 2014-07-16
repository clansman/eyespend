﻿(function () {
    'use strict';

    var app = angular.module('app');

    toastr.options.timeOut = 4000;
    toastr.options.positionClass = 'toast-top-right';

    var events = {
        controllerActivateSuccess: 'controller.activateSuccess',
        spinnerToggle: 'spinner.toggle',
        locationSet: 'location.set'
    };

    var config = {
        appErrorPrefix: '[HT Error] ',
        events: events,
        version: '1.0',
        local: 'ru'
    };

    app.value('config', config);

    app.config(['$logProvider', function ($logProvider) {
        if ($logProvider.debugEnabled) {
            $logProvider.debugEnabled(true);
        }
    }]);
    app.config(['tmhDynamicLocaleProvider', function (tmhDynamicLocaleProvider) {
        tmhDynamicLocaleProvider.localeLocationPattern('locales/angular-locale_{{locale}}.js');
    }]);

    app.config(['commonConfigProvider', function (cfg) {
        cfg.config.controllerActivateSuccessEvent = config.events.controllerActivateSuccess;
        cfg.config.spinnerToggleEvent = config.events.spinnerToggle;
    }]);

    app.config(['$translateProvider', function ($translateProvider) {
        $translateProvider
            .translations('ru', translationsRu)
            .translations('en', translationsEn)
            .preferredLanguage(config.local);
    }]);

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    });
})();
