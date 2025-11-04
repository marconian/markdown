import { render, screen, within } from '@testing-library/react';
import Markdown from '../Markdown';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownNestedElements', () => {
    beforeEach(() => {
        resetRenderMocks();
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

        const definitionList = container.querySelector('li dl');
        expect(definitionList).not.toBeNull();
        expect(definitionList?.textContent).toContain('Definition inside list.');

        const footnoteItem = container.querySelector('ol li');
        expect(footnoteItem).not.toBeNull();
        expect(footnoteItem?.querySelector('pre, code, .code-block')).toBeNull();
        expect(footnoteItem).toHaveTextContent('Multi-line note');
        expect(footnoteItem).toHaveTextContent('continuation line');
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
});
