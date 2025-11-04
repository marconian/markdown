import { render, screen } from '@testing-library/react';
import Markdown from '..';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownFootnoteLink', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders footnotes and provides fallback for missing references', () => {
        const markdown = `Content with note[^1] and missing note[^missing].\n\n[^1]: Known footnote text.`;
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const footnoteLink = container.querySelector('sup.markdown-footnote-link a[href="#1"]');
        expect(footnoteLink).not.toBeNull();
        expect(footnoteLink).toHaveTextContent('1');

        const missingFootnote = container.querySelector('sup.markdown-footnote-link a[href="#missing"]');
        expect(missingFootnote).not.toBeNull();
        expect(missingFootnote).toHaveTextContent('?');

        const footnoteList = container.querySelector('ol');
        expect(footnoteList).not.toBeNull();
        expect(footnoteList).toHaveTextContent('Known footnote text.');
        expect(container.querySelectorAll('sup.markdown-footnote-link')).toHaveLength(2);
        expect(container.textContent).not.toContain('[^1]');
        expect(container.textContent).not.toContain('[^missing]');
    });

    it('supports repeated footnote references', () => {
        const markdown = 'Repeat[^1] again[^1].\n\n[^1]: Shared footnote';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const references = container.querySelectorAll('sup.markdown-footnote-link a[href="#1"]');
        expect(references).toHaveLength(2);

        const footnote = container.querySelector('ol');
        expect(footnote).not.toBeNull();
        expect(footnote).toHaveTextContent('Shared footnote');

        expect(screen.getByText('Shared footnote')).toBeInTheDocument();
    });
});
