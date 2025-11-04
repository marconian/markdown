import { render } from '@testing-library/react';
import Paragraph from './Paragraph';
import { MarkdownContext } from '..';

describe('Paragraph', () => {
    function renderParagraph(content: string) {
        return render(
            <MarkdownContext.Provider value={{ markdown: content, backRefs: {} }}>
                <Paragraph>{content}</Paragraph>
            </MarkdownContext.Provider>,
        );
    }

    it('wraps content in a div with markdown spacing', () => {
        const { container } = renderParagraph('Paragraph content');

        const wrapper = container.querySelector('div.mb-3');
        expect(wrapper).not.toBeNull();
        expect(wrapper?.textContent).toBe('Paragraph content');
    });

    it('parses inline markdown within the paragraph body', () => {
        const { container } = renderParagraph('Paragraph with **bold** and _italic_ styles.');

        const bold = container.querySelector('b');
        expect(bold).not.toBeNull();
        expect(bold?.textContent).toContain('bold');

        const italic = container.querySelector('i');
        expect(italic).not.toBeNull();
        expect(italic?.textContent).toBe('italic');
    });
});
