import { render, screen, within } from '@testing-library/react';
import Markdown from '..';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownTable', () => {
    beforeEach(() => {
        resetRenderMocks();
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

    it('preserves escaped pipe characters inside markdown tables', () => {
        const markdown = ['| Feature | Notes |', '| --- | --- |', '| Escape \\| pipe | Keep literal symbol |'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const grid = screen.getByTestId('mock-data-grid');
        expect(grid).toBeInTheDocument();
        expect(within(grid).getByText('Escape | pipe')).toBeInTheDocument();
        expect(within(grid).getByText('Keep literal symbol')).toBeInTheDocument();
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
});
