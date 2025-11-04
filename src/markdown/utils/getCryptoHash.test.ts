import { describe, expect, it } from 'vitest';
import getCryptoHash from './getCryptoHash';

describe('getCryptoHash', () => {
    it('produces a deterministic 16-character hexadecimal hash', () => {
        const value = getCryptoHash('markdown-key');
        expect(value).toMatch(/^[0-9a-f]{16}$/);
        expect(getCryptoHash('markdown-key')).toBe(value);
    });

    it('produces distinct hashes for different inputs', () => {
        const first = getCryptoHash('content-a');
        const second = getCryptoHash('content-b');
        expect(first).not.toBe(second);
    });
});
