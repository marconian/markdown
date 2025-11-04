import { PropsWithChildren, useMemo } from 'react';
import createDOMPurify from 'dompurify';

const ADDITIONAL_TAGS = ['table', 'tbody', 'tfoot', 'thead', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'code', 'div', 'span', 'details', 'summary'];
const ADDITIONAL_ATTRS = ['class', 'title', 'role', 'summary', 'scope', 'colspan', 'rowspan', 'abbr', 'href', 'target', 'rel', 'data-*'];

let cachedPurifier: ReturnType<typeof createDOMPurify> | null = null;

function getSanitizer() {
    if (typeof window === 'undefined') return null;
    if (!cachedPurifier) {
        cachedPurifier = createDOMPurify(window);
    }
    return cachedPurifier;
}

function MarkdownHtmlContent({ children }: PropsWithChildren) {
    const rawHtml = useMemo(() => (typeof children === 'string' ? children : (children?.toString() ?? '')), [children]);

    const sanitized = useMemo(() => {
        const domPurify = getSanitizer();
        if (!domPurify) return null;
        const clean = domPurify.sanitize(rawHtml, {
            ADD_TAGS: ADDITIONAL_TAGS,
            ADD_ATTR: ADDITIONAL_ATTRS,
            RETURN_TRUSTED_TYPE: false,
        });
        return clean;
    }, [rawHtml]);

    if (sanitized == null) {
        return <code>{rawHtml}</code>;
    }

    return <div className="markdown-inline-html" dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

export default MarkdownHtmlContent;
