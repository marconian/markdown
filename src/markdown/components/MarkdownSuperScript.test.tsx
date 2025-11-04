import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownSuperScript from './MarkdownSuperScript';

describe('MarkdownSuperScript', () => {
    function renderSuperScript(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownSuperScript>{markdown}</MarkdownSuperScript>
            </MarkdownContext.Provider>,
        );
    }

    it('renders superscript content with inline parsing', () => {
        const markdown = '2';
        const { container } = renderSuperScript(markdown);

        const sup = container.querySelector('sup');
        expect(sup).not.toBeNull();
        expect(sup?.textContent).toBe('2');
    });
});
