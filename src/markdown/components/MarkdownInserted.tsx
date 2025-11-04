import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownInserted({ children }: PropsWithChildren) {
    return (
        <ins>
            <MarkdownElement>{children}</MarkdownElement>
        </ins>
    );
}

export default MarkdownInserted;
