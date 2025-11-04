import React, { cloneElement, createElement, isValidElement, ReactElement, useMemo } from 'react';
import CaptureInfo from '../models/CaptureInfo';
import getCryptoHash from '@/markdown/utils/getCryptoHash';
import { MarkdownElement } from './MarkdownElement';

function MarkdownNestedElements({ items }: { items: CaptureInfo[] }) {
    const isBlockQuote = useMemo(() => items.some((x) => !x.groups['type']), [items]);

    if (isBlockQuote) {
        const normalizedMarkdown = items
            .map((item) => {
                const indent = item.groups['indent'] ?? '';
                const text = item.groups['text'] ?? '';
                const strippedIndent = indent.replace(/^>\s?/, '');
                return `${strippedIndent}${text}`;
            })
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^>(\S)/gm, '> $1')
            .replace(/^ {1,3}(\d+\.\s.*)/gm, '    $1');

        return (
            <blockquote className="blockquote py-2 ps-5 border-left border-dark bg-body-secondary">
                <div>
                    <MarkdownElement>{normalizedMarkdown}</MarkdownElement>
                </div>
            </blockquote>
        );
    }

    function renderList(listItems: CaptureInfo[], currentIndent = 0, startIndex?: number, path = 'r') {
        const acc: ReactElement[] = [];
        const isNestedLevel = currentIndent > 0;

        const buffer: CaptureInfo[] = [];
        let bufferIndentLevel = currentIndent;

        let nestedListCount = 0;
        const levelTaskFlags: boolean[] = [];

        const listLikePattern = /^(?:([\-+*•]|\d+\.)\s+|\[(?:[ xX])\]\s+)/;
        const taskPattern = /^\[[ xX]\]\s/;

        function getLineIndentWidth(line: string) {
            let width = 0;
            for (const ch of line) {
                if (ch === ' ') width += 1;
                else if (ch === '\t') width += 4;
                else break;
            }
            return width;
        }

        function inferContinuationIndent(rawText: string) {
            const lines = rawText.split(/\r?\n/).slice(1);
            const candidates = lines
                .map((line) => line.replace(/\r$/, ''))
                .filter((line) => {
                    const trimmed = line.trim();
                    if (trimmed.length === 0) return false;
                    if (listLikePattern.test(trimmed)) return false;
                    if (taskPattern.test(trimmed)) return false;
                    return true;
                })
                .map((line) => getLineIndentWidth(line));

            return candidates.length > 0 ? Math.min(...candidates) : undefined;
        }

        function processBuffer(parentIndex: number) {
            // Flush buffered deeper-indented items as a nested list appended to the previous list item.
            const lastIndex = acc.length - 1;
            const lastItem = acc[lastIndex];
            const childPath = `${path}.${parentIndex}.${nestedListCount++}`;
            const nestedList = renderList(buffer, bufferIndentLevel, undefined, childPath);

            if (lastItem) {
                // Proper semantics: nested <ul>/<ol>/<blockquote> should be a child of the previous <li>/<div>, not a sibling.
                // Access existing children safely (cloneElement target is a ReactElement)
                // Use ReactElement<unknown> instead of any to satisfy linting and retain type safety.
                const existingChildren = (lastItem as ReactElement<Record<string, unknown>>).props?.children as React.ReactNode | undefined;
                const newChildrenArray: React.ReactNode[] = [];
                if (existingChildren !== undefined) {
                    if (Array.isArray(existingChildren)) newChildrenArray.push(...existingChildren);
                    else newChildrenArray.push(existingChildren);
                }
                // Ensure all existing child ReactElements have keys if we're introducing keyed siblings (nested lists have keys)
                for (let c = 0; c < newChildrenArray.length; c++) {
                    const child = newChildrenArray[c];
                    if (isValidElement(child) && child.key == null) {
                        const parentKey = lastItem.key ?? 'parent';
                        newChildrenArray[c] = cloneElement(child, {
                            key: `${parentKey}-c${c}`,
                        });
                    }
                }
                newChildrenArray.push(nestedList);
                // cloneElement preserves the original key so we don't introduce an unkeyed Fragment (fixes key warning).
                acc[lastIndex] = cloneElement(lastItem, {}, ...newChildrenArray);
            } else {
                // No preceding sibling to attach to; push the nested list itself (already has a key assigned internally).
                acc.push(nestedList);
            }

            buffer.length = 0;
            bufferIndentLevel = currentIndent;
        }

        function getIndentLevel(item: CaptureInfo) {
            const indentLength = item.groups['indent']?.length ?? 0;
            if (indentLength <= 0) return 0;
            return Math.max(1, Math.ceil(indentLength / 2));
        }

        const listType = listItems.some((x) => !!x.groups['type'])
            ? /^\d/.exec(listItems.find((x) => getIndentLevel(x) === currentIndent)?.groups['type'] ?? '')
                ? 'ol'
                : 'ul'
            : 'blockquote';
        let orderedListStart = startIndex ?? 1;
        if (listType === 'ol' && startIndex == null) {
            const firstItemAtLevel = listItems.find((item) => getIndentLevel(item) === currentIndent);
            if (firstItemAtLevel?.groups['type']) {
                const parsed = parseInt(firstItemAtLevel.groups['type'].replace('.', ''), 10);
                if (!Number.isNaN(parsed)) orderedListStart = parsed;
            }
        }

        let i = 0;
        for (const item of listItems) {
            const indentLevel = getIndentLevel(item);
            const text = item.groups['text'];
            const type = item.groups['type'];

            const taskMatch = text.match(/^\[(?<checked>[ xX])\] (?<task>.*)/);
            const isTaskListItem = taskMatch !== null;
            const listNumber = type ? parseInt(type.replace('.', ''), 10) : NaN;

            if (indentLevel === currentIndent) {
                if (buffer.length) processBuffer(acc.length - 1);

                const tagName = !isBlockQuote ? 'li' : 'div';
                const listItemProps: Record<string, unknown> = {
                    key: `li-${currentIndent}-${i}-${getCryptoHash(text)}`,
                    className: isTaskListItem ? 'markdown-task-list-item' : undefined,
                };

                if (!isBlockQuote && isNestedLevel) {
                    listItemProps.role = 'none';
                }

                levelTaskFlags.push(isTaskListItem);

                if (isTaskListItem) {
                    const existingStyle = (listItemProps.style as React.CSSProperties | undefined) ?? {};
                    listItemProps.style = {
                        ...existingStyle,
                        listStyleType: 'none',
                    };
                }

                if (listType === 'ol' && tagName === 'li' && !Number.isNaN(listNumber)) {
                    listItemProps.value = listNumber;
                }

                const continuationIndent = inferContinuationIndent(text);
                const listScope = { withinList: true, listIndent: indentLevel, continuationIndent };

                acc.push(
                    createElement(
                        tagName,
                        listItemProps,
                        isTaskListItem ? (
                            <>
                                <input type="checkbox" className="form-check-input me-2" onChange={() => {}} checked={taskMatch.groups?.['checked'].toLowerCase() === 'x'} />
                                <span className="markdown-task-list-content">
                                    <MarkdownElement scope={listScope}>{taskMatch.groups?.['task']}</MarkdownElement>
                                </span>
                            </>
                        ) : (
                            <MarkdownElement scope={listScope}>{text}</MarkdownElement>
                        ),
                    ),
                );
                bufferIndentLevel = indentLevel + 1;
                buffer.length = 0;
            } else if (indentLevel > currentIndent) {
                if (!buffer.length) {
                    bufferIndentLevel = indentLevel;
                }
                buffer.push(item);
            }

            i++;
        }

        if (buffer.length) processBuffer(acc.length - 1);
        // Deterministic key for the list wrapper based on indent + content; avoids ref sequence & SSR divergence.
        const listKey = `list-${path}`;
        const allTasksAtLevel = levelTaskFlags.length > 0 && levelTaskFlags.every(Boolean);
        const listStyle: React.CSSProperties | undefined =
            listType === 'ul' && allTasksAtLevel
                ? {
                      listStyleType: 'none',
                      paddingLeft: currentIndent === 0 ? '0' : '1.5rem',
                      marginLeft: currentIndent === 0 ? '0' : undefined,
                  }
                : undefined;
        return createElement(
            listType,
            {
                key: listKey,
                className: listType === 'blockquote' ? 'blockquote py-2 ps-5 border-left border-dark bg-body-secondary' : undefined,
                start: listType === 'ol' && orderedListStart !== 1 ? orderedListStart : undefined,
                style: listStyle,
            },
            // Override all child keys deterministically to eliminate any duplicate/inherited key anomalies across hydration.
            acc.map((child, idx) => (isValidElement(child) ? cloneElement(child, { key: `${listKey}-item-${idx}` }) : child)),
        );
    }

    return renderList(items, 0, undefined, 'r');
}

export default MarkdownNestedElements;
