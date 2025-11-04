import { PropsWithChildren } from 'react';

function MarkdownInlineCode({ children }: PropsWithChildren) {
    return <code>{children}</code>;
}

export default MarkdownInlineCode;
