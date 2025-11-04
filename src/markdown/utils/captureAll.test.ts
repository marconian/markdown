import { describe, expect, it } from 'vitest';
import { captureAll } from './captureAll';

describe('captureAll', () => {
    it('captures named groups across multiple matches with position metadata', () => {
        const text = 'foo baz bar foo';
        const regex = /(?<token>foo|bar)/g;

        const result = captureAll(regex, text);

        expect(result).not.toBeNull();
        expect(result?.captures).toHaveLength(3);
        expect(result?.captures.map((capture) => capture.groups?.['token'] ?? null)).toEqual(['foo', 'bar', 'foo']);
        expect(result?.startIndex).toBe(0);
        expect(result?.endIndex).toBe(15);
        expect(result?.length).toBe(15);
        expect(result?.captures[1]?.index).toBe(8);
        expect(result?.captures[2]?.length).toBe(3);
    });

    it('returns null when no matches with named groups are present', () => {
        const regex = /(?<digits>\d+)/g;
        const result = captureAll(regex, 'no numbers here');

        expect(result).toBeNull();
    });
});
