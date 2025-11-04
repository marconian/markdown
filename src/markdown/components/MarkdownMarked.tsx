import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownMarked({ children }: PropsWithChildren) {
    return (
        <mark>
            <MarkdownElement>{children}</MarkdownElement>
        </mark>
    );
}

export default MarkdownMarked;
