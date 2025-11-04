import { fireEvent, render, screen, within } from '@testing-library/react';
import Markdown from '../Markdown';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownSpoiler', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders spoiler syntax like ||hidden|| inside text', () => {
        const markdown = 'Reveal ||hidden content|| carefully.';

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const spoiler = container.querySelector('.markdown-spoiler') as HTMLElement | null;
        expect(spoiler).not.toBeNull();
        expect(spoiler?.getAttribute('data-hidden')).toBe('true');
        expect(spoiler?.textContent).toContain('hidden content');

        const toggle = within(spoiler as HTMLElement).getByRole('button', { name: /show spoiler/i });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).toHaveAttribute('aria-controls');
    });

    it('renders spoilers containing nested markdown and toggles visibility', () => {
        const markdown = ['||**Bold** and _italic_ content||', '', 'Paragraph after spoiler.'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const spoiler = container.querySelector('.markdown-spoiler') as HTMLElement | null;
        expect(spoiler).not.toBeNull();

        const toggle = within(spoiler as HTMLElement).getByRole('button', { name: /show spoiler/i });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(toggle).toHaveAccessibleName(/hide spoiler/i);

        const content = spoiler?.querySelector('.markdown-spoiler__content');
        expect(content).not.toBeNull();
        expect(content?.getAttribute('aria-hidden')).toBe('false');
        expect(content?.querySelector('b')).toHaveTextContent('Bold');
        expect(content?.querySelector('i')).toHaveTextContent('italic');
    });
});
