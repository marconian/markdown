import { createElement } from 'react';
import { MarkdownElement } from './MarkdownElement';
import { kebabCase } from 'lodash';

function MarkdownHeader({ text, level }: { text: string; level: 1 | 2 | 3 | 4 | 5 | 6 }) {
    return createElement(
        `h${level}`,
        {
            id: kebabCase(text),
        },
        <MarkdownElement>{text}</MarkdownElement>,
    );
}

export default MarkdownHeader;
