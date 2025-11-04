import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownSuperScript({ children }: PropsWithChildren) {
    return (
        <sup>
            <MarkdownElement>{children}</MarkdownElement>
        </sup>
    );
}

export default MarkdownSuperScript;
