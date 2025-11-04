import { render, screen, within } from '@testing-library/react';
import Markdown from '..';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownAdmonition', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders admonition callouts such as > [!NOTE] as styled alert boxes', () => {
        const markdown = ['> [!NOTE]', '> This is important guidance.', '> Keep reading for more details.'].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const admonition = screen.getByTestId('markdown-admonition-note');
        expect(admonition).toHaveClass('markdown-admonition');
        expect(admonition).toHaveClass('note');

        const title = within(admonition).getByText('Note');
        expect(title.tagName.toLowerCase()).toBe('strong');

        expect(admonition).toHaveTextContent('This is important guidance.');
        expect(admonition).toHaveTextContent('Keep reading for more details.');
    });

    it('falls back gracefully for unknown admonition labels and custom titles', () => {
        const markdown = ['> [!CUSTOM] Watch This', '> First line of content.', '> Second line with *formatting*.', '', '> [!WEIRD]', '> Body without explicit title.'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const customAdmonition = screen.getByTestId('markdown-admonition-custom');
        expect(customAdmonition).toHaveClass('markdown-admonition', 'custom');
        const customTitle = within(customAdmonition).getByText('Watch This');
        expect(customTitle.tagName).toBe('STRONG');
        expect(within(customAdmonition).getByText(/First line of content\./)).toBeInTheDocument();
        expect(within(customAdmonition).getByText('Second line with', { exact: false })).toBeInTheDocument();
        expect(within(customAdmonition).getByText('formatting', { selector: 'i' })).toBeInTheDocument();

        const fallbackAdmonition = screen.getByTestId('markdown-admonition-weird');
        expect(fallbackAdmonition).toHaveClass('markdown-admonition', 'weird');
        const fallbackTitle = within(fallbackAdmonition).getByText('Weird');
        expect(fallbackTitle.tagName).toBe('STRONG');
        expect(within(fallbackAdmonition).getByText('Body without explicit title.')).toBeInTheDocument();

        expect(container.textContent).not.toContain('[!CUSTOM]');
        expect(container.textContent).not.toContain('[!WEIRD]');
    });
});
