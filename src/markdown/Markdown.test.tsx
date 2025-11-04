import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Markdown from './Markdown';
import { highlightElement, mermaidParse, mermaidRender, resetRenderMocks } from './__tests__/test-utils';

describe('Markdown', () => {
    beforeEach(() => {
        resetRenderMocks();
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

        const startWarnings = consoleError.mock.calls.some((call: unknown[]) =>
            call.some((message) => typeof message === 'string' && message.includes('Received NaN for the `start` attribute')),
        );
        expect(startWarnings).toBe(false);

        consoleError.mockRestore();
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

        const nestedTaskTexts = Array.from(listItems[2]?.querySelectorAll<HTMLLIElement>('li') ?? []).map((li) => li.textContent?.trim());
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
