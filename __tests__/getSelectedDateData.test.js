const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('getSelectedDateData', () => {
    let sandbox;

    beforeEach(() => {
        const htmlPath = path.resolve(__dirname, '../index.html');
        const html = fs.readFileSync(htmlPath, 'utf8');

        const regex = /function getSelectedDateData\(\) \{[\s\S]*?return storeData\[date\];\n\s*\}/;
        const match = html.match(regex);

        if (!match) {
            throw new Error("Could not find getSelectedDateData function in index.html");
        }

        const functionCode = match[0];

        sandbox = {
            dateInput: { value: '2023-11-01' },
            storeData: {},
        };

        vm.createContext(sandbox);
        vm.runInContext(functionCode, sandbox);
    });

    it('should initialize empty arrays for all keys if date does not exist', () => {
        sandbox.dateInput.value = '2023-11-01';
        sandbox.storeData = {};

        vm.runInContext('result = getSelectedDateData();', sandbox);

        const expectedData = {
            sales: [],
            expenses: [],
            monthlyExpenses: [],
            mokam: [],
            tulaKroy: [],
            shimulTula: []
        };

        expect(sandbox.result).toEqual(expectedData);
        expect(sandbox.storeData['2023-11-01']).toEqual(expectedData);
    });

    it('should not overwrite existing data for a key', () => {
        sandbox.dateInput.value = '2023-11-01';

        sandbox.storeData = {
            '2023-11-01': {
                sales: [{ amount: 100 }],
                mokam: [{ amount: 200 }]
            }
        };

        vm.runInContext('result = getSelectedDateData();', sandbox);

        expect(sandbox.result).toEqual({
            sales: [{ amount: 100 }],
            expenses: [],
            monthlyExpenses: [],
            mokam: [{ amount: 200 }],
            tulaKroy: [],
            shimulTula: []
        });
    });

    it('should initialize missing keys if date exists but has missing arrays', () => {
        sandbox.dateInput.value = '2023-11-01';

        sandbox.storeData = {
            '2023-11-01': {}
        };

        vm.runInContext('result = getSelectedDateData();', sandbox);

        expect(sandbox.result).toEqual({
            sales: [],
            expenses: [],
            monthlyExpenses: [],
            mokam: [],
            tulaKroy: [],
            shimulTula: []
        });
    });

    it('should handle different date inputs', () => {
        sandbox.dateInput.value = '2023-11-02';

        vm.runInContext('result = getSelectedDateData();', sandbox);

        const expectedData = {
            sales: [],
            expenses: [],
            monthlyExpenses: [],
            mokam: [],
            tulaKroy: [],
            shimulTula: []
        };

        expect(sandbox.result).toEqual(expectedData);
        expect(sandbox.storeData['2023-11-02']).toEqual(expectedData);
        expect(sandbox.storeData['2023-11-01']).toBeUndefined();
    });
});
