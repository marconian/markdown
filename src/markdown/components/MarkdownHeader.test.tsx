import { render, screen } from '@testing-library/react';
import Markdown from '../Markdown';
import { resetRenderMocks } from '../__tests__/test-utils';

describe('MarkdownHeader', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders headings with appropriate semantic levels', () => {
        render(<Markdown>{'# Heading One\n\n### Heading Three'}</Markdown>);
        const headings = screen.getAllByRole('heading');

        expect(headings).toHaveLength(2);
        expect(headings[0].tagName).toBe('H1');
        expect(headings[0]).toHaveTextContent('Heading One');
        expect(headings[1].tagName).toBe('H3');
        expect(headings[1]).toHaveTextContent('Heading Three');
    });

    it('accepts atx headings without a separating space and trims trailing hashes', () => {
        render(<Markdown>{['#Heading###', '##Subheading ##'].join('\n\n')}</Markdown>);

        const headings = screen.getAllByRole('heading');
        expect(headings).toHaveLength(2);
        expect(headings[0].tagName).toBe('H1');
        expect(headings[0]).toHaveTextContent('Heading');
        expect(headings[1].tagName).toBe('H2');
        expect(headings[1]).toHaveTextContent('Subheading');
    });

    it('renders setext headings formed with underlines as semantic h1/h2 elements', () => {
        render(<Markdown>{['Setext Alpha', '=======', '', 'Setext Beta', '-------'].join('\n')}</Markdown>);

        const headings = screen.getAllByRole('heading');
        expect(headings).toHaveLength(2);
        expect(headings[0].tagName).toBe('H1');
        expect(headings[0]).toHaveTextContent('Setext Alpha');
        expect(headings[1].tagName).toBe('H2');
        expect(headings[1]).toHaveTextContent('Setext Beta');
    });
});
