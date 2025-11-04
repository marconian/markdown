import { render, screen, within } from '@testing-library/react';
import Markdown from '../Markdown';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownDefinitionList', () => {
    beforeEach(() => {
        resetRenderMocks();
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
});
