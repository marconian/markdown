import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownItalic from './MarkdownItalic';

describe('MarkdownItalic', () => {
    function renderItalic(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownItalic>{markdown}</MarkdownItalic>
            </MarkdownContext.Provider>,
        );
    }

    it('wraps content in italics while preserving inline code', () => {
        const markdown = 'Italic with `code` snippet';
        const { container } = renderItalic(markdown);

        const italic = container.querySelector('i');
        expect(italic).not.toBeNull();
        expect(italic?.textContent).toContain('Italic with');

        const code = italic?.querySelector('code');
        expect(code).not.toBeNull();
        expect(code?.textContent).toBe('code');
    });
});
