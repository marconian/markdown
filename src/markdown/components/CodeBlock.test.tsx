import { render, waitFor, within } from '@testing-library/react';
import Markdown from '..';
import { highlightElement, resetRenderMocks } from '../__tests__/test-utils';

describe('CodeBlock', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders fenced code blocks with syntax highlighting metadata', async () => {
        const markdown = ['```ts', 'const answer = 42;', '```'].join('\n');
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(within(codeBlock as HTMLElement).getByText('ts')).toBeInTheDocument();
        expect(within(codeBlock as HTMLElement).getByText('copy')).toBeInTheDocument();
        expect(codeBlock?.textContent).toContain('const answer = 42;');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('supports fenced code blocks delimited by tildes', async () => {
        const markdown = ['~~~python', 'print("hi")', '~~~'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(within(codeBlock as HTMLElement).getByText('python')).toBeInTheDocument();
        expect(within(codeBlock as HTMLElement).getByText('copy')).toBeInTheDocument();
        expect(codeBlock?.textContent).toContain('print("hi")');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('parses fenced code info strings containing punctuation or attributes', async () => {
        const markdown = ['```c++ {.lang .highlight}', 'std::cout << "ok";', '```'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(within(codeBlock as HTMLElement).getByText('c++')).toBeInTheDocument();
        expect(codeBlock?.textContent).toContain('std::cout << "ok";');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('renders fenced code blocks without a language identifier', async () => {
        const markdown = ['```', 'raw text', '```'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(codeBlock?.querySelector('.code-block-title strong')).toBeNull();
        expect(codeBlock?.textContent).toContain('raw text');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('treats four-space indented blocks as code when not inside lists', async () => {
        const markdown = ['    line one', '    line two'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlock = container.querySelector('.code-block');
        expect(codeBlock).not.toBeNull();
        expect(codeBlock?.textContent).toContain('line one');
        expect(codeBlock?.textContent).toContain('line two');
        expect(codeBlock?.textContent).not.toContain('    ');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('treats indented code blocks with minimal leading spaces as code', async () => {
        const markdown = ['  console.log("two space indent");', '    console.log("four space indent");', '  console.log("closing line");'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeBlocks = container.querySelectorAll('.code-block');
        expect(codeBlocks.length).toBeGreaterThan(0);
        const combinedText = Array.from(codeBlocks)
            .map((block) => block.textContent ?? '')
            .join('\n');
        expect(combinedText).toContain('two space indent');
        expect(combinedText).toContain('four space indent');

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });

    it('treats fenced code blocks as atomic even when containing markdown literals', async () => {
        const markdown = ['```md', '# Heading inside code', '**bold**', '```'].join('\n');
        const { container } = render(<Markdown>{markdown}</Markdown>);

        const pre = container.querySelector('.code-block pre');
        expect(pre).not.toBeNull();
        expect(pre?.textContent).toContain('**bold**');
        expect(pre?.querySelector('b')).toBeNull();

        await waitFor(() => {
            expect(highlightElement).toHaveBeenCalled();
        });
    });
});
