import { render, screen } from '@testing-library/react';
import Markdown from '../Markdown';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('Markdown inline formatting', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders inline formatting, emoji, and inline code', () => {
        const markdown = '***deep*** **bold** *italic* ~~strike~~ ==mark== ++insert++ H~2~O x^2^ :smile: :missing: `const x = 1`';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const boldItalic = container.querySelector('b i');
        expect(boldItalic).not.toBeNull();
        expect(boldItalic).toHaveTextContent('deep');
        expect(screen.getByText('bold', { selector: 'b' })).toBeInTheDocument();
        expect(screen.getByText('italic', { selector: 'i' })).toBeInTheDocument();
        expect(screen.getByText('strike', { selector: 's' })).toBeInTheDocument();
        expect(screen.getByText('mark', { selector: 'mark' })).toBeInTheDocument();
        expect(screen.getByText('insert', { selector: 'ins' })).toBeInTheDocument();
        expect(screen.getByText('2', { selector: 'sub' })).toBeInTheDocument();
        expect(screen.getByText('2', { selector: 'sup' })).toBeInTheDocument();

        const emoji = screen.getByRole('img', { name: 'smile' });
        expect(emoji).toBeInTheDocument();
        const unknownEmoji = Array.from(container.querySelectorAll('i')).find((node) => node.textContent === 'missing');
        expect(unknownEmoji).not.toBeUndefined();

        const inlineCode = screen.getByText('const x = 1', { selector: 'code' });
        expect(inlineCode).toBeInTheDocument();

        const codeNodes = container.querySelectorAll('code');
        expect(codeNodes).toHaveLength(1);
        expect(container.textContent).not.toContain('***deep***');
        expect(container.textContent).not.toContain('**bold**');
        expect(container.textContent).not.toContain('*italic*');
        expect(container.textContent).not.toContain('~~strike~~');
        expect(container.textContent).not.toContain('==mark==');
        expect(container.textContent).not.toContain('++insert++');
        expect(container.textContent).not.toContain('^2^');
        expect(container.textContent).not.toContain('~2~');
    });

    it('renders inline emphasis correctly when bold wraps inline code', () => {
        const markdown = '___combo___ __bold__ _italic_ **bold `code` text**';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const combo = container.querySelectorAll('b i');
        expect(combo).toHaveLength(1);
        expect(combo[0]).toHaveTextContent('combo');

        const bolds = Array.from(container.querySelectorAll('b'));
        expect(bolds.some((node) => node.textContent?.trim() === 'bold')).toBe(true);

        const codeInsideBold = container.querySelector('b code');
        expect(codeInsideBold).not.toBeNull();
        expect(codeInsideBold?.textContent).toBe('code');

        const italicTexts = Array.from(container.querySelectorAll('i')).map((node) => node.textContent?.trim());
        expect(italicTexts).toContain('italic');
    });

    it('supports italic emphasis nested inside bold spans', () => {
        const markdown = '**escaped characters, *and* repeated**';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const bold = container.querySelector('b');
        expect(bold).not.toBeNull();
        expect(bold?.textContent).toContain('escaped characters,');

        const nestedItalic = bold?.querySelector('i');
        expect(nestedItalic).not.toBeNull();
        expect(nestedItalic?.textContent).toBe('and');
    });

    it('keeps inline code inside bold content once nested tokens are supported', () => {
        const markdown = 'Mixing **bold text with `inline code` inside** the sentence.';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const bold = container.querySelector('b');
        expect(bold).not.toBeNull();
        expect(bold?.textContent).toContain('bold text with');

        const inlineCode = bold?.querySelector('code');
        expect(inlineCode).not.toBeNull();
        expect(inlineCode?.textContent).toBe('inline code');

        const codeElementsOutsideBold = container.querySelectorAll(':scope > code');
        expect(codeElementsOutsideBold.length).toBe(0);
    });

    it('supports inline code spans using multiple backticks with interior tick escaping', () => {
        const markdown = 'Inline ``code with `backticks` inside`` remains intact.';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const code = screen.getByText('code with `backticks` inside', { selector: 'code' });
        expect(code).toBeInTheDocument();
        expect(container.textContent).not.toContain('``code');
        expect(container.textContent).not.toContain('`` remains');
    });
});
