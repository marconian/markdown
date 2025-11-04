import { render } from '@testing-library/react';
import MarkdownInlineCode from './MarkdownInlineCode';

describe('MarkdownInlineCode', () => {
    it('renders content inside a code tag', () => {
        const { container } = render(<MarkdownInlineCode>const value = 42;</MarkdownInlineCode>);

        const code = container.querySelector('code');
        expect(code).not.toBeNull();
        expect(code?.textContent).toBe('const value = 42;');
    });
});
