import { describe, expect, it } from 'vitest';
import { getBackRefs } from './getBackRefs';
import type CodeBackRef from '../models/CodeBackRef';
import type FootnoteBackRef from '../models/FootnoteBackRef';
import type LinkBackRef from '../models/LinkBackRef';

type BackRef = LinkBackRef | FootnoteBackRef | CodeBackRef;

function isCodeBackRef(ref: BackRef): ref is CodeBackRef {
    return (ref as CodeBackRef).code !== undefined;
}

function isFootnoteBackRef(ref: BackRef): ref is FootnoteBackRef {
    return (ref as FootnoteBackRef).index !== undefined;
}

function isLinkBackRef(ref: BackRef): ref is LinkBackRef {
    return (ref as LinkBackRef).url !== undefined;
}

describe('getBackRefs', () => {
    it('extracts code fences, footnotes, and reference links', () => {
        const markdown = [
            '```ts',
            'const value = 42;',
            '```',
            '',
            'Some text with[^note] and [ref-link][ref].',
            '',
            '[^note]: Footnote detail',
            '[ref]: https://example.com "Example"',
        ].join('\n');

        const { text, refs } = getBackRefs(markdown);

        expect(text).not.toContain('```ts');
        expect(text).toMatch(/\[_\]\[[^\]]+\]/);
        expect(text).not.toContain('[^note]:');
        expect(text).not.toContain('[ref]:');

        const values = Object.values(refs) as BackRef[];

        const codeRefs = values.filter(isCodeBackRef);
        expect(codeRefs).toHaveLength(1);
        expect(codeRefs[0]?.code).toBe('const value = 42;');
        expect(codeRefs[0]?.language).toBe('ts');

        const footnoteRefs = values.filter(isFootnoteBackRef);
        const uniqueFootnoteRefs = Array.from(new Map(footnoteRefs.map((ref) => [ref.name, ref])).values());
        expect(uniqueFootnoteRefs).toHaveLength(1);
        const [footnoteRef] = uniqueFootnoteRefs;
        expect(footnoteRef?.name).toBe('note');
        expect(footnoteRef?.label).toBe('Footnote detail');
        expect(footnoteRef?.index).toBe(1);

        const linkRefs = values.filter(isLinkBackRef);
        expect(linkRefs).toHaveLength(1);
        expect(linkRefs[0]?.url).toBe('https://example.com');
        expect(linkRefs[0]?.label).toBe('Example');
    });

    it('preserves language metadata and handles multiple code fences', () => {
        const markdown = ['```python {.highlight}', 'print("hi")', '```', '', '```', 'plain text', '```'].join('\n');

        const { text, refs } = getBackRefs(markdown);

        const markers = text.match(/\[_\]\[[^\]]+\]/g) ?? [];
        expect(markers).toHaveLength(2);

        const values = Object.values(refs) as BackRef[];
        const codeRefs = values.filter(isCodeBackRef);
        expect(codeRefs).toHaveLength(2);

        const pythonRef = codeRefs.find((ref) => ref.language === 'python');
        expect(pythonRef?.code).toBe('print("hi")');

        const plainRef = codeRefs.find((ref) => ref.language === undefined);
        expect(plainRef?.code).toBe('plain text');
    });

    it('rewrites multi-line footnotes with indentation preserved', () => {
        const markdown = ['Content with note[^multi].', '', '[^multi]: First line', '    second line', '\tthird line'].join('\n');

        const { text, refs } = getBackRefs(markdown);

        expect(text).not.toContain('[^multi]:');
        expect(text.match(/\[_\]\[[^\]]+\]/g)).not.toBeNull();

        const values = Object.values(refs) as BackRef[];
        const footnoteRefs = values.filter(isFootnoteBackRef);
        const uniqueFootnoteRefs = Array.from(new Map(footnoteRefs.map((ref) => [ref.name, ref])).values());
        expect(uniqueFootnoteRefs).toHaveLength(1);
        const [footnote] = uniqueFootnoteRefs;
        expect(footnote.label).toContain('First line');
        expect(footnote.label).toContain('second line');
        expect(footnote.label).toContain('third line');
    });
});
