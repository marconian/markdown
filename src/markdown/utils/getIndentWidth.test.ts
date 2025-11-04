import { describe, expect, it } from 'vitest';
import { getIndentWidth } from './getIndentWidth';

describe('getIndentWidth', () => {
    it('counts the width introduced by spaces and stops at non-whitespace characters', () => {
        expect(getIndentWidth('    text')).toBe(4);
        expect(getIndentWidth('  text')).toBe(2);
        expect(getIndentWidth('text')).toBe(0);
    });

    it('treats tabs as four spaces and combines with leading spaces', () => {
        expect(getIndentWidth('\tvalue')).toBe(4);
        expect(getIndentWidth(' \tvalue')).toBe(5);
        expect(getIndentWidth('  \tvalue')).toBe(6);
    });
});
