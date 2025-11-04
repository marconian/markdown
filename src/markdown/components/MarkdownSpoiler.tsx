import { useCallback, useId, useState } from 'react';
import { MarkdownElement } from './MarkdownElement';

interface MarkdownSpoilerProps {
    content: string;
}

function MarkdownSpoiler({ content }: MarkdownSpoilerProps) {
    const [revealed, setRevealed] = useState(false);
    const contentId = useId();

    const toggleSpoiler = useCallback(() => {
        setRevealed((previous) => !previous);
    }, []);

    const body = content;

    return (
        <span className="markdown-spoiler" data-hidden={(!revealed).toString()}>
            <button type="button" className="btn btn-link btn-sm p-0 me-2" onClick={toggleSpoiler} aria-expanded={revealed} aria-controls={contentId}>
                {revealed ? 'Hide spoiler' : 'Show spoiler'}
            </button>
            <span id={contentId} className="markdown-spoiler__content" aria-hidden={!revealed}>
                <MarkdownElement>{body}</MarkdownElement>
            </span>
        </span>
    );
}

export default MarkdownSpoiler;
