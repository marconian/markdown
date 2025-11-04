import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownItalic({ children }: PropsWithChildren) {
    return (
        <i>
            <MarkdownElement>{children}</MarkdownElement>
        </i>
    );
}

export default MarkdownItalic;
