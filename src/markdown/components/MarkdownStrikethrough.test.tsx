import { render } from '@testing-library/react';
import { MarkdownContext } from '..';
import MarkdownStrikethrough from './MarkdownStrikethrough';

describe('MarkdownStrikethrough', () => {
    function renderStrike(markdown: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown, backRefs: {} }}>
                <MarkdownStrikethrough>{markdown}</MarkdownStrikethrough>
            </MarkdownContext.Provider>,
        );
    }

    it('wraps content in s element and preserves text', () => {
        const markdown = '~~Removed details~~';
        const { container } = renderStrike(markdown);

        const strike = container.querySelector('s');
        expect(strike).not.toBeNull();
        expect(strike?.textContent).toBe('Removed details');
    });
});
