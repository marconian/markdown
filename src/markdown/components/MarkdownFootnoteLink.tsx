import { Tooltip } from '@mui/material';
import FootnoteBackRef from '../models/FootnoteBackRef';
import { MarkdownElement } from './MarkdownElement';

function MarkdownFootnoteLink({ footnote }: { footnote: FootnoteBackRef }) {
    const hasResolvedIndex = footnote.index > 0;
    const label = hasResolvedIndex ? footnote.index.toString() : '?';
    const anchorId = hasResolvedIndex ? label : footnote.name;

    return (
        <Tooltip
            placement="right-end"
            title={
                <div className="markdown-tooltip">
                    <span>{label}. </span>
                    <MarkdownElement>{footnote.label}</MarkdownElement>
                </div>
            }>
            <sup className="markdown-footnote-link text-bg-light ms-1 px-1 rounded">
                <a className="btn-link text-decoration-none" href={anchorId ? `#${anchorId}` : undefined}>
                    {label}
                </a>
            </sup>
        </Tooltip>
    );
}

export default MarkdownFootnoteLink;
