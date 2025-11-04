import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownBoldItalic({ children }: PropsWithChildren) {
    return (
        <b>
            <i>
                <MarkdownElement>{children}</MarkdownElement>
            </i>
        </b>
    );
}

export default MarkdownBoldItalic;
