'use client';

import { createContext, PropsWithChildren, useMemo } from 'react';
import MarkdownGlobalStyles from './MarkdownGlobalStyles';
import { getBackRefs } from './methods';
import LinkBackRef from './models/LinkBackRef';
import { MarkdownElement } from './components/MarkdownElement';
import CodeBackRef from './models/CodeBackRef';
import FootnoteBackRef from './models/FootnoteBackRef';

export const MarkdownContext = createContext<{
    markdown: string;
    backRefs: Record<string, LinkBackRef | FootnoteBackRef | CodeBackRef>;
}>({ markdown: '', backRefs: {} });

function Markdown({ children }: PropsWithChildren) {
    const rawMarkdown = useMemo(() => children?.toString() ?? '', [children]);
    const { text: markdown, refs } = useMemo(() => getBackRefs(rawMarkdown), [rawMarkdown]);

    return (
        <>
            <MarkdownGlobalStyles />
            <div className="markdown-paper">
                <MarkdownContext.Provider value={{ markdown, backRefs: refs }}>
                    <MarkdownElement>{markdown}</MarkdownElement>
                </MarkdownContext.Provider>
            </div>
        </>
    );
}

export default Markdown;
