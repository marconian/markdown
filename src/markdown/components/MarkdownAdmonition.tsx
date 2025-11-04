import { MarkdownElement } from './MarkdownElement';

interface MarkdownAdmonitionProps {
    type: string;
    title: string;
    content: string;
}

function MarkdownAdmonition({ type, title, content }: MarkdownAdmonitionProps) {
    const normalizedType = type.toLowerCase();
    const body = content.replace(/^(\r?\n)+|\s+$/g, '');

    return (
        <div className={`markdown-admonition ${normalizedType}`} data-testid={`markdown-admonition-${normalizedType}`} role="alert">
            <strong>{title}</strong>
            <div className="markdown-admonition__content">{body ? <MarkdownElement>{body}</MarkdownElement> : null}</div>
        </div>
    );
}

export default MarkdownAdmonition;
