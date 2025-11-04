import FootnoteBackRef from '../models/FootnoteBackRef';
import { MarkdownElement } from './MarkdownElement';

function MarkdownFootnote({ footnote }: { footnote: FootnoteBackRef }) {
    const hasResolvedIndex = footnote.index > 0;
    const anchorId = hasResolvedIndex ? footnote.index.toString() : footnote.name;

    return (
        <ol start={hasResolvedIndex ? footnote.index : undefined}>
            <li id={anchorId}>
                <MarkdownElement>{footnote.label}</MarkdownElement>
            </li>
        </ol>
    );
}

export default MarkdownFootnote;
