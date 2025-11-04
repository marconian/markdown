import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function MarkdownStrikethrough({ children }: PropsWithChildren) {
    return (
        <s>
            <MarkdownElement>{children}</MarkdownElement>
        </s>
    );
}

export default MarkdownStrikethrough;
