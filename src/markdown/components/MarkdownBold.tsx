import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownBold({ children }: PropsWithChildren) {
    return (
        <b>
            <MarkdownElement>{children}</MarkdownElement>
        </b>
    );
}

export default MarkdownBold;
