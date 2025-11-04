import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownBold from './MarkdownBold';

describe('MarkdownBold', () => {
    function renderBold(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownBold>{markdown}</MarkdownBold>
            </MarkdownContext.Provider>,
        );
    }

    it('wraps content in a bold element and parses nested emphasis', () => {
        const markdown = 'Bold with _italic_ span';
        const { container } = renderBold(markdown);

        const bold = container.querySelector('b');
        expect(bold).not.toBeNull();
        expect(bold?.textContent).toContain('Bold with');

        const nestedItalic = bold?.querySelector('i');
        expect(nestedItalic).not.toBeNull();
        expect(nestedItalic?.textContent).toBe('italic');
    });
});
