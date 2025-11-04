import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownSubScript from './MarkdownSubScript';

describe('MarkdownSubScript', () => {
    function renderSubScript(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownSubScript>{markdown}</MarkdownSubScript>
            </MarkdownContext.Provider>,
        );
    }

    it('renders subscript content with inline parsing', () => {
        const markdown = '2';
        const { container } = renderSubScript(markdown);

        const sub = container.querySelector('sub');
        expect(sub).not.toBeNull();
        expect(sub?.textContent).toBe('2');
    });
});
