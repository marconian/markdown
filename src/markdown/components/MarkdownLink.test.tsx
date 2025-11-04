import { render, screen } from '@testing-library/react';
import Markdown from '..';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownLink', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders different link types and referenced images', () => {
        const markdown = [
            '[inline](https://example.com "Example")',
            'https://example.org',
            '[ref-link][ref]',
            '![Alt text][img]',
            '',
            '[ref]: https://ref.example/path "Ref Label"',
            '[img]: https://example.com/image.png "Alt text"',
        ].join('\n\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const inlineLink = screen.getByRole('link', { name: 'inline' });
        expect(inlineLink).toHaveAttribute('href', 'https://example.com');
        expect(inlineLink).toHaveAttribute('target', '_blank');
        expect(inlineLink).toHaveAttribute('title', 'Example');

        const autoLink = screen.getByRole('link', { name: 'https://example.org' });
        expect(autoLink).toHaveAttribute('href', 'https://example.org');

        const referencedLink = screen.getByRole('link', { name: 'ref-link' });
        expect(referencedLink).toHaveAttribute('href', 'https://ref.example/path');
        expect(referencedLink).toHaveAttribute('title', 'Ref Label');

        const image = screen.getByRole('img', { name: 'Alt text' });
        expect(image).toHaveAttribute('src', 'https://example.com/image.png');
        expect(image).toHaveAttribute('alt', 'Alt text');

        const downloadLink = screen.getByRole('link', { name: /download/i });
        expect(downloadLink).toHaveAttribute('href', 'https://example.com/image.png');

        const links = screen.getAllByRole('link');
        const hrefs = links.map((link) => link.getAttribute('href'));
        expect(hrefs.filter(Boolean).sort()).toEqual(['https://example.com', 'https://example.com/image.png', 'https://example.org', 'https://ref.example/path'].sort());
        expect(container.textContent).not.toContain('[ref]');
        expect(container.textContent).not.toContain('[img]');
    });

    it('renders inline links and images with single-quoted titles', () => {
        const markdown = ["[single quote](https://example.com 'Label')", "![Inline Image](https://example.com/image.jpg 'Inline alt')"].join('\n\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const link = screen.getByRole('link', { name: 'single quote' });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('title', 'Label');

        const anchors = screen.getAllByRole('link');
        expect(anchors).toHaveLength(2);
        const anchorHrefs = anchors.map((node) => node.getAttribute('href'));
        expect(new Set(anchorHrefs)).toEqual(new Set(['https://example.com', 'https://example.com/image.jpg']));

        const image = container.querySelector('img[alt="Inline alt"]');
        expect(image).not.toBeNull();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
        expect(image).toHaveAttribute('title', 'Inline Image');
        expect(container.querySelectorAll('img')).toHaveLength(1);
    });

    it('converts angle-bracket autolinks into anchors', () => {
        const markdown = ['<https://example.com/path?query=1>', '<mailto:team@example.com>', 'Reach us at <angle@example.org> for details.'].join('\n\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const webLink = screen.getByRole('link', { name: 'https://example.com/path?query=1' });
        expect(webLink).toHaveAttribute('href', 'https://example.com/path?query=1');
        expect(webLink).toHaveAttribute('target', '_blank');

        const mailtoLink = screen.getByRole('link', { name: 'team@example.com' });
        expect(mailtoLink).toHaveAttribute('href', 'mailto:team@example.com');
        expect(mailtoLink).toHaveAttribute('target', '_blank');

        const bareEmailLink = screen.getByRole('link', { name: 'angle@example.org' });
        expect(bareEmailLink).toHaveAttribute('href', 'mailto:angle@example.org');
        expect(bareEmailLink).toHaveAttribute('target', '_blank');
        expect(container.querySelector('blockquote')).toBeNull();
        expect(container.textContent).toContain('for details.');
    });

    it('converts bare www links into anchors with https scheme', () => {
        const markdown = 'Visit www.example.com for more info.';

        render(<Markdown>{markdown}</Markdown>);

        const link = screen.getByRole('link', { name: 'www.example.com' });
        expect(link).toHaveAttribute('href', 'https://www.example.com');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('converts bare email addresses into mailto links', () => {
        const markdown = 'Contact support@example.com for help.';

        render(<Markdown>{markdown}</Markdown>);

        const link = screen.getByRole('link', { name: 'support@example.com' });
        expect(link).toHaveAttribute('href', 'mailto:support@example.com');
    });

    it('parses reference-style links with single-quoted or parenthesized titles', () => {
        const markdown = [
            '[single][s-ref] and [paren][p-ref]',
            '',
            "[s-ref]: https://example.com 'Single quoted title'",
            '[p-ref]: https://example.org (Parenthesized Title)',
        ].join('\n');

        render(<Markdown>{markdown}</Markdown>);

        const singleLink = screen.getByRole('link', { name: 'single' });
        expect(singleLink).toHaveAttribute('href', 'https://example.com');
        expect(singleLink).toHaveAttribute('title', 'Single quoted title');

        const parenLink = screen.getByRole('link', { name: 'paren' });
        expect(parenLink).toHaveAttribute('href', 'https://example.org');
        expect(parenLink).toHaveAttribute('title', 'Parenthesized Title');
    });

    it('resolves anchor links without forcing new tabs and keeps identical-text links plain', () => {
        const markdown = ['[Jump](#section)', '[https://same.example](https://same.example)'].join('\n\n');

        render(<Markdown>{markdown}</Markdown>);

        const anchorLink = screen.getByRole('link', { name: 'Jump' });
        expect(anchorLink).toHaveAttribute('href', '#section');
        expect(anchorLink).not.toHaveAttribute('target');

        const plainLink = screen.getByRole('link', { name: 'https://same.example' });
        expect(plainLink.textContent).toBe('https://same.example');
    });

    it('respects inline code when autolinking bare URLs', () => {
        const markdown = ['`Visit https://example.com`', '', '**Outer `code` and https://example.net**'].join('\n');

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const codeSpans = container.querySelectorAll('code');
        expect(codeSpans.length).toBeGreaterThanOrEqual(2);
        const firstCode = codeSpans[0];
        expect(firstCode.textContent).toBe('Visit https://example.com');
        expect(firstCode.querySelector('a')).toBeNull();

        const anchors = screen.getAllByRole('link');
        expect(anchors).toHaveLength(1);
        const link = anchors[0];
        expect(link).toHaveAttribute('href', 'https://example.net');
        expect(link.closest('b, strong')).not.toBeNull();

        const bold = container.querySelector('b, strong');
        expect(bold).not.toBeNull();
        expect(bold?.textContent).toContain('Outer');
        expect(bold?.querySelector('code')).not.toBeNull();
    });

    it('respects inline code delimiters around angle-bracket autolinks', () => {
        const markdown = 'Autolink syntax is `<https://example.com>` when shown as code.';

        const { container } = render(<Markdown>{markdown}</Markdown>);

        const code = container.querySelector('code');
        expect(code).not.toBeNull();
        expect(code?.textContent).toBe('<https://example.com>');
        expect(code?.querySelector('a')).toBeNull();
    });
});
