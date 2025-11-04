import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import Markdown from './Markdown';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import katex from 'katex';

const { highlightElement } = vi.hoisted(() => ({
    highlightElement: vi.fn(),
}));

const { mermaidParse, mermaidRender } = vi.hoisted(() => ({
    mermaidParse: vi.fn().mockResolvedValue(true),
    mermaidRender: vi.fn().mockResolvedValue({
        svg: '<svg data-testid="mermaid-diagram"></svg>',
        bindFunctions: vi.fn(),
    }),
}));

vi.mock('highlight.js', () => ({
    default: {
        highlightElement,
    },
}));

vi.mock('@mui/x-data-grid/esm/index.css', () => ({}));

vi.mock('@mui/x-data-grid', () => ({
    DataGrid: ({
        rows,
        columns,
    }: {
        rows: Array<Record<string, unknown>>;
        columns: Array<{
            field: string;
            headerName: string;
            renderHeader?: (params: { colDef: Record<string, unknown> }) => ReactNode;
            renderCell?: (params: { value: unknown; row: Record<string, unknown>; colDef: Record<string, unknown> }) => ReactNode;
        }>;
    }) => (
        <table data-testid="mock-data-grid">
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col.field} scope="col">
                            {col.renderHeader ? col.renderHeader({ colDef: col }) : col.headerName}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={(row.id as string) ?? JSON.stringify(row)}>
                        {columns.map((col) => (
                            <td key={col.field}>
                                {col.renderCell
                                    ? col.renderCell({
                                          value: row[col.field],
                                          row,
                                          colDef: col,
                                      })
                                    : (row[col.field] as ReactNode)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    ),
}));

vi.mock('mermaid', () => ({
    default: {
        parse: mermaidParse,
        render: mermaidRender,
    },
}));

describe('Markdown', () => {
    beforeEach(() => {
        highlightElement.mockClear();
        mermaidParse.mockClear();
        mermaidRender.mockClear();
    });

    it('renders plain text with explicit line breaks', () => {
        const { container } = render(<Markdown>{'Hello\nWorld'}</Markdown>);

        const root = container.querySelector('.markdown-paper');
        expect(root).not.toBeNull();
        expect(root).toHaveTextContent('Hello');
        expect(root).toHaveTextContent('World');
        expect(root?.querySelectorAll('br')).toHaveLength(1);
    });

    it('splits multiple paragraphs into individual blocks', () => {
        const { container } = render(<Markdown>{'First paragraph.\n\nSecond paragraph.'}</Markdown>);
        const paragraphs = container.querySelectorAll('.mb-3');

        expect(paragraphs).toHaveLength(2);
        expect(paragraphs[0]).toHaveTextContent('First paragraph.');
        expect(paragraphs[1]).toHaveTextContent('Second paragraph.');
    });

    it('renders headings with appropriate semantic levels', () => {
        render(<Markdown>{'# Heading One\n\n### Heading Three'}</Markdown>);
        const headings = screen.getAllByRole('heading');

        expect(headings).toHaveLength(2);
        expect(headings[0].tagName).toBe('H1');
        expect(headings[0]).toHaveTextContent('Heading One');
        expect(headings[1].tagName).toBe('H3');
        expect(headings[1]).toHaveTextContent('Heading Three');
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

    it('renders different link types and referenced images', () => {
        const markdown = [
            '[inline](https://example.com "Example")',
            'https://example.org',
            '[ref-link][ref]',
            '![Alt text][img]',
            '',
            '[ref]: https://ref.example/path "Ref Label"',
            '[img]: https://example.com/image.png "Alt text"',
        ].join('\n\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const inlineLink = screen.getByRole('link', { name: 'inline' });
        expect(inlineLink).toHaveAttribute('href', 'https://example.com');
        expect(inlineLink).toHaveAttribute('target', '_blank');
        expect(inlineLink).toHaveAttribute('title', 'Example');

        const autoLink = screen.getByRole('link', { name: 'https://example.org' });
        expect(autoLink).toHaveAttribute('href', 'https://example.org');

        const referencedLink = screen.getByRole('link', { name: 'ref-link' });
        expect(referencedLink).toHaveAttribute('href', 'https://ref.example/path');
        expect(referencedLink).toHaveAttribute('title', 'Ref Label');

        const image = screen.getByRole('img', { name: 'Alt text' });
        expect(image).toHaveAttribute('src', 'https://example.com/image.png');
        expect(image).toHaveAttribute('alt', 'Alt text');

        const downloadLink = screen.getByRole('link', { name: /download/i });
        expect(downloadLink).toHaveAttribute('href', 'https://example.com/image.png');

        const links = screen.getAllByRole('link');
        const hrefs = links.map((link) => link.getAttribute('href'));
        expect(hrefs.filter(Boolean).sort()).toEqual(['https://example.com', 'https://example.com/image.png', 'https://example.org', 'https://ref.example/path'].sort());
        expect(container.textContent).not.toContain('[ref]');
        expect(container.textContent).not.toContain('[img]');
    });

    it('renders inline links and images with single-quoted titles', () => {
        const markdown = ["[single quote](https://example.com 'Label')", "![Inline Image](https://example.com/image.jpg 'Inline alt')"].join('\n\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const link = screen.getByRole('link', { name: 'single quote' });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('title', 'Label');

        const anchors = screen.getAllByRole('link');
        expect(anchors).toHaveLength(2);
        const anchorHrefs = anchors.map((node) => node.getAttribute('href'));
        expect(new Set(anchorHrefs)).toEqual(new Set(['https://example.com', 'https://example.com/image.jpg']));

        const image = container.querySelector('img[alt="Inline alt"]');
        expect(image).not.toBeNull();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
        expect(image).toHaveAttribute('title', 'Inline Image');
        expect(container.querySelectorAll('img')).toHaveLength(1);
    });

    it('renders ordered, nested, and task lists', () => {
        const markdown = `1. First item\n2. Second item\n   - Nested bullet\n\n- [x] Done\n- [ ] Todo`;
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const orderedList = container.querySelector('ol');
        expect(orderedList).not.toBeNull();
        const orderedItems = Array.from((orderedList as HTMLElement).querySelectorAll('li[value]'));
        expect(orderedItems).toHaveLength(2);
        expect(orderedItems[0]).toHaveTextContent(/^First item$/);
        expect(orderedItems[0]).toHaveAttribute('value', '1');
        expect(orderedItems[1]).toHaveTextContent(/^Second item/);
        expect(orderedItems[1]).toHaveAttribute('value', '2');
        expect((orderedList as HTMLElement).querySelector('ul')).not.toBeNull();

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).not.toBeChecked();
        expect(container.querySelectorAll('.code-block')).toHaveLength(0);
    });

    it('keeps tightly indented nested list content from being promoted to code blocks', () => {
        const markdown = [
            '- Parent item',
            '  - Child bullet',
            '    still child text',
            '- Second root',
            '',
            '1. First number',
            '   1. Nested number',
            '     continues nested number',
            '2. Second number',
        ].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        expect(container.querySelectorAll('.code-block')).toHaveLength(0);

        const unordered = container.querySelector('ul');
        expect(unordered).not.toBeNull();
        const unorderedItems = Array.from((unordered as HTMLElement).children);
        expect(unorderedItems).toHaveLength(2);
        const nestedBullet = unorderedItems[0]?.querySelector('ul li');
        expect(nestedBullet).not.toBeNull();
        expect(nestedBullet).toHaveTextContent(/Child bullet\s+still child text/);
        expect(nestedBullet?.querySelector('.code-block')).toBeNull();

        const ordered = container.querySelector('ol');
        expect(ordered).not.toBeNull();
        const orderedTopLevel = Array.from((ordered as HTMLElement).children);
        expect(orderedTopLevel).toHaveLength(2);
        const nestedNumber = orderedTopLevel[0]?.querySelector('ol li');
        expect(nestedNumber).not.toBeNull();
        expect(nestedNumber).toHaveTextContent(/Nested number\s+continues nested number/);
        expect(nestedNumber?.querySelector('.code-block')).toBeNull();
    });

    it('renders block quotes with optional author footer', () => {
        const markdown = '> Be yourself; everyone else is already taken.\n> "Oscar Wilde"';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const blockquote = container.querySelector('blockquote');
        expect(blockquote).not.toBeNull();
        expect(blockquote).toHaveTextContent('Be yourself; everyone else is already taken.');

        const cite = container.querySelector('cite');
        expect(cite).not.toBeNull();
        expect(cite).toHaveTextContent('Oscar Wilde');
        expect(container.querySelectorAll('cite')).toHaveLength(1);
        expect(cite?.textContent?.trim()).toBe('Oscar Wilde');
    });

    it('renders footnotes and provides fallback for missing references', () => {
        const markdown = `Content with note[^1] and missing note[^missing].\n\n[^1]: Known footnote text.`;
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const footnoteLink = container.querySelector('sup.markdown-footnote-link a[href="#1"]');
        expect(footnoteLink).not.toBeNull();
        expect(footnoteLink).toHaveTextContent('1');

        const missingFootnote = container.querySelector('sup.markdown-footnote-link a[href="#missing"]');
        expect(missingFootnote).not.toBeNull();
        expect(missingFootnote).toHaveTextContent('?');

        const footnoteList = container.querySelector('ol');
        expect(footnoteList).not.toBeNull();
        expect(footnoteList).toHaveTextContent('Known footnote text.');
        expect(container.querySelectorAll('sup.markdown-footnote-link')).toHaveLength(2);
        expect(container.textContent).not.toContain('[^1]');
        expect(container.textContent).not.toContain('[^missing]');
    });

    it('renders fenced code blocks with syntax highlighting metadata', async () => {
        const markdown = ['```ts', 'const answer = 42;', '```'].join('\n');
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(within(codeBlock as HTMLElement).getByText('ts')).toBeInTheDocument();
        expect(within(codeBlock as HTMLElement).getByText('copy')).toBeInTheDocument();
        expect(codeBlock?.textContent).toContain('const answer = 42;');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('renders mermaid diagrams for mermaid code fences', async () => {
        const definition = 'graph TD; A-->B;';
        const markdown = ['```mermaid', definition, '```'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        await waitFor(() => {
            expect(mermaidParse).toHaveBeenCalledWith(definition);
            expect(mermaidRender).toHaveBeenCalled();
        });

        expect(screen.getByTestId('mermaid-diagram')).toBeInTheDocument();
    });

    it('renders markdown tables using the data grid', () => {
        const markdown = ['| Col A | Col B |', '| --- | --- |', '| Cell A | Cell B |'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const grid = screen.getByTestId('mock-data-grid');
        const headers = within(grid).getAllByRole('columnheader');
        expect(headers.map((header) => header.textContent?.trim())).toEqual(['Col A', 'Col B']);

        const cells = within(grid).getAllByRole('cell');
        expect(cells.map((cell) => cell.textContent?.trim())).toEqual(['Cell A', 'Cell B']);
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

        // Ensure the inline code node lives inside the bold wrapper
        const codeElementsOutsideBold = container.querySelectorAll(':scope > code');
        expect(codeElementsOutsideBold.length).toBe(0);
    });

    it('renders setext headings formed with underlines as semantic h1/h2 elements', () => {
        const markdown = ['Setext Alpha', '=======', '', 'Setext Beta', '-------'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const headings = screen.getAllByRole('heading');
        expect(headings).toHaveLength(2);
        expect(headings[0].tagName).toBe('H1');
        expect(headings[0]).toHaveTextContent('Setext Alpha');
        expect(headings[1].tagName).toBe('H2');
        expect(headings[1]).toHaveTextContent('Setext Beta');
    });
    it('supports fenced code blocks delimited by tildes', async () => {
        const markdown = ['~~~python', 'print("hi")', '~~~'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(within(codeBlock as HTMLElement).getByText('python')).toBeInTheDocument();
        expect(within(codeBlock as HTMLElement).getByText('copy')).toBeInTheDocument();
        expect(codeBlock?.textContent).toContain('print("hi")');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('parses fenced code info strings containing punctuation or attributes', async () => {
        const markdown = ['```c++ {.lang .highlight}', 'std::cout << "ok";', '```'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(within(codeBlock as HTMLElement).getByText('c++')).toBeInTheDocument();
        expect(codeBlock?.textContent).toContain('std::cout << "ok";');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('renders fenced code blocks without a language identifier', async () => {
        const markdown = ['```', 'raw text', '```'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(codeBlock?.querySelector('.code-block-title strong')).toBeNull();
        expect(codeBlock?.textContent).toContain('raw text');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('treats four-space indented blocks as code when not inside lists', async () => {
        const markdown = ['    line one', '    line two'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(codeBlock?.textContent).toContain('line one');
        expect(codeBlock?.textContent).toContain('line two');
        expect(codeBlock?.textContent).not.toContain('    ');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('accepts atx headings without a separating space and trims trailing hashes', () => {
        const markdown = ['#Heading###', '##Subheading ##'].join('\n\n');

        render(<Markdown>{markdown}</Markdown>);

        const headings = screen.getAllByRole('heading');
        expect(headings).toHaveLength(2);
        expect(headings[0].tagName).toBe('H1');
        expect(headings[0]).toHaveTextContent('Heading');
        expect(headings[1].tagName).toBe('H2');
        expect(headings[1]).toHaveTextContent('Subheading');
    });
    it('converts angle-bracket autolinks into anchors', () => {
        const markdown = ['<https://example.com/path?query=1>', '<mailto:team@example.com>', 'Reach us at <angle@example.org> for details.'].join('\n\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const webLink = screen.getByRole('link', { name: 'https://example.com/path?query=1' });
        expect(webLink).toHaveAttribute('href', 'https://example.com/path?query=1');
        expect(webLink).toHaveAttribute('target', '_blank');

        const mailtoLink = screen.getByRole('link', { name: 'team@example.com' });
        expect(mailtoLink).toHaveAttribute('href', 'mailto:team@example.com');
        expect(mailtoLink).toHaveAttribute('target', '_blank');

        const bareEmailLink = screen.getByRole('link', { name: 'angle@example.org' });
        expect(bareEmailLink).toHaveAttribute('href', 'mailto:angle@example.org');
        expect(bareEmailLink).toHaveAttribute('target', '_blank');
        expect(container.querySelector('blockquote')).toBeNull();
        expect(container.textContent).toContain('for details.');
    });

    it('converts bare www links into anchors with https scheme', () => {
        const markdown = 'Visit www.example.com for more info.';

        render(<Markdown>{markdown}</Markdown>);

        const link = screen.getByRole('link', { name: 'www.example.com' });
        expect(link).toHaveAttribute('href', 'https://www.example.com');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('converts bare email addresses into mailto links', () => {
        const markdown = 'Contact support@example.com for help.';

        render(<Markdown>{markdown}</Markdown>);

        const link = screen.getByRole('link', { name: 'support@example.com' });
        expect(link).toHaveAttribute('href', 'mailto:support@example.com');
    });
    it('supports inline code spans using multiple backticks with interior tick escaping', () => {
        const markdown = 'Inline ``code with `backticks` inside`` remains intact.';

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const code = screen.getByText('code with `backticks` inside', { selector: 'code' });
        expect(code).toBeInTheDocument();
        expect(container.textContent).not.toContain('``code');
        expect(container.textContent).not.toContain('`` remains');
    });

    it('parses reference-style links with single-quoted or parenthesized titles', () => {
        const markdown = [
            '[single][s-ref] and [paren][p-ref]',
            '',
            "[s-ref]: https://example.com 'Single quoted title'",
            '[p-ref]: https://example.org (Parenthesized Title)',
        ].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const singleLink = screen.getByRole('link', { name: 'single' });
        expect(singleLink).toHaveAttribute('href', 'https://example.com');
        expect(singleLink).toHaveAttribute('title', 'Single quoted title');

        const parenLink = screen.getByRole('link', { name: 'paren' });
        expect(parenLink).toHaveAttribute('href', 'https://example.org');
        expect(parenLink).toHaveAttribute('title', 'Parenthesized Title');
    });

    it('parses multi-line footnote definitions and preserves their formatting', () => {
        const markdown = ['A note reference[^multi].', '', '[^multi]: First line of footnote', '    continued on the next line', '    and another line.'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const footnote = container.querySelector('ol');
        expect(footnote).not.toBeNull();
        expect(footnote?.textContent).toContain('First line of footnote');
        expect(footnote?.textContent).toContain('continued on the next line');
        expect(footnote?.textContent).toContain('and another line.');

        const footnoteItem = container.querySelector('ol li');
        expect(footnoteItem).not.toBeNull();
        expect(footnoteItem?.id).toBe('1');
        expect(footnoteItem?.querySelector('.code-block')).toBeNull();
    });

    it('renders minimally indented footnote definitions without creating code blocks', () => {
        const markdown = ['Content with note[^note].', '', '[^note]: First line of footnote', '  continues on the next line', '  and finishes the thought.'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const footnoteItem = container.querySelector('ol li');
        expect(footnoteItem).not.toBeNull();
        expect(footnoteItem?.querySelector('pre, code, .code-block')).toBeNull();
        expect(footnoteItem).toHaveTextContent('First line of footnote');
        expect(footnoteItem).toHaveTextContent('continues on the next line');
        expect(footnoteItem).toHaveTextContent('finishes the thought');
    });

    it('keeps nested blockquotes, fenced code, and definition lists inside list items', () => {
        const markdown = [
            '- Parent item referencing[^list-note]',
            '  - Blockquote branch:',
            '    ',
            '    > Nested quote with note[^list-note]',
            '  - Fenced code branch:',
            '    ',
            '    ```yaml',
            '    key: value',
            '    ```',
            '  - Definition branch:',
            '  ',
            '  Term',
            '  : Definition inside list.',
            '',
            '[^list-note]: Multi-line note',
            '  continuation line.',
        ].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const nestedBlockquote = container.querySelector('li blockquote');
        expect(nestedBlockquote).not.toBeNull();
        expect(nestedBlockquote?.textContent).toContain('Nested quote');

        const codeBlocks = Array.from(container.querySelectorAll('.code-block pre'));
        expect(codeBlocks.length).toBeGreaterThan(0);
        expect(codeBlocks.some((node) => node.textContent?.includes('key: value'))).toBe(true);
        expect(codeBlocks.some((node) => node.textContent?.includes('[_]['))).toBe(false);

        const definitionList = container.querySelector('li dl');
        expect(definitionList).not.toBeNull();
        expect(definitionList?.textContent).toContain('Definition inside list.');

        const footnoteItem = container.querySelector('ol li');
        expect(footnoteItem).not.toBeNull();
        expect(footnoteItem?.querySelector('pre, code, .code-block')).toBeNull();
        expect(footnoteItem).toHaveTextContent('Multi-line note');
        expect(footnoteItem).toHaveTextContent('continuation line');
    });

    it('renders mixed footnote scenarios within ordered lists without promoting continuations to code blocks', () => {
        const markdown = [
            '### Mixed Footnotes Within Lists',
            '',
            '1. Primary list item that references a shared note[^list-note].',
            '   - Nested bullet keeps inline math $a^2 + b^2 = c^2$ while also pointing at the same footnote[^list-note].',
            '   - Another nested bullet mixes autolinks https://tauw.com and inline `code` before calling a different footnote[^html-note].',
            '   - Blockquote inside the list:',
            '',
            '    > This quote sits inside a bullet and repeats the note reference[^html-note].',
            '',
            '   - Indented fenced code should remain within the list context:',
            '',
            '    ```yaml',
            '    list: preserves',
            '    indentation: true',
            '    footnote: "[^list-note]"',
            '    ```',
            '',
            '2. Second list item wraps a spoiler ||sensitive detail|| and embeds a definition list term:',
            '',
            '  Term',
            '  : Definition nested under a list item.',
            '',
            '3. Third list item ends with consecutive references[^screenshot][^recursive] to ensure numbering stays intact.',
            '',
            '[^list-note]:',
            '    ```json',
            '    {',
            '      "source": "nested list",',
            '      "items": [1, 2, 3]',
            '    }',
            '    ```',
            '    1. First point inside the footnote continues on the next line',
            '       without turning into a code block.',
            '    2. Second point contains a nested unordered list:',
            '       - Bullet A with **bold** emphasis',
            '       - Bullet B referencing the other note[^admonition-note]',
            '    > [!WARNING]',
            '    > Alerts can appear inside footnotes too.',
            '',
            '[^html-note]:',
            '    Mixed content footnote that embeds inline HTML <mark>highlight</mark>,',
            '    a task list, and raw autolinks.',
            '    - [x] Completed task inside a footnote',
            '    - [ ] Pending task waiting for render fixes',
            '    Bare URL: www.tauw.nl',
            '    Back-to-back emoji shortcodes :hammer_and_pick::sparkles:.',
            '',
            '[^admonition-note]:',
            '    Spoiler content ||hidden|| lives here alongside a tilde fence:',
            '',
            '    ~~~bash',
            '    echo "Footnote fence"',
            '    ~~~',
            '',
            '    Blockquote chunk follows:',
            '',
            '    > Footnote quote referencing itself[^admonition-note].',
            '',
            '[^recursive]:',
            '    Footnote that references another footnote[^multi] and includes inline math $\\alpha + \\beta$.',
            '',
            '[^screenshot]:',
            '    1. First line of the footnote mirrors the UI screenshot.',
            '       continues on the second line',
            '       and finishes on the third line with trailing whitespace.  ',
            '    2. Second line mixes `code`, <abbr title="HyperText Markup Language">HTML</abbr>, and \\<escaped characters\\>.',
            '',
            '[^multi]: Referenced by recursive note to ensure availability.',
        ].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const topLevelOrderedList = container.querySelector('.markdown-paper > ol');
        expect(topLevelOrderedList).not.toBeNull();

        const listCodeBlocks = Array.from(topLevelOrderedList?.querySelectorAll(':scope .code-block pre') ?? []);
        expect(listCodeBlocks).toHaveLength(1);
        expect(listCodeBlocks[0]?.textContent).toContain('list: preserves');

        const strayCodePromotions = listCodeBlocks.filter((node) => (node.textContent ?? '').includes('This quote sits inside a bullet'));
        expect(strayCodePromotions).toHaveLength(0);

        const nestedBlockquote = topLevelOrderedList?.querySelector('li blockquote');
        expect(nestedBlockquote).not.toBeNull();
        expect(nestedBlockquote?.textContent).toContain('This quote sits inside a bullet');

        const nestedDefinition = topLevelOrderedList?.querySelector('li dl');
        expect(nestedDefinition).not.toBeNull();
        expect(nestedDefinition?.textContent).toContain('Definition nested under a list item.');

        const spoiler = topLevelOrderedList?.querySelector('li .markdown-spoiler');
        expect(spoiler).not.toBeNull();

        const footnoteItems = Array.from(container.querySelectorAll('ol li[id]'));
        expect(footnoteItems.length).toBeGreaterThan(0);

        const screenshotFootnote = footnoteItems.find((item) => (item.textContent ?? '').includes('escaped characters'));
        expect(screenshotFootnote).toBeDefined();

        const screenshotText = screenshotFootnote?.textContent ?? '';
        expect(screenshotText).toContain('<escaped characters>');
        expect(screenshotText).not.toContain('\\<');
        expect(screenshotText).not.toContain('\\>');

        const footnoteCodeBlocks = footnoteItems.flatMap((item) => Array.from(item.querySelectorAll('.code-block pre')));
        expect(footnoteCodeBlocks.length).toBeGreaterThan(0);
    });

    it('honors hard line breaks introduced by two trailing spaces or backslashes', () => {
        const markdown = ['First line  ', 'Second line\\', 'Third line'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const breaks = container.querySelectorAll('br');
        expect(breaks).toHaveLength(2);
        expect(container.textContent).toContain('First line');
        expect(container.textContent).toContain('Second line');
        expect(container.textContent).toContain('Third line');
        expect(container.innerHTML).not.toContain('Second line\\');
        expect(container.innerHTML).not.toContain('First line  <br');
    });

    it('decides how to render raw html blocks and inline tags consistently', () => {
        const markdown = ['Inline <strong>alert</strong> text.', '', '<div class="panel">', '  <p>Block content</p>', '</div>'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const inlineCode = screen.getByText('<strong>alert</strong>', { selector: 'code' });
        expect(inlineCode).toBeInTheDocument();

        const blocks = container.querySelectorAll('.code-block');
        expect(blocks.length).toBeGreaterThan(0);
        const combined = Array.from(blocks)
            .map((b) => b.textContent ?? '')
            .join('\n');
        expect(combined).toContain('<div class="panel">');
        expect(combined).toContain('<p>Block content</p>');
        expect(Array.from(blocks).some((block) => within(block as HTMLElement).queryByText('html'))).toBe(true);
    });

    it('renders definition lists with associated terms and descriptions', () => {
        const markdown = ['Term One', ': Definition one', ': Another meaning', '', 'Term Two', ': Second term definition'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const definitionList = container.querySelector('dl');
        expect(definitionList).not.toBeNull();

        const terms = definitionList?.querySelectorAll('dt') ?? [];
        expect(terms).toHaveLength(2);
        expect(terms[0]?.textContent).toBe('Term One');
        expect(terms[1]?.textContent).toBe('Term Two');

        const definitions = definitionList?.querySelectorAll('dd') ?? [];
        expect(definitions).toHaveLength(3);
        expect(definitions[0]?.textContent).toContain('Definition one');
        expect(definitions[1]?.textContent).toContain('Another meaning');
        expect(definitions[2]?.textContent).toContain('Second term definition');
    });

    it('groups raw html blocks into a single highlighted code block', () => {
        const markdown = ['<div class="panel">', '  <p>html body</p>', '</div>'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlocks = container.querySelectorAll('.code-block');
        expect(codeBlocks).toHaveLength(1);
        const codeText = codeBlocks[0]?.textContent ?? '';
        expect(codeText).toContain('<div class="panel">');
        expect(codeText).toContain('<p>html body</p>');
        expect(codeText).toContain('</div>');
    });

    it('renders admonition callouts such as > [!NOTE] as styled alert boxes', () => {
        const markdown = ['> [!NOTE]', '> This is important guidance.', '> Keep reading for more details.'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const admonition = screen.getByTestId('markdown-admonition-note');
        expect(admonition).toHaveClass('markdown-admonition');
        expect(admonition).toHaveClass('note');

        const title = within(admonition).getByText('Note');
        expect(title.tagName.toLowerCase()).toBe('strong');

        expect(admonition).toHaveTextContent('This is important guidance.');
        expect(admonition).toHaveTextContent('Keep reading for more details.');
    });

    it('falls back gracefully for unknown admonition labels and custom titles', () => {
        const markdown = ['> [!CUSTOM] Watch This', '> First line of content.', '> Second line with *formatting*.', '', '> [!WEIRD]', '> Body without explicit title.'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const customAdmonition = screen.getByTestId('markdown-admonition-custom');
        expect(customAdmonition).toHaveClass('markdown-admonition', 'custom');
        const customTitle = within(customAdmonition).getByText('Watch This');
        expect(customTitle.tagName).toBe('STRONG');
        expect(within(customAdmonition).getByText(/First line of content\./)).toBeInTheDocument();
        expect(within(customAdmonition).getByText('Second line with', { exact: false })).toBeInTheDocument();
        expect(within(customAdmonition).getByText('formatting', { selector: 'i' })).toBeInTheDocument();

        const fallbackAdmonition = screen.getByTestId('markdown-admonition-weird');
        expect(fallbackAdmonition).toHaveClass('markdown-admonition', 'weird');
        const fallbackTitle = within(fallbackAdmonition).getByText('Weird');
        expect(fallbackTitle.tagName).toBe('STRONG');
        expect(within(fallbackAdmonition).getByText('Body without explicit title.')).toBeInTheDocument();

        expect(container.textContent).not.toContain('[!CUSTOM]');
        expect(container.textContent).not.toContain('[!WEIRD]');
    });
    it('preserves escaped pipe characters inside markdown tables', () => {
        const markdown = ['| Feature | Notes |', '| --- | --- |', '| Escape \\| pipe | Keep literal symbol |'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const grid = screen.getByTestId('mock-data-grid');
        expect(grid).toBeInTheDocument();

        expect(within(grid).getByText('Escape | pipe')).toBeInTheDocument();
        expect(within(grid).getByText('Keep literal symbol')).toBeInTheDocument();
    });
    it('does not assign invalid start attributes to ordered list items', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const markdown = '3. Third\n6. Sixth';

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const orderedList = container.querySelector('ol');
        expect(orderedList).not.toBeNull();
        expect(orderedList).toHaveAttribute('start', '3');

        const items = within(orderedList as HTMLElement).getAllByRole('listitem');
        expect(items).toHaveLength(2);
        items.forEach((item) => {
            expect(item).not.toHaveAttribute('start');
        });
        expect(items[0]).toHaveAttribute('value', '3');
        expect(items[1]).toHaveAttribute('value', '6');

        const startWarnings = consoleError.mock.calls.some((call) =>
            call.some((message) => typeof message === 'string' && message.includes('Received NaN for the `start` attribute')),
        );
        expect(startWarnings).toBe(false);

        consoleError.mockRestore();
    });
    it('renders spoiler syntax like ||hidden|| with an explicit toggle or styling', () => {
        const markdown = 'Beware of ||hidden details|| in the text.';

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const spoiler = container.querySelector('.markdown-spoiler');
        expect(spoiler).not.toBeNull();
        expect(spoiler).toHaveAttribute('data-hidden', 'true');
        expect(spoiler?.textContent).toContain('hidden details');
    });

    it('renders nested task list items without falling back to code blocks', () => {
        const markdown = ['- [ ] Parent task', '  - [x] Child done', '    - [ ] Grandchild pending'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(3);
        expect(checkboxes[0]).not.toBeChecked();
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).not.toBeChecked();

        expect(container.querySelectorAll('.code-block')).toHaveLength(0);

        expect(screen.getByText('Child done')).toBeInTheDocument();
        expect(screen.getByText('Grandchild pending')).toBeInTheDocument();

        const topLevelTaskList = container.querySelector('ul');
        expect(topLevelTaskList).not.toBeNull();
        expect(topLevelTaskList).toHaveStyle('list-style-type: none; padding-left: 0');

        const nestedTaskList = topLevelTaskList?.querySelector('ul');
        expect(nestedTaskList).not.toBeNull();
        expect(nestedTaskList).toHaveStyle('list-style-type: none; padding-left: 1.5rem');

        const taskItems = container.querySelectorAll('li.markdown-task-list-item');
        taskItems.forEach((item) => {
            expect(item).toHaveStyle('list-style-type: none');
        });
    });

    it('detects nested checklist structure inside a standard dashed list', () => {
        const markdown = ['- [x] Completed task', '- [ ] Pending task', ' - [x] Nested done task', ' - [ ] Nested pending task'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const topLevelList = container.querySelector('ul');
        expect(topLevelList).not.toBeNull();

        const topLevelItems = topLevelList ? Array.from(topLevelList.querySelectorAll(':scope > li')) : [];
        expect(topLevelItems).toHaveLength(2);

        const secondItem = topLevelItems[1];
        expect(secondItem).toBeDefined();

        const nestedList = secondItem?.querySelector(':scope > ul');
        expect(nestedList).not.toBeNull();

        const nestedItems = nestedList ? Array.from(nestedList.querySelectorAll(':scope > li')) : [];
        expect(nestedItems).toHaveLength(2);
        expect(nestedItems[0]?.textContent).toContain('Nested done task');
        expect(nestedItems[1]?.textContent).toContain('Nested pending task');
    });

    it('renders bulletless task list blocks with nested items as interactive checkboxes', () => {
        const markdown = ['[x] Completed task', '[ ] Pending task', '  [x] Nested done task', '  [ ] Nested pending task'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const topLevelList = container.querySelector('ul');
        expect(topLevelList).not.toBeNull();
        expect(topLevelList?.querySelectorAll(':scope > li')).toHaveLength(2);
        expect(topLevelList).toHaveStyle('list-style-type: none; padding-left: 0');

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(4);
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).not.toBeChecked();
        expect(checkboxes[2]).toBeChecked();
        expect(checkboxes[3]).not.toBeChecked();

        const nestedList = topLevelList?.querySelector('ul');
        expect(nestedList).not.toBeNull();
        expect(nestedList).toHaveStyle('list-style-type: none; padding-left: 1.5rem');
        const nestedItems = nestedList?.querySelectorAll('li') ?? [];
        expect(nestedItems).toHaveLength(2);
        expect(nestedItems[0]?.textContent).toContain('Nested done task');
        expect(nestedItems[1]?.textContent).toContain('Nested pending task');

        const allTaskItems = container.querySelectorAll('li.markdown-task-list-item');
        expect(allTaskItems.length).toBe(4);
        allTaskItems.forEach((item) => {
            expect(item).toHaveStyle('list-style-type: none');
        });
    });
    it('renders inline math delimited by single dollar signs', () => {
        const markdown = 'Einstein wrote $E = mc^2$ and everyone nodded.';

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const inlineWrapper = container.querySelector('.markdown-inline-math');
        expect(inlineWrapper).not.toBeNull();
        expect(inlineWrapper?.querySelector('.katex')).not.toBeNull();
        expect(container.querySelectorAll('.markdown-inline-math')).toHaveLength(1);
        expect(container.textContent).toContain('Einstein wrote');
        expect(container.textContent).not.toContain('$E = mc^2$');
    });

    it('renders block math delimited by double dollar signs with appropriate component', () => {
        const markdown = ['$$', '\\frac{a}{b} + \\frac{c}{d}', '$$'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const blockMath = container.querySelector('.markdown-math-block');
        expect(blockMath).not.toBeNull();
        expect(blockMath?.querySelector('.katex-display')).not.toBeNull();
        expect(container.querySelectorAll('.markdown-math-block')).toHaveLength(1);
        expect(container.textContent).not.toContain('$$');

        const computedStyle = getComputedStyle(blockMath as HTMLElement);
        expect(['visible', 'hidden', '']).toContain(computedStyle.overflowX);
        expect(['visible', 'hidden', '']).toContain(computedStyle.overflowY);
    });

    it('allows display math to size without introducing scrollbars', () => {
        const markdown = ['Here is math:', '', '$$', '\\int_{0}^{\\pi} \\sin(x)\\,dx = 2', '$$'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const mathBlock = container.querySelector('.markdown-math-block');
        expect(mathBlock).not.toBeNull();

        const styles = getComputedStyle(mathBlock as HTMLElement);
        expect(['visible', '']).toContain(styles.overflowX);
        expect(['visible', '']).toContain(styles.overflowY);
        expect(styles.maxWidth === '' || styles.maxWidth === 'none').toBe(true);

        const display = mathBlock?.querySelector('.katex-display') as HTMLElement | null;
        expect(display).not.toBeNull();
        expect(display?.style.width === '' || display?.style.width === 'auto').toBe(true);
    });

    it('renders nested blockquotes and lists without breaking structure', () => {
        const markdown = ['> Quoted intro', '> 1. First item', '>    - Nested bullet', '> > Secondary quote'].join('\n');
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const blockquote = container.querySelector('blockquote');
        expect(blockquote).not.toBeNull();
        expect(blockquote).toHaveTextContent('Quoted intro');
        expect(blockquote?.querySelector('ol')).not.toBeNull();
        expect(blockquote?.querySelector('ul')).not.toBeNull();

        const nestedBlockquote = blockquote?.querySelectorAll('blockquote');
        expect(nestedBlockquote?.length).toBeGreaterThanOrEqual(1);
    });

    it('detects horizontal rules and separates surrounding content', () => {
        const markdown = 'Before\n\n---\n\nAfter';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const separator = container.querySelector('hr') ?? container.querySelector('[role="separator"]');
        expect(separator).not.toBeNull();

        const textNodes = container.textContent ?? '';
        expect(textNodes).toContain('Before');
        expect(textNodes).toContain('After');
    });

    it('resolves anchor links without forcing new tabs and keeps identical-text links plain', () => {
        const markdown = ['[Jump](#section)', '[https://same.example](https://same.example)'].join('\n\n');

        render(<Markdown>{markdown}</Markdown>);

        const anchorLink = screen.getByRole('link', { name: 'Jump' });
        expect(anchorLink).toHaveAttribute('href', '#section');
        expect(anchorLink).not.toHaveAttribute('target');

        const plainLink = screen.getByRole('link', { name: 'https://same.example' });
        expect(plainLink.textContent).toBe('https://same.example');
    });

    it('supports repeated footnote references', () => {
        const markdown = 'Repeat[^1] again[^1].\n\n[^1]: Shared footnote';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const references = container.querySelectorAll('sup.markdown-footnote-link a[href="#1"]');
        expect(references).toHaveLength(2);

        const footnote = container.querySelector('ol');
        expect(footnote).not.toBeNull();
        expect(footnote).toHaveTextContent('Shared footnote');
    });

    it('respects inline code delimiters around angle-bracket autolinks', () => {
        const markdown = 'Autolink syntax is `<https://example.com>` when shown as code.';

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const code = container.querySelector('code');
        expect(code).not.toBeNull();
        expect(code?.textContent).toBe('<https://example.com>');
        expect(code?.querySelector('a')).toBeNull();
    });

    it('treats fenced code blocks as atomic even when containing markdown literals', async () => {
        const markdown = ['```md', '# Heading inside code', '**bold**', '```'].join('\n');
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const pre = container.querySelector('.code-block pre');
        expect(pre).not.toBeNull();
        expect(pre?.textContent).toContain('**bold**');
        expect(pre?.querySelector('b')).toBeNull();

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('preserves list numbering using the provided start index', () => {
        const markdown = '3. Third\n4. Fourth';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const orderedList = container.querySelector('ol');
        expect(orderedList).not.toBeNull();

        const items = within(orderedList as HTMLElement).getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(items[0]).not.toHaveAttribute('start');
        expect(items[1]).not.toHaveAttribute('start');
        expect(items[0]).toHaveAttribute('value', '3');
        expect(items[1]).toHaveAttribute('value', '4');
    });

    it('treats indented code blocks with minimal leading spaces as code', async () => {
        const markdown = ['  console.log("two space indent");', '    console.log("four space indent");', '  console.log("closing line");'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlocks = container.querySelectorAll('.code-block');
        expect(codeBlocks.length).toBeGreaterThan(0);
        const combinedText = Array.from(codeBlocks)
            .map((block) => block.textContent ?? '')
            .join('\n');
        expect(combinedText).toContain('two space indent');
        expect(combinedText).toContain('four space indent');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('renders tables with markdown content inside cells', () => {
        const markdown = ['| Feature | Value |', '| --- | --- |', '| **Bold Cell** | `inline` code inside a table |'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const grid = screen.getByTestId('mock-data-grid');
        const boldCell = within(grid).getByText('Bold Cell', { selector: 'b' });
        expect(boldCell).toBeInTheDocument();

        const codeCell = within(grid).getByText('inline', { selector: 'code' });
        expect(codeCell).toBeInTheDocument();
        expect(codeCell.closest('.markdown-table-cell')).not.toBeNull();
        expect(codeCell.parentElement?.textContent).toBe('inline code inside a table');
    });

    it('handles compound lists with math, code fences, task lists, and footnotes', async () => {
        const markdown = [
            '1. Intro with math $a^2 + b^2$ and reference[^note].',
            '',
            '2. Code sample:',
            '    ```ts',
            '    const value = 42;',
            '    console.log(value);',
            '    ```',
            '',
            '3. Tasks',
            '   - [x] Checked task',
            '   - [ ] Pending task',
            '',
            '[^note]: Footnote text providing context.',
        ].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const orderedLists = container.querySelectorAll('ol');
        expect(orderedLists.length).toBeGreaterThanOrEqual(1);
        const primaryList = orderedLists[0];
        expect(primaryList).not.toBeNull();

        const listItems = within(primaryList as HTMLElement).getAllByRole('listitem');
        expect(listItems).toHaveLength(3);

        const inlineMath = listItems[0]?.querySelector('.markdown-inline-math');
        expect(inlineMath).not.toBeNull();
        expect(inlineMath?.querySelector('.katex')).not.toBeNull();

        const footnoteLink = listItems[0]?.querySelector('sup.markdown-footnote-link a[href="#1"]');
        expect(footnoteLink).not.toBeNull();
        expect(footnoteLink).toHaveTextContent('1');

        const codeBlock = listItems[1]?.querySelector('.code-block pre');
        expect(codeBlock).not.toBeNull();
        expect(codeBlock?.textContent).toContain('const value = 42;');
        expect(codeBlock?.textContent).toContain('console.log(value);');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });

        const nestedCheckboxes = listItems[2]?.querySelectorAll('input[type="checkbox"]') ?? [];
        expect(nestedCheckboxes).toHaveLength(2);
        expect(nestedCheckboxes[0]).toBeChecked();
        expect(nestedCheckboxes[1]).not.toBeChecked();
        expect(listItems[2]?.querySelector('.code-block')).toBeNull();

        const nestedTaskTexts = Array.from(listItems[2]?.querySelectorAll('li') ?? []).map((li) => li.textContent?.trim());
        expect(nestedTaskTexts).toContain('Checked task');
        expect(nestedTaskTexts).toContain('Pending task');

        const footnoteLists = Array.from(container.querySelectorAll('ol')).slice(1);
        expect(footnoteLists.length).toBeGreaterThanOrEqual(1);
        expect(footnoteLists[footnoteLists.length - 1]?.textContent).toContain('Footnote text providing context.');
    });

    it('renders blockquotes with nested structures and spoiler toggling', async () => {
        const markdown = ['> Quoted heading', '> =======', '>', '> - Item with ||hidden message|| inside.', '>   1. Nested number', '> > Secondary quote line'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const outerBlockquote = container.querySelector('blockquote');
        expect(outerBlockquote).not.toBeNull();

        const heading = within(outerBlockquote as HTMLElement).getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Quoted heading');

        const spoiler = outerBlockquote?.querySelector('.markdown-spoiler');
        expect(spoiler).not.toBeNull();
        expect(spoiler).toHaveAttribute('data-hidden', 'true');

        const spoilerButton = within(spoiler as HTMLElement).getByRole('button', { name: /show spoiler/i });
        expect(spoilerButton).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(spoilerButton);

        expect(spoiler).toHaveAttribute('data-hidden', 'false');
        expect(spoilerButton).toHaveAttribute('aria-expanded', 'true');
        expect(spoilerButton).toHaveTextContent(/hide spoiler/i);
        const spoilerContent = (spoiler as HTMLElement).querySelector('.markdown-spoiler__content') as HTMLElement | null;
        expect(spoilerContent).not.toBeNull();
        expect(spoilerContent?.id).toBeTruthy();
        expect(spoilerButton).toHaveAttribute('aria-controls', spoilerContent?.id ?? '');
        expect(spoilerContent).toHaveAttribute('aria-hidden', 'false');
        expect(spoilerContent?.textContent).toContain('hidden message');

        const nestedBlockquotes = outerBlockquote?.querySelectorAll('blockquote') ?? [];
        expect(nestedBlockquotes.length).toBeGreaterThanOrEqual(1);

        const nestedList = outerBlockquote?.querySelector('ul');
        expect(nestedList).not.toBeNull();
        expect(nestedList?.querySelector('ol')).not.toBeNull();
        expect(outerBlockquote?.querySelector('.code-block')).toBeNull();
    });

    it('renders definition lists alongside paragraphs, separators, and tables', () => {
        const markdown = [
            'Term One',
            ': Definition **bold** and [reference](https://example.com)',
            '',
            'Term Two',
            ': Second definition with $E = mc^2$',
            '',
            'Following paragraph with inline `code`.',
            '',
            '---',
            '',
            '| Feature | Value |',
            '| --- | --- |',
            '| Data | `inline` code inside a table |',
        ].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const definitionList = container.querySelector('dl');
        expect(definitionList).not.toBeNull();
        expect(definitionList?.querySelectorAll('dt')).toHaveLength(2);
        expect(definitionList?.querySelectorAll('dd')).toHaveLength(2);
        expect(within(definitionList as HTMLElement).getByText('bold', { selector: 'b' })).toBeInTheDocument();
        expect(definitionList?.querySelector('.markdown-inline-math')).not.toBeNull();
        expect(within(definitionList as HTMLElement).getByRole('link', { name: 'reference' })).toHaveAttribute('href', 'https://example.com');

        const paragraph = Array.from(container.querySelectorAll('.mb-3')).find((node) => node.textContent?.includes('Following paragraph'));
        expect(paragraph).not.toBeUndefined();
        expect(paragraph?.querySelector('code')).not.toBeNull();

        const separator = container.querySelector('hr') ?? container.querySelector('[role="separator"]');
        expect(separator).not.toBeNull();

        const grid = screen.getByTestId('mock-data-grid');
        const headers = within(grid).getAllByRole('columnheader');
        expect(headers.map((header) => header.textContent?.trim())).toEqual(['Feature', 'Value']);
        const codeCell = within(grid).getByText('inline', { selector: 'code' });
        expect(codeCell).toBeInTheDocument();
        expect(codeCell.closest('.markdown-table-cell')).not.toBeNull();
    });

    it('skips mermaid rendering when parsing fails while still rendering math blocks', async () => {
        mermaidParse.mockResolvedValueOnce(false);

        const markdown = ['```mermaid', 'graph TD; A-->B;', '```', '', '$$', '\\frac{1}{n} \\sum_{i=1}^n x_i', '$$'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        await waitFor(() => {
            expect(mermaidParse).toHaveBeenCalled();
        });

        expect(mermaidRender).not.toHaveBeenCalled();
        expect(container.querySelector('[data-testid="mermaid-diagram"]')).toBeNull();

        const mathBlock = container.querySelector('.markdown-math-block');
        expect(mathBlock).not.toBeNull();
        expect(mathBlock?.querySelector('.katex-display')).not.toBeNull();
    });

    it('respects inline code when autolinking bare URLs', () => {
        const markdown = ['`Visit https://example.com`', '', '**Outer `code` and https://example.net**'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeSpans = container.querySelectorAll('code');
        expect(codeSpans.length).toBeGreaterThanOrEqual(2);
        const firstCode = codeSpans[0];
        expect(firstCode.textContent).toBe('Visit https://example.com');
        expect(firstCode.querySelector('a')).toBeNull();

        const anchors = screen.getAllByRole('link');
        expect(anchors).toHaveLength(1);
        const link = anchors[0];
        expect(link).toHaveAttribute('href', 'https://example.net');
        expect(link.closest('b, strong')).not.toBeNull();

        const bold = container.querySelector('b, strong');
        expect(bold).not.toBeNull();
        expect(bold?.textContent).toContain('Outer');
        expect(bold?.querySelector('code')).not.toBeNull();
    });

    it('falls back to plain text when KaTeX rendering throws', () => {
        const katexSpy = vi.spyOn(katex, 'renderToString').mockImplementationOnce(() => {
            throw new Error('katex failure');
        });

        const { container } = render(<Markdown>{'Inline math $E = mc^2$ fallback.'}</Markdown>);

        const inlineMath = container.querySelector('.markdown-inline-math');
        expect(inlineMath).not.toBeNull();
        expect(inlineMath?.querySelector('.katex')).toBeNull();
        expect(inlineMath?.textContent).toContain('E = mc^2');

        katexSpy.mockRestore();
    });

    it('renders spoilers containing nested markdown, raw html, and footnotes', () => {
        const markdown = [
            'Beware ||spoiler with **bold** [link](https://example.com) and note[^1]|| afterwards.',
            '',
            '<div class="panel">',
            '  <p>raw html block</p>',
            '</div>',
            '',
            '[^1]: Footnote <em>detail</em> and `code`.',
        ].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const spoiler = container.querySelector('.markdown-spoiler');
        expect(spoiler).not.toBeNull();
        expect(spoiler?.getAttribute('data-hidden')).toBe('true');
        const spoilerContent = spoiler?.querySelector('.markdown-spoiler__content');
        expect(spoilerContent).not.toBeNull();
        expect(spoilerContent?.querySelector('b')).not.toBeNull();
        expect(spoilerContent?.querySelector('a')).not.toBeNull();

        const footnote = container.querySelector('sup.markdown-footnote-link a[href="#1"]');
        expect(footnote).not.toBeNull();

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(codeBlock?.textContent).toContain('<div class="panel">');
        expect(container.querySelector('div.panel')).toBeNull();

        const footnoteList = Array.from(container.querySelectorAll('ol')).at(-1);
        expect(footnoteList).not.toBeNull();
        expect(footnoteList?.textContent).toContain('Footnote');
    });

    it('renders advanced stress scenarios without structural regressions', async () => {
        const markdown = [
            '#### Table With Embedded Structures',
            '',
            '| Region | Details |',
            '| ------ | ------- |',
            '| North  | <table> |',
            '|        |   <tr> |',
            '|        |     <th scope="row">FY24</th> |',
            '|        |     <td> |',
            '|        |       <ul> |',
            '|        |         <li>Revenue: <code>€1.2M</code></li> |',
            '|        |         <li>Notes: |',
            '|        |           <dl> |',
            '|        |             <dt>Risk</dt> |',
            '|        |             <dd>High water levels</dd> |',
            '|        |           </dl> |',
            '|        |         </li> |',
            '|        |       </ul> |',
            '|        |     </td> |',
            '|        |   </tr> |',
            '|        | </table> |',
            '| South  | Definition continues with text wrapping across the column. |',
            '',
            '#### Admonition With Details and Footnotes',
            '',
            '> [!WARNING]',
            '> <details>',
            '>   <summary>Click to expand</summary>',
            '>   Inline HTML lives inside the callout and references a shared footnote[^details-note].',
            '> </details>',
            '> Extra paragraph keeps the admonition multi-block.',
            '',
            '#### Mixed List Modes',
            '',
            '1. Start numbered to describe the flow.',
            '   - Switch to bullet for supplemental context.',
            '   - Include a task list next:',
            '     - [x] Complete pre-checks',
            '     - [ ] Schedule review',
            '   - Definition list embedded under the same list item:',
            '     Term',
            '     : Explanation bound to the mixed item.',
            '2. Resume numbering to ensure we exit correctly.',
            '',
            '#### Code Fence With Frontmatter Metadata',
            '',
            '```yaml frontmatter title="Edge Cases"',
            '---',
            'draft: true',
            'reviewers:',
            '  - alice',
            '  - bob',
            '---',
            'summary: |',
            '  Multi-line YAML content should stay intact.',
            '```',
            '',
            '#### Math In Blockquotes And Tables',
            '',
            '> Engineers noted the inline relation $F = ma$ before presenting the table below.',
            '',
            '| Metric | Formula |',
            '| ------ | ------- |',
            '| Area   | $A = \\pi r^2$ |',
            '| Flux   | $$\\oint_{\\partial \\Sigma} \\mathbf{E} \\cdot d\\mathbf{l} = -\\frac{d\\Phi_B}{dt}$$ |',
            '',
            '#### Spoiler With Mermaid and Footnotes',
            '',
            '||Inside the spoiler lives a small system diagram and cross-reference[^spoiler-note].',
            '',
            '```mermaid',
            'flowchart LR',
            '  API --> Queue --> Worker',
            '```',
            '||',
            '',
            '#### Footnote With Admonition and Tasks',
            '',
            'This paragraph references a dense note[^task-note] to confirm nested rendering.',
            '',
            '[^details-note]: Reveals context when toggled inside the warning callout.',
            '',
            '[^spoiler-note]: Mermaid diagrams are evaluated even when hidden inside spoilers.',
            '',
            '[^task-note]:',
            '    > [!NOTE]',
            '    > Audit trail remains accessible here.',
            '    - [x] Capture requirements',
            '    - [ ] Validate implementation',
        ].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const grids = screen.getAllByTestId('mock-data-grid');
        expect(grids.length).toBeGreaterThanOrEqual(2);

        const embeddedStructureGrid = grids.find((grid) => within(grid).queryByText('North'));
        expect(embeddedStructureGrid).toBeDefined();
        if (embeddedStructureGrid) {
            expect(within(embeddedStructureGrid).getByText(/North/)).toBeInTheDocument();
            expect(within(embeddedStructureGrid).getByText(/High water levels/)).toBeInTheDocument();
            expect(within(embeddedStructureGrid).getByText(/€1\.2M/)).toBeInTheDocument();

            const rows = within(embeddedStructureGrid).getAllByRole('row');
            const northRow = rows.find((row) => within(row).queryByText('North'));
            expect(northRow).toBeDefined();
            if (northRow) {
                const cells = Array.from(northRow.children).filter((node): node is HTMLTableCellElement => node instanceof HTMLTableCellElement);
                expect(cells).toHaveLength(2);
                const detailCell = cells[1];
                expect(detailCell).toBeDefined();
                await waitFor(() => expect(detailCell.querySelector('table')).not.toBeNull());
                const nestedTable = detailCell.querySelector('table');
                expect(nestedTable).not.toBeNull();
                expect(within(detailCell).getByText('FY24')).toBeInTheDocument();
                expect(nestedTable?.querySelector('ul')).not.toBeNull();
            }
        }

        const metricsGrid = grids.find((grid) => within(grid).queryByText(/Metric/));
        expect(metricsGrid).toBeDefined();
        if (metricsGrid) {
            expect(within(metricsGrid).getByText(/Metric/)).toBeInTheDocument();
            expect(within(metricsGrid).getByText(/Flux/)).toBeInTheDocument();
        }

        const warning = screen.getByTestId('markdown-admonition-warning');
        expect(warning).toHaveTextContent('Extra paragraph keeps the admonition multi-block.');
        const warningDetails = warning.querySelector('details');
        expect(warningDetails).not.toBeNull();
        expect(warningDetails?.querySelector('summary')?.textContent).toContain('Click to expand');
        const warningFootnoteLink = warning.querySelector('sup.markdown-footnote-link a');
        expect(warningFootnoteLink).not.toBeNull();
        expect(warningFootnoteLink?.textContent).toBe('1');

        const orderedList = container.querySelector('.markdown-paper > ol');
        expect(orderedList).not.toBeNull();
        const mixedCheckboxes = orderedList?.querySelectorAll('input[type="checkbox"]') ?? [];
        expect(mixedCheckboxes).toHaveLength(2);
        expect(mixedCheckboxes[0]).toBeChecked();
        expect(mixedCheckboxes[1]).not.toBeChecked();
        expect(orderedList?.querySelector('dl')).not.toBeNull();

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
        const codeBlockTexts = Array.from(container.querySelectorAll('.code-block pre')).map((node) => node.textContent ?? '');
        expect(codeBlockTexts.some((text) => text.includes('draft: true'))).toBe(true);

        const mathBlockquote = container.querySelector('blockquote');
        expect(mathBlockquote).not.toBeNull();
        expect(mathBlockquote?.querySelector('.markdown-inline-math')).not.toBeNull();

        const formulaGrid = grids.find((grid) => within(grid).queryByText('Flux'));
        expect(formulaGrid).toBeDefined();
        if (formulaGrid) {
            expect(within(formulaGrid).getByText('Flux')).toBeInTheDocument();
            expect(within(formulaGrid).getByText(/∮/)).toBeInTheDocument();
        }

        await waitFor(() => {
            expect(mermaidParse).toHaveBeenCalledWith('flowchart LR\n  API --> Queue --> Worker');
            expect(mermaidRender).toHaveBeenCalled();
        });
        const spoiler = container.querySelector('.markdown-spoiler');
        expect(spoiler).not.toBeNull();
        expect(spoiler?.getAttribute('data-hidden')).toBe('true');
        const spoilerButton = within(spoiler as HTMLElement).getByRole('button', { name: /show spoiler/i });
        expect(spoilerButton).toHaveAttribute('aria-expanded', 'false');
        const advancedSpoilerContent = spoiler?.querySelector('.markdown-spoiler__content') as HTMLElement | null;
        expect(advancedSpoilerContent).not.toBeNull();
        expect(advancedSpoilerContent?.id).toBeTruthy();
        expect(spoilerButton).toHaveAttribute('aria-controls', advancedSpoilerContent?.id ?? '');
        await userEvent.click(spoilerButton);
        expect(spoiler?.getAttribute('data-hidden')).toBe('false');
        expect(spoilerButton).toHaveAttribute('aria-expanded', 'true');
        const spoilerText = spoiler?.textContent ?? container.textContent ?? '';
        expect(spoilerText).toContain('Inside the spoiler lives a small system diagram');
        expect(container.textContent ?? '').toContain('Mermaid diagrams are evaluated even when hidden inside spoilers.');

        const footnoteList = Array.from(container.querySelectorAll('ol')).at(-1);
        expect(footnoteList).not.toBeNull();
        expect(footnoteList?.textContent).toContain('Audit trail remains accessible here.');
        const footnoteCheckboxes = footnoteList?.querySelectorAll('input[type="checkbox"]') ?? [];
        expect(footnoteCheckboxes).toHaveLength(2);
        expect(footnoteList?.querySelector('[data-testid="markdown-admonition-note"]')).not.toBeNull();
    });
});
