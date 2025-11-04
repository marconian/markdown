import { PropsWithChildren } from 'react';
import { MarkdownElement } from './MarkdownElement';

function Paragraph({ children }: PropsWithChildren) {
    return (
        <div className="mb-3">
            <MarkdownElement>{children}</MarkdownElement>
        </div>
    );
}

export default Paragraph;
