import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownSubScript({ children }: PropsWithChildren) {
    return (
        <sub>
            <MarkdownElement>{children}</MarkdownElement>
        </sub>
    );
}

export default MarkdownSubScript;
