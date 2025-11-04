import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownInserted from './MarkdownInserted';

describe('MarkdownInserted', () => {
    function renderInserted(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownInserted>{markdown}</MarkdownInserted>
            </MarkdownContext.Provider>,
        );
    }

    it('wraps content in ins element and keeps italic emphasis inside', () => {
        const markdown = '++Re-added _section_ content++';
        const { container } = renderInserted(markdown);

        const ins = container.querySelector('ins');
        expect(ins).not.toBeNull();
        expect(ins?.textContent).toContain('Re-added');

        const italic = ins?.querySelector('i');
        expect(italic).not.toBeNull();
        expect(italic?.textContent).toBe('section');
    });
});
