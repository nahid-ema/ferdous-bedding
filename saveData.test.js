const fs = require('fs');
const { JSDOM } = require('jsdom');

describe('saveData', () => {
    let dom;
    let window;

    beforeEach(() => {
        const html = fs.readFileSync('index.html', 'utf8');
        const htmlWithoutExternalScripts = html.replace(/<script src=".*?"><\/script>/g, '');
        dom = new JSDOM(htmlWithoutExternalScripts, {
            url: "http://localhost/", // Important for localStorage
            runScripts: "dangerously",
            beforeParse(window) {
                // Mock Tailwind
                window.tailwind = { config: {} };

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

                // Mock Firebase
                window.firebase = {
                    initializeApp: jest.fn(),
                    database: jest.fn(() => ({
                        ref: jest.fn()
                    })),
                    auth: jest.fn(() => ({
                        onAuthStateChanged: jest.fn()
                    }))
                };
            }
        });
        window = dom.window;
    });

    it('should save data to local storage when user is null', () => {
        // Mock updateUI
        window.eval('updateUI = function() {}');

        window.eval(`
            storeData = { "2023-10-27": { sales: [] } };
            currentUser = null;
            saveData();
        `);

        const savedData = JSON.parse(window.localStorage.getItem('asifBeddingData_local'));
        expect(savedData).toEqual({ "2023-10-27": { sales: [] } });
    });

    it('should save data to local storage and firebase when user exists', () => {
        window.eval('updateUI = function() {}');

        window.mockSet = jest.fn().mockResolvedValue();

        window.eval(`
            storeData = { "2023-10-27": { expenses: [] } };
            currentUser = { uid: 'user123' };
            isFirebaseConfigured = true;
            dbRef = { set: window.mockSet };
            saveData();
        `);

        const savedData = JSON.parse(window.localStorage.getItem('asifBeddingData_user123'));
        expect(savedData).toEqual({ "2023-10-27": { expenses: [] } });
        expect(window.mockSet).toHaveBeenCalledWith({ "2023-10-27": { expenses: [] } });
    });

    it('should handle firebase sync error gracefully', async () => {
        window.eval('updateUI = function() {}');

        window.mockSet = jest.fn().mockRejectedValue(new Error('Sync Error'));

        const consoleSpy = jest.spyOn(window.console, 'error').mockImplementation(() => {});

        window.eval(`
            storeData = { "2023-10-27": { mokam: [] } };
            currentUser = { uid: 'user123' };
            isFirebaseConfigured = true;
            dbRef = { set: window.mockSet };
            saveData();
        `);

        // Wait for next tick so promise rejection can be handled
        await new Promise(process.nextTick);

        const savedData = JSON.parse(window.localStorage.getItem('asifBeddingData_user123'));
        expect(savedData).toEqual({ "2023-10-27": { mokam: [] } });
        expect(window.mockSet).toHaveBeenCalledWith({ "2023-10-27": { mokam: [] } });
        expect(consoleSpy).toHaveBeenCalledWith("Firebase Sync Error:", expect.any(Error));

        consoleSpy.mockRestore();
    });
});