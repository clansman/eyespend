'use strict';

var res = require('../../app/translations.js');
var pages = require('../e2e/pages.js');

var menu = new pages.Menu();
var content = new pages.Content();
var transactionsPage = new pages.Transactions();
var loginPage = new pages.Login();

describe('transactions page', function () {
    var ptor = protractor.getInstance();
    browser.driver.manage().window().maximize();

    it('should navigate to transactions page', function () {
        browser.driver.get('http://localhost:3000/');

        browser.driver.findElement(by.css('.container h2 strong')).getText().then(function(title) {
            if(res.ru.MEET_EYESPEND === title){
                browser.driver.findElement(by.id('login')).click();
                browser.driver.findElement(by.id('email')).sendKeys('123');
                browser.driver.findElement(by.id('loginButton')).click();
                ptor.sleep(2000);
                expect(content.header()).toBe(res.ru.EXPENSES_HISTORY);
            }
        });
    });

    it('should sort', function () {
        transactionsPage.sortByAmount.click();
        ptor.sleep(3000);
        expect(transactionsPage.rows.count()).toBe(transactionsPage.startCount);
        expect(transactionsPage.firstAmount.getText()).toBe('202 р.');

        transactionsPage.sortByTimestamp.click();
        ptor.sleep(3000);
        expect(transactionsPage.rows.count()).toBe(transactionsPage.startCount);
        expect(transactionsPage.firstDate.getText()).toBe('01 января 2012');

        transactionsPage.sortByFoto.click();
        ptor.sleep(3000);
        expect(transactionsPage.rows.count()).toBe(transactionsPage.startCount);
    });


    it('should edit transaction', function () {
        transactionsPage.transactionDate.click();
        transactionsPage.pencil.click();
        transactionsPage.setDateAndTimeEditor('250520141200\n');
        transactionsPage.editedAmount.clear();
        transactionsPage.editedAmount.sendKeys('555');
        ptor.sleep(300);
        transactionsPage.editAddress.click();
        transactionsPage.placeInput.sendKeys('Ашан');
        ptor.sleep(2500);
        transactionsPage.placeInput.sendKeys(protractor.Key.ARROW_DOWN);
        transactionsPage.placeInput.sendKeys('\n');
        transactionsPage.savePlace.click();
        transactionsPage.saveEdit.click();
        expect(transactionsPage.transactionAmount()).toBe('555 р.');
        expect(transactionsPage.transactionFullDate()).toBe('25 мая 2014');
    });

    it('should add new transaction', function () {
        transactionsPage.createButton.click();
        transactionsPage.addButton.click();

        transactionsPage.dateAndTime.click();
        transactionsPage.dateAndTime.sendKeys('22.05.2014');
        transactionsPage.amountInput.sendKeys('100');
        transactionsPage.tagsInput.sendKeys('аптека\nналичные\n');
        transactionsPage.addButton.click();

        transactionsPage.amountInput.sendKeys('200');
        transactionsPage.tagsInput.sendKeys('кино\nресторан\n');
        ptor.sleep(500);
        transactionsPage.pickAddress.click();
        transactionsPage.placeInput.sendKeys('Ашан');
        ptor.sleep(2500);
        transactionsPage.placeInput.sendKeys(protractor.Key.ARROW_DOWN);
        transactionsPage.placeInput.sendKeys('\n');
        transactionsPage.savePlace.click();
        transactionsPage.addButton.click();
        expect(transactionsPage.rows.count()).toBe(transactionsPage.startCount + 3);
    });

    it('should open map', function () {
        transactionsPage.showMap.click();
        transactionsPage.closeOverlay.click();
    });

    it('should filter', function () {
        transactionsPage.filterButton.click();
        transactionsPage.tag.click();
        expect(transactionsPage.firstTag.getText()).toBe(transactionsPage.tag.getText());
        transactionsPage.tagsFilter.sendKeys('\b\b');
        transactionsPage.addTagToFilter('ресторан');
        ptor.sleep(2000);
        expect(transactionsPage.firstTag.getText()).toBe('аптека');
        transactionsPage.tagsFilter.sendKeys('\b\b');
        transactionsPage.datePicker.click();
        transactionsPage.lastWeekFilter.click();
    });


    it('should change language from menu', function () {
        menu.changeLanguage('en');
        expect(content.header()).toBe(res.en.EXPENSES_HISTORY);

        menu.changeLanguage('ru');
        expect(content.header()).toBe(res.ru.EXPENSES_HISTORY);
    });

    it('should log out', function (done) {
        menu.logout.click();
    });

});
