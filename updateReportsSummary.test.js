/**
 * @jest-environment jsdom
 */

const fs = require('fs');

const htmlPath = 'index.html';
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

describe('updateReportsSummary', () => {
    beforeEach(() => {
        // Prepare DOM
        document.body.innerHTML = htmlContent;

        // Strip scripts from DOM
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Clear require cache to re-execute app.js for each test, getting fresh DOM bindings
        jest.resetModules();

        // Mock globals expected by app.js
        window.matchMedia = jest.fn().mockImplementation(query => ({ matches: false }));
        window.firebase = {
            initializeApp: jest.fn(),
            database: jest.fn(() => ({ ref: jest.fn(() => ({ on: jest.fn(), set: jest.fn(() => Promise.resolve()) })) })),
            auth: jest.fn(() => ({
                onAuthStateChanged: jest.fn(),
                createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
                signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
                signOut: jest.fn()
            }))
        };

        // Suppress console errors for cleaner output if app.js logs something during setup
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // Load the app script
        require('./app.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    it('should calculate monthly and yearly totals correctly', () => {
        const monthInput = document.getElementById('summaryMonth');
        monthInput.value = '2023-10';

        window.setStoreData({
            '2023-10-01': {
                sales: [{ amount: '100', munafa: '20' }],
                expenses: [{ amount: '10' }],
                monthlyExpenses: [{ amount: '5' }],
                mokam: [{ amount: '2' }],
                tulaKroy: [{ amount: '3' }],
                shimulTula: [{ amount: '4' }]
            },
            '2023-10-15': {
                sales: [{ amount: '200', munafa: '40' }],
                expenses: [{ amount: '20' }]
            },
            '2023-09-01': {
                sales: [{ amount: '500', munafa: '100' }]
            },
            '2022-10-01': {
                sales: [{ amount: '1000', munafa: '200' }]
            }
        });

        window.updateReportsSummary();

        expect(document.getElementById('mTotalSales').textContent).toBe((300).toLocaleString('bn-BD'));
        expect(document.getElementById('mTotalMunafa').textContent).toBe((60).toLocaleString('bn-BD'));
        expect(document.getElementById('mTotalExpenses').textContent).toBe((30).toLocaleString('bn-BD'));
        expect(document.getElementById('mTotalMonthlyExpenses').textContent).toBe((5).toLocaleString('bn-BD'));
        expect(document.getElementById('mTotalMokam').textContent).toBe((2).toLocaleString('bn-BD'));
        expect(document.getElementById('mTotalTulaKroy').textContent).toBe((3).toLocaleString('bn-BD'));
        expect(document.getElementById('mTotalShimulTula').textContent).toBe((4).toLocaleString('bn-BD'));

        expect(document.getElementById('yTotalSales').textContent).toBe((800).toLocaleString('bn-BD'));
        expect(document.getElementById('yTotalMunafa').textContent).toBe((160).toLocaleString('bn-BD'));

        expect(document.getElementById('monthlyLabel').textContent).toBe('অক্টোবর ' + (2023).toLocaleString('bn-BD', {useGrouping:false}) + ' (মাস)');
        expect(document.getElementById('yearlyLabel').textContent).toBe((2023).toLocaleString('bn-BD', {useGrouping:false}) + ' (বছর)');
    });

    it('should do nothing if monthInput is empty', () => {
        const monthInput = document.getElementById('summaryMonth');
        monthInput.value = '';
        window.updateReportsSummary();
        expect(document.getElementById('monthlyLabel').textContent).toBe('চলতি মাস');
    });

    it('should handle missing data gracefully', () => {
        const monthInput = document.getElementById('summaryMonth');
        monthInput.value = '2023-10';
        window.setStoreData({
            '2023-10-01': {}
        });
        window.updateReportsSummary();
        expect(document.getElementById('mTotalSales').textContent).toBe((0).toLocaleString('bn-BD'));
        expect(document.getElementById('yTotalSales').textContent).toBe((0).toLocaleString('bn-BD'));
    });

    it('should handle invalid month format gracefully', () => {
        const monthInput = document.getElementById('summaryMonth');
        monthInput.value = 'invalid-format';
        window.updateReportsSummary();
        expect(document.getElementById('monthlyLabel').textContent).toBe('চলতি মাস');
    });

    it('should ignore invalid month indices gracefully', () => {
        const monthInput = document.getElementById('summaryMonth');
        monthInput.value = '2023-13';
        window.updateReportsSummary();
        expect(document.getElementById('monthlyLabel').textContent).toBe('চলতি মাস');
    });
});
