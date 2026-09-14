const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('importData JSON Validation', () => {
    let dom;
    let window;

    beforeEach(() => {
        const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
        dom = new JSDOM(html, {
            runScripts: "dangerously",
            url: "http://localhost/",
            beforeParse(window) {
                // Mock localStorage
                window.localStorage = {
                    getItem: jest.fn(),
                    setItem: jest.fn(),
                    removeItem: jest.fn(),
                    clear: jest.fn()
                };

                // Mock matchMedia
                window.matchMedia = jest.fn().mockImplementation(query => ({
                    matches: false,
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                }));

                // Mock Firebase properly to avoid 'auth' onAuthStateChanged issues
                window.firebase = {
                    initializeApp: jest.fn(),
                    database: jest.fn(),
                    auth: jest.fn(() => ({
                        onAuthStateChanged: jest.fn()
                    }))
                };

                // Define alert
                window.alert = jest.fn();
            }
        });
        window = dom.window;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should alert error when importing invalid JSON file', (done) => {
        // Prepare file with invalid JSON content
        const invalidJson = "{ this is not valid json }";
        const file = new window.File([invalidJson], "test.json", { type: "application/json" });

        // Mock event object expected by importData
        const event = {
            target: {
                files: [file],
                value: 'C:\\fakepath\\test.json'
            }
        };

        // We can override FileReader in the window object to be synchronous for easier testing
        const originalFileReader = window.FileReader;
        window.FileReader = class MockFileReader {
            readAsText(file) {
                // Call onload immediately with the invalid JSON
                setTimeout(() => {
                    this.onload({ target: { result: invalidJson } });
                }, 0);
            }
        };

        // Call the target function
        window.importData(event);

        // Check assertions on next tick after onload finishes
        setTimeout(() => {
            expect(window.alert).toHaveBeenCalledWith("ফাইলটি পড়তে সমস্যা হয়েছে।");
            expect(event.target.value).toBe('');

            // Restore FileReader
            window.FileReader = originalFileReader;
            done();
        }, 50);
    });
});
