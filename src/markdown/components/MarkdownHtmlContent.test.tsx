import { render, screen, within } from '@testing-library/react';
import Markdown from '../Markdown';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownHtmlContent', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('decides how to render raw html blocks and inline tags consistently', () => {
        const markdown = ['Inline <strong>alert</strong> text.', '', '<div class="panel">', '  <p>Block content</p>', '</div>'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const inlineCode = screen.getByText('<strong>alert</strong>', { selector: 'code' });
        expect(inlineCode).toBeInTheDocument();

        const blocks = container.querySelectorAll('.code-block');
        expect(blocks.length).toBeGreaterThan(0);
        const combined = Array.from(blocks)
            .map((b) => b.textContent ?? '')
            .join('\n');
        expect(combined).toContain('<div class="panel">');
        expect(combined).toContain('<p>Block content</p>');
        expect(Array.from(blocks).some((block) => within(block as HTMLElement).queryByText('html'))).toBe(true);
    });

    it('groups raw html blocks into a single highlighted code block', () => {
        const markdown = ['<div class="panel">', '  <p>html body</p>', '</div>'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlocks = container.querySelectorAll('.code-block');
        expect(codeBlocks).toHaveLength(1);
        const codeText = codeBlocks[0]?.textContent ?? '';
        expect(codeText).toContain('<div class="panel">');
        expect(codeText).toContain('<p>html body</p>');
        expect(codeText).toContain('</div>');
    });
});
