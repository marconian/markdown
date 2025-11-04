import { describe, expect, it } from 'vitest';
import { stripIndent } from './stripIndent';

describe('stripIndent', () => {
    it('removes up to the requested width using spaces and tabs interchangeably', () => {
        expect(stripIndent('    value', 2)).toBe('  value');
        expect(stripIndent('\t\tvalue', 4)).toBe('\tvalue');
        expect(stripIndent(' \t mixed', 3)).toBe(' mixed');
    });

    it('returns the original string when width is zero or no indent is present', () => {
        expect(stripIndent('value', 4)).toBe('value');
        expect(stripIndent('  value', 0)).toBe('  value');
    });
});
