import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownBoldItalic from './MarkdownBoldItalic';

describe('MarkdownBoldItalic', () => {
    function renderBoldItalic(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownBoldItalic>{markdown}</MarkdownBoldItalic>
            </MarkdownContext.Provider>,
        );
    }

    it('nests italic content within bold markup', () => {
        const markdown = '***deep emphasis***';
        const { container } = renderBoldItalic(markdown);

        const bold = container.querySelector('b');
        expect(bold).not.toBeNull();
        const nestedItalic = bold?.querySelector('i');
        expect(nestedItalic).not.toBeNull();
        expect(nestedItalic?.textContent).toBe('deep emphasis');
    });
});
