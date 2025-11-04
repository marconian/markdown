import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownMarked from './MarkdownMarked';

describe('MarkdownMarked', () => {
    function renderMarked(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownMarked>{markdown}</MarkdownMarked>
            </MarkdownContext.Provider>,
        );
    }

    it('wraps content in mark element and parses nested bold text', () => {
        const markdown = '==Highlight **bold** text==';
        const { container } = renderMarked(markdown);

        const mark = container.querySelector('mark');
        expect(mark).not.toBeNull();
        expect(mark?.textContent).toContain('Highlight');

        const bold = mark?.querySelector('b');
        expect(bold).not.toBeNull();
        expect(bold?.textContent).toBe('bold');
    });
});
