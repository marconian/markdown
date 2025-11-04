import { render } from '@testing-library/react';
import Markdown from '..';
import katex from 'katex';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownMath', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders inline math delimited by single dollar signs', () => {
        const markdown = 'Einstein wrote $E = mc^2$ and everyone nodded.';
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const inlineWrapper = container.querySelector('.markdown-inline-math');
        expect(inlineWrapper).not.toBeNull();
        expect(inlineWrapper?.querySelector('.katex')).not.toBeNull();
        expect(container.querySelectorAll('.markdown-inline-math')).toHaveLength(1);
        expect(container.textContent).toContain('Einstein wrote');
        expect(container.textContent).not.toContain('$E = mc^2$');
    });

    it('renders block math delimited by double dollar signs with appropriate component', () => {
        const markdown = ['$$', '\\frac{a}{b} + \\frac{c}{d}', '$$'].join('\n');
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const blockMath = container.querySelector('.markdown-math-block');
        expect(blockMath).not.toBeNull();
        expect(blockMath?.querySelector('.katex-display')).not.toBeNull();
        expect(container.querySelectorAll('.markdown-math-block')).toHaveLength(1);
        expect(container.textContent).not.toContain('$$');

        const computedStyle = getComputedStyle(blockMath as HTMLElement);
        expect(['visible', 'hidden', '']).toContain(computedStyle.overflowX);
        expect(['visible', 'hidden', '']).toContain(computedStyle.overflowY);
    });

    it('allows display math to size without introducing scrollbars', () => {
        const markdown = ['Here is math:', '', '$$', '\\int_{0}^{\\pi} \\sin(x)\\,dx = 2', '$$'].join('\n');
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const mathBlock = container.querySelector('.markdown-math-block');
        expect(mathBlock).not.toBeNull();

        const styles = getComputedStyle(mathBlock as HTMLElement);
        expect(['visible', '']).toContain(styles.overflowX);
        expect(['visible', '']).toContain(styles.overflowY);
        expect(styles.maxWidth === '' || styles.maxWidth === 'none').toBe(true);

        const display = mathBlock?.querySelector('.katex-display') as HTMLElement | null;
        expect(display).not.toBeNull();
        expect(display?.style.width === '' || display?.style.width === 'auto').toBe(true);
    });

    it('falls back to plain text when KaTeX rendering throws', () => {
        const katexSpy = vi.spyOn(katex, 'renderToString').mockImplementationOnce(() => {
            throw new Error('katex failure');
        });

        const { container } = render(<Markdown>{'Inline math $E = mc^2$ fallback.'}</Markdown>);

        const inlineMath = container.querySelector('.markdown-inline-math');
        expect(inlineMath).not.toBeNull();
        expect(inlineMath?.querySelector('.katex')).toBeNull();
        expect(inlineMath?.textContent).toContain('E = mc^2');

        katexSpy.mockRestore();
    });
});
