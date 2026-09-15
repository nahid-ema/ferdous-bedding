const { escapeHtml } = require('./utils');

describe('escapeHtml utility function', () => {
    test('Happy path: regular text without special characters', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
        expect(escapeHtml('This is a test.')).toBe('This is a test.');
    });

    test('Edge cases: non-string inputs', () => {
        expect(escapeHtml(null)).toBe('null');
        expect(escapeHtml(undefined)).toBe('undefined');
        expect(escapeHtml('')).toBe('');
        expect(escapeHtml(12345)).toBe('12345');
        expect(escapeHtml(true)).toBe('true');
    });

    test('Specific conditions: replacing special characters', () => {
        // Ampersand
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');

        // Less than, Greater than
        expect(escapeHtml('5 < 10 && 10 > 5')).toBe('5 &lt; 10 &amp;&amp; 10 &gt; 5');

        // Quotes
        expect(escapeHtml('"Double Quotes"')).toBe('&quot;Double Quotes&quot;');
        expect(escapeHtml("'Single Quotes'")).toBe('&#039;Single Quotes&#039;');

        // Mixed characters
        expect(escapeHtml('<script>alert("XSS & test\'s");</script>')).toBe('&lt;script&gt;alert(&quot;XSS &amp; test&#039;s&quot;);&lt;/script&gt;');
    });
});
