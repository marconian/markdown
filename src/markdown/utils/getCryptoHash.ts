// Lightweight, synchronous string hash suitable for generating stable keys in the browser.
// Not cryptographically secure (replaces Node 'crypto' to avoid bundling server APIs client-side).
function getCryptoHash(input: string) {
    let h1 = 0xdeadbeef ^ input.length;
    let h2 = 0x41c6ce57 ^ input.length;
    for (let i = 0; i < input.length; i++) {
        const ch = input.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = (h1 ^ (h1 >>> 16)) >>> 0;
    h2 = (h2 ^ (h2 >>> 16)) >>> 0;
    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

export default getCryptoHash;
