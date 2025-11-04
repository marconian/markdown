import { render } from '@testing-library/react';
import Markdown from '../Markdown';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownFootnote', () => {
    beforeEach(() => {
        resetRenderMocks();
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
});
