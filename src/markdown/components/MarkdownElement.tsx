import { Divider } from '@mui/material';
import { PropsWithChildren, ReactNode, useContext, useMemo } from 'react';
import { MarkdownContext } from '..';
import { captureAll } from '../utils/captureAll';
import CodeBlock from './CodeBlock';
import MarkdownLink from './MarkdownLink';
import MarkdownHeader from './MarkdownHeader';
import MarkdownNestedElements from './MarkdownNestedElements';
import MarkdownTable from './MarkdownTable';
import MarkdownHtmlContent from './MarkdownHtmlContent';
import MermaidChart from './MermaidChart';
import Paragraph from './Paragraph';
import getCryptoHash from '@/markdown/utils/getCryptoHash';
import MarkdownInlineCode from './MarkdownInlineCode';
import MarkdownBold from './MarkdownBold';
import MarkdownStrikethrough from './MarkdownStrikethrough';
import MarkdownItalic from './MarkdownItalic';
import CodeBackRef from '../models/CodeBackRef';
import LinkBackRef from '../models/LinkBackRef';
import CaptureInfo from '../models/CaptureInfo';
import emojis from '../utils/emojis';
import MarkdownMarked from './MarkdownMarked';
import MarkdownInserted from './MarkdownInserted';
import MarkdownSubScript from './MarkdownSubScript';
import MarkdownSuperScript from './MarkdownSuperScript';
import FootnoteBackRef from '../models/FootnoteBackRef';
import MarkdownFootnote from './MarkdownFootnote';
import MarkdownFootnoteLink from './MarkdownFootnoteLink';
import MarkdownBoldItalic from './MarkdownBoldItalic';
import MarkdownDefinitionList from './MarkdownDefinitionList';
import MarkdownAdmonition from './MarkdownAdmonition';
import MarkdownSpoiler from './MarkdownSpoiler';
import MarkdownMath from './MarkdownMath';

type MarkdownRenderScope = {
    withinList?: boolean;
    listIndent?: number;
    continuationIndent?: number;
};

const LIST_MARKER_PATTERN = /^([\-+*•]|\d+\.)\s+/;
const SANITIZED_HTML_BLOCK_TAGS = new Set(['details']);
const ALLOWED_DETAILS_ATTRS = new Set(['open', 'class', 'id', 'title', 'role']);
const ALLOWED_SUMMARY_ATTRS = new Set(['class', 'id', 'title', 'role']);
const ALLOWED_ATTR_PREFIXES = ['data-', 'aria-'];

type AttributeValueMap = Record<string, string | true>;

const ATTRIBUTE_NAME_PATTERN = /([A-Za-z][\w:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function extractAllowedAttributes(source: string, allowedNames: Set<string>): AttributeValueMap {
    const attrs: AttributeValueMap = {};
    if (!source) return attrs;

    let match: RegExpExecArray | null;
    while ((match = ATTRIBUTE_NAME_PATTERN.exec(source)) !== null) {
        const rawName = match[1];
        const name = rawName.toLowerCase();
        const isAllowed = allowedNames.has(name) || ALLOWED_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix));
        if (!isAllowed) continue;

        const hasExplicitValue = match[2] !== undefined || match[3] !== undefined || match[4] !== undefined;
        const value = match[2] ?? match[3] ?? match[4];

        if (name === 'open') {
            const permitted = !hasExplicitValue || (value ?? '').trim().toLowerCase() === 'open' || (value ?? '').trim().toLowerCase() === 'true';
            if (permitted) attrs[name] = true;
            continue;
        }

        if (!hasExplicitValue) {
            attrs[name] = true;
        } else {
            attrs[name] = value ?? '';
        }
    }

    return attrs;
}

function mapAttributesToProps(attrs: AttributeValueMap) {
    const props: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(attrs)) {
        if (name === 'class') {
            if (typeof value === 'string') props.className = value;
            continue;
        }
        if (name === 'open') {
            if (value === true) props.open = true;
            continue;
        }
        props[name] = value === true ? '' : value;
    }
    return props;
}

function MarkdownDetails({ source }: { source: string }) {
    const trimmed = source.trim();
    const detailsMatch = /^<details(?<attrs>[^>]*)>(?<inner>[\s\S]*?)<\/details>$/i.exec(trimmed);
    if (!detailsMatch?.groups) {
        return <MarkdownHtmlContent>{source}</MarkdownHtmlContent>;
    }

    const detailAttrs = extractAllowedAttributes(detailsMatch.groups['attrs'] ?? '', ALLOWED_DETAILS_ATTRS);
    const detailProps = mapAttributesToProps(detailAttrs);
    const inner = detailsMatch.groups['inner'] ?? '';

    const summaryRegex = /<summary(?<attrs>[^>]*)>([\s\S]*?)<\/summary>/i;
    const summaryMatch = summaryRegex.exec(inner);

    let bodyStartIndex = 0;
    let summaryContent = '';
    let summaryProps: Record<string, unknown> | undefined;

    if (summaryMatch?.[0]) {
        summaryContent = summaryMatch[2] ?? '';
        const summaryAttrs = extractAllowedAttributes(summaryMatch.groups?.['attrs'] ?? '', ALLOWED_SUMMARY_ATTRS);
        summaryProps = mapAttributesToProps(summaryAttrs);
        bodyStartIndex = summaryMatch.index + summaryMatch[0].length;
    }

    const bodyContent = inner.slice(bodyStartIndex).replace(/^\s+|\s+$/g, '');

    return (
        <details {...detailProps}>
            {summaryMatch ? (
                <summary {...summaryProps}>
                    <MarkdownElement>{summaryContent.trim()}</MarkdownElement>
                </summary>
            ) : null}
            {bodyContent ? <MarkdownElement>{bodyContent}</MarkdownElement> : null}
        </details>
    );
}

function sanitizeInlineUrl(match: string) {
    // Trim trailing formatting markers or punctuation that should remain outside the link.
    let end = match.length;
    while (end > 0) {
        const char = match[end - 1];
        if (char === '*' || char === '_' || char === '~' || char === '`') {
            end--;
            continue;
        }
        if (/[),.;:!?]/.test(char)) {
            end--;
            continue;
        }
        break;
    }

    const cleaned = match.slice(0, end);
    const trailing = match.slice(end);

    return { cleaned, trailing };
}

export function MarkdownElement({ children, scope }: PropsWithChildren<{ scope?: MarkdownRenderScope }>) {
    const markdown = useMemo(() => children?.toString() ?? '', [children]);
    const { backRefs } = useContext(MarkdownContext);
    const renderScope = scope ?? {};

    if (!markdown.trim()) return [];

    const expressions = {
        paragraph: /(?:^|((?:\r?\n)){2})(?<text>[^\r\n]+(?:\n(?!\1)[^\r\n]+)*)/gm,
        setextHeading: /^(?<text>[^\r\n]+)\r?\n(?<underline>=+|-+)\s*$/gm,
        indentedCode: /^(?<code>(?:(?: {4}|\t).*?(?:\r?\n|$))+)/gm,
        italic: /(?<![!\[\]\/\\])(([_]{1})(?<text>(?:(?!\2)[^_]|_(?!_))+?)\2|([*]{1})(?<text2>(?:(?!\4)[^*]|\*(?!\*))+?)\4)/gm,
        bold: /(?<![!\[\]\/\\])(([_]{2})(?<text>(?:(?!\2)[^_]|_(?!_))+?)\2|([*]{2})(?<text2>(?:(?!\4)[^*]|\*(?!\*))+?)\4)/gm,
        boldItalic: /(?<![!\[\]\/\\])(([_]{3})(?<text>[^\_\n]+)\2|([*]{3})(?<text2>[^*\n]+)\4)/gm,
        strikethrough: /(?<![!\[\]\/\\\w])(?<![~])([~]{2})(?<text>[^~\n]+)\1/gm,
        marked: /(?<![!\[\]\/\\\w])(?<![=])([=]{2})(?<text>[^=\n]+)\1/gm,
        inserted: /(?<![!\[\]\/\\\w])(?<![+])([+]{2})(?<text>[^+\n]+)\1/gm,
        subscript: /(?<=[!\[\]\/\\\w])(?<![~])([~]{1})(?<text>[^~\n]+)\1/gm,
        superscript: /(?<=[!\[\]\/\\\w])(?<![\^])([\^]{1})(?<text>[^\^\n]+)\1/gm,
        quoteAuthor: /^(?:"|&quot;)(?<author>.*)(?:"|&quot;)(?:\s-\s(.*))?$/g,
        link: /(?<image>!)?\[(?<name>.*?)\]\((?<url>(?:\\.|[^\s)])+?)(?:\s+(?:(?<labelDouble>"(?:\\.|[^"\\])*")|(?<labelSingle>'(?:\\.|[^'\\])*')|\((?<labelParen>[^)]*)\)))?\)/gm,
        angleAutolink: /<(?<target>(?:https?:\/\/|mailto:)[^>\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>/gm,
        wwwAutolink: /(?<!:\/\/)(?<![\w@])(?<host>www\.[^\s<]+)(?=$|[\s>),.;:!\?\]])/gm,
        emailAutolink: /(?<![\w@])(?<email>[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?=$|[\s>),.;:!?\]])/gm,
        linkInline: /((?:(?<scheme>\w*):\/\/)(?<url>[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=]+))/gm,
        linkBackRef: /(?<image>!)?\[(?<name>.*?)\]\[(?<id>.*?)\]/gm,
        footnoteBackRef: /\[\^(?<name>.*?)\]/gm,
        list: /^(?<indent> +)?(?:(?<type>(?:[+\-*•]|\d+\.))\s+|(?<task>\[(?<taskState>[ xX])\]\s+))(?<text>(?:.*(?:\r?\n(?!\r?\n|(?: +)?(?:(?:[+\-*•]|\d+\.)\s+|\[(?:[ xX])\]\s+)).*)*))$/gm,
        emojis: /(?<![!\[\]\/\\\w])(?<![:])([:]{1})(?<emoji>[^:\n ]+)\1/gm,
        blockQuote: /^(?<indent>(?:\> ?)+) (?<text>.*)$/gm,
        horizontalLine: /^(?<rule>(?:[-_─*]){3,})$/gm,
        table: /^(?<text>(?:\|.*\|(?:\s|$))+)/gm,
        tableRow: /^\|(?<text>.*)\|$/gm,
    };

    const ESCAPE_SEQUENCE_PATTERN = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;

    function unescapePlaintext(text: string) {
        if (!text || !ESCAPE_SEQUENCE_PATTERN.test(text)) return text;
        ESCAPE_SEQUENCE_PATTERN.lastIndex = 0;
        return text.replace(ESCAPE_SEQUENCE_PATTERN, '$1');
    }

    function findInlineCodeSpan(text: string) {
        for (let i = 0; i < text.length; i++) {
            if (text[i] !== '`') continue;
            if (i > 0 && text[i - 1] === '`') continue;

            let delimiterLength = 1;
            while (text[i + delimiterLength] === '`') delimiterLength++;

            const delimiter = '`'.repeat(delimiterLength);
            let searchIndex = i + delimiterLength;

            while (searchIndex < text.length) {
                const closing = text.indexOf(delimiter, searchIndex);
                if (closing === -1) break;

                const before = closing > 0 ? text[closing - 1] : undefined;
                const after = text[closing + delimiterLength];

                if (before === '`' || after === '`') {
                    searchIndex = closing + 1;
                    continue;
                }

                const content = text.substring(i + delimiterLength, closing);
                if (content.includes('\n')) {
                    searchIndex = closing + 1;
                    continue;
                }

                let code = content;
                if (code.startsWith(' ') && code.endsWith(' ') && code.trim() !== '') {
                    code = code.substring(1, code.length - 1);
                }

                return { index: i, length: closing - i + delimiterLength, code };
            }
        }

        return null;
    }

    function normalizeIndentedCode(raw: string) {
        const sanitized = raw.replace(/\r?\n$/, '');
        const lines = sanitized.split(/\r?\n/);

        const indentCounts = lines
            .filter((line) => line.trim().length > 0)
            .map((line) => {
                const leading = /^([ \t]+)/.exec(line)?.[1] ?? '';
                let width = 0;
                for (const ch of leading) {
                    if (ch === '\t') width += 4;
                    else width += 1;
                }
                return width;
            });

        const minIndent = indentCounts.length > 0 ? Math.min(...indentCounts) : 0;

        return lines
            .map((line) => {
                if (minIndent === 0) return line;

                let remaining = minIndent;
                let index = 0;
                while (remaining > 0 && index < line.length) {
                    const char = line[index];
                    if (char === '\t') {
                        const removal = Math.min(4, remaining);
                        remaining -= removal;
                        index++;
                    } else if (char === ' ') {
                        remaining -= 1;
                        index++;
                    } else {
                        break;
                    }
                }

                return line.slice(index);
            })
            .join('\n');
    }

    function isInsideInlineCode(text: string, position: number) {
        let offset = 0;
        while (offset < text.length) {
            const span = findInlineCodeSpan(text.substring(offset));
            if (!span) break;

            const spanStart = offset + span.index;
            const spanEnd = spanStart + span.length;
            if (position >= spanStart && position < spanEnd) return true;

            offset = spanEnd;
        }

        return false;
    }

    function findInlineHtmlSpan(text: string) {
        const inlineRegex = /<(?<tag>[A-Za-z][\w:-]*)(?:\s[^<>]*)?>(?<content>[^\n]*?)<\/\1>/;
        const match = inlineRegex.exec(text);
        if (!match) return null;
        if (match[0].includes('<') && match[0].includes('>')) {
            return { index: match.index, length: match[0].length, code: match[0] };
        }
        return null;
    }

    function findSpoilerSpan(text: string) {
        let start = text.indexOf('||');
        while (start !== -1) {
            if (start > 0 && text[start - 1] === '\\') {
                start = text.indexOf('||', start + 2);
                continue;
            }

            const end = text.indexOf('||', start + 2);
            if (end === -1) break;
            if (text[end - 1] === '\\') {
                start = text.indexOf('||', end + 2);
                continue;
            }

            const rawContent = text.substring(start + 2, end);
            const trimmedLength = rawContent.trim().length;
            if (trimmedLength === 0) {
                start = text.indexOf('||', end + 2);
                continue;
            }

            const content = rawContent.replace(/^[ \t]*\r?\n/, '').replace(/\r?\n[ \t]*$/, '');

            return { index: start, length: end - start + 2, content };
        }

        return null;
    }

    function findInlineMathSpan(text: string) {
        for (let i = 0; i < text.length; i++) {
            if (text[i] !== '$') continue;
            if (text[i + 1] === '$') continue;
            if (i > 0 && text[i - 1] === '\\') continue;

            let search = i + 1;
            while (search < text.length) {
                if (text[search] === '$' && text[search - 1] !== '\\') {
                    if (text[search + 1] === '$') {
                        search += 2;
                        continue;
                    }

                    const expression = text.substring(i + 1, search);
                    if (expression.trim().length === 0) break;
                    if (expression.includes('\n')) break;
                    return {
                        index: i,
                        length: search - i + 1,
                        expression: expression.replace(/\\\$/g, '$'),
                    };
                }
                search++;
            }
        }

        return null;
    }

    function matchMathBlock(text: string) {
        const blockRegex = /(^|\r?\n)(?<indent>[ \t]*)\$\$(?<content>[\s\S]+?)\$\$(?=\r?\n|$)/;
        const match = blockRegex.exec(text);
        if (!match?.groups) return null;

        const prefixLength = match[1]?.length ?? 0;
        const indent = match.groups['indent'] ?? '';
        const rawContent = match.groups['content'] ?? '';
        const blockText = `${indent}$$${rawContent}$$`;
        const index = match.index + prefixLength;
        const length = blockText.length;
        const expression = rawContent
            .replace(/^\s*\r?\n?/, '')
            .replace(/\r?\n\s*$/, '')
            .replace(/\\\$/g, '$');

        return { index, length, expression };
    }

    function matchHtmlBlock(text: string) {
        const trimmed = text.trim();
        if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) return null;
        const blockRegex = /^<(?<tag>[A-Za-z][\w:-]*)(?:\s[^<>]*)?>([\s\S]*)<\/\1>$/s;
        const match = blockRegex.exec(trimmed);
        if (!match?.groups) return null;
        const tag = (match.groups['tag'] ?? '').toLowerCase();
        return { code: trimmed, tag };
    }

    function findSanitizableHtmlBlock(text: string) {
        for (const tag of SANITIZED_HTML_BLOCK_TAGS) {
            const patternSource = `(^|\\s)(?<code><${tag}(?:\\s[^<>]*)?>([\\s\\S]*?)<\/${tag}>)`;
            const pattern = new RegExp(patternSource, 'i');
            const match = pattern.exec(text);
            if (!match?.groups) continue;
            const code = match.groups['code'];
            if (!code) continue;
            if (code.includes('\n>')) continue;
            const prefixLength = match[1]?.length ?? 0;
            return {
                index: (match.index ?? 0) + prefixLength,
                length: code.length,
                code,
                tag,
            };
        }
        return null;
    }

    function matchDefinitionList(text: string) {
        const definitionRegex = /^(?<term>[^\s:].*?)(?<definitions>(?:\r?\n: {0,3}[^\r\n]+)+)/gm;
        const matches: RegExpExecArray[] = [];

        const firstMatch = definitionRegex.exec(text);
        if (!firstMatch) return null;
        matches.push(firstMatch);
        let blockEnd = definitionRegex.lastIndex;

        while (true) {
            const nextMatch = definitionRegex.exec(text);
            if (!nextMatch) break;
            const between = text.slice(blockEnd, nextMatch.index);
            if (!/^\s*$/.test(between)) {
                definitionRegex.lastIndex = nextMatch.index;
                break;
            }
            matches.push(nextMatch);
            blockEnd = definitionRegex.lastIndex;
        }

        const items = matches.map((match) => {
            const term = (match.groups?.['term'] ?? '').trim();
            const definitionsRaw = match.groups?.['definitions'] ?? '';
            const definitions = definitionsRaw
                .split(/\r?\n: {0,3}/)
                .slice(1)
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
            return { term, definitions };
        });

        return {
            index: matches[0].index,
            length: blockEnd - matches[0].index,
            items,
        };
    }

    function insertBaseElement(index: number, length: number, element: ReactNode) {
        return (
            <>
                <MarkdownElement scope={renderScope}>{markdown.substring(0, index)}</MarkdownElement>
                {element}
                <MarkdownElement scope={renderScope}>{markdown.substring(index + length)}</MarkdownElement>
            </>
        );
    }

    function insertElement(info: RegExpExecArray, element: ReactNode) {
        return insertBaseElement(info.index, info[0].length, element);
    }

    const listItems = captureAll(expressions.list, markdown);
    if (listItems) {
        let { captures, startIndex, length } = listItems;
        captures = captures.map((capture) => {
            const groups = capture.groups ?? {};
            const taskState = groups['taskState'];
            if (groups['task'] && typeof taskState === 'string') {
                const remainder = groups['text'] ?? '';
                const marker = `[${taskState}]`;
                groups['type'] = '-';
                groups['text'] = remainder.length === 0 || remainder.startsWith('\n') ? `${marker}${remainder}` : `${marker} ${remainder}`;
            }
            return capture;
        });

        function getListIndentLevel(target: CaptureInfo) {
            const indentLength = (target.groups['indent'] ?? '').length;
            if (indentLength <= 0) return 0;
            return Math.max(1, Math.ceil(indentLength / 2));
        }

        function shouldAttachContinuation(segment: string) {
            const lines = segment.split(/\r?\n/);
            for (const line of lines) {
                if (line.trim().length === 0) continue;
                const indent = getIndentWidth(line);
                const trimmed = line.trimStart();
                if (indent >= 2) return true;
                if (trimmed.startsWith('>')) return true;
                if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) return true;
                if (/^[:]{1}\s/.test(trimmed)) return true;
                if (/^\[[ xX]\]\s/.test(trimmed)) return true;
                break;
            }
            return false;
        }

        const endOfListIndex = captures.findIndex((current, i, arr) => {
            const next = arr[i + 1];
            if (!next) return true;

            const between = markdown.substring(current.index + current.length, next.index);
            if (between.trim().length > 0 && !shouldAttachContinuation(between)) return true;

            const currentIndent = getListIndentLevel(current);
            const nextIndent = getListIndentLevel(next);
            const currentIsOrdered = /^\d+\./.test(current.groups['type'] ?? '');
            const nextIsOrdered = /^\d+\./.test(next.groups['type'] ?? '');

            if (currentIndent === nextIndent && currentIsOrdered !== nextIsOrdered) return true;

            return false;
        });

        captures = captures.filter((_, i) => i <= endOfListIndex);
        startIndex = Math.min(...captures.map((x) => x.index));
        length = Math.max(...captures.map((x) => x.index + x.length)) - startIndex;

        for (let i = 0; i < captures.length - 1; i++) {
            const current = captures[i];
            const next = captures[i + 1];
            const currentEnd = current.index + current.length;
            const between = markdown.substring(currentEnd, next.index);
            if (between.trim().length === 0) continue;
            if (!shouldAttachContinuation(between)) continue;

            current.groups['text'] = `${current.groups['text'] ?? ''}${between}`;
            current.length += between.length;
        }

        const lastCapture = captures[captures.length - 1];
        const trailing = markdown.substring(lastCapture.index + lastCapture.length, startIndex + length);
        if (trailing.trim().length > 0 && shouldAttachContinuation(trailing)) {
            lastCapture.groups['text'] = `${lastCapture.groups['text'] ?? ''}${trailing}`;
            lastCapture.length += trailing.length;
        }

        length = Math.max(...captures.map((x) => x.index + x.length)) - startIndex;

        return insertBaseElement(startIndex, length, <MarkdownNestedElements items={captures} />);
    }

    expressions.setextHeading.lastIndex = 0;
    const setextHeading = expressions.setextHeading.exec(markdown);
    if (!!setextHeading?.groups) {
        const underline = setextHeading.groups['underline'];
        const level = underline.trim().startsWith('=') ? 1 : 2;
        const text = setextHeading.groups['text'].trim();

        return insertElement(setextHeading, <MarkdownHeader level={level as 1 | 2} text={text} />);
    }

    function getIndentWidth(line: string) {
        let width = 0;
        for (const ch of line) {
            if (ch === ' ') width += 1;
            else if (ch === '\t') width += 4;
            else break;
        }
        return width;
    }

    function stripIndent(line: string, width: number) {
        if (width <= 0) return line;

        let removed = 0;
        let index = 0;
        while (index < line.length && removed < width) {
            const ch = line[index];
            if (ch === ' ') {
                removed += 1;
                index += 1;
            } else if (ch === '\t') {
                const step = Math.min(4, width - removed);
                removed += step;
                index += 1;
            } else {
                break;
            }
        }

        return line.slice(index);
    }

    function normalizeListContinuation(raw: string, removalWidth: number) {
        if (removalWidth <= 0) return raw;

        const lines = raw.split(/\r?\n/);
        const normalized = lines
            .map((line) => {
                if (line.trim().length === 0) return '';
                const indent = getIndentWidth(line);
                const toStrip = Math.min(indent, removalWidth);
                return toStrip > 0 ? stripIndent(line, toStrip) : line;
            })
            .join('\n');

        return normalized.replace(/^\n+/, '');
    }

    function findPreviousMeaningfulLine(text: string, startIndex: number) {
        let cursor = startIndex;
        while (cursor > 0) {
            const lineBreak = text.lastIndexOf('\n', cursor - 1);
            const lineStart = lineBreak === -1 ? 0 : lineBreak + 1;
            const line = text.substring(lineStart, cursor).replace(/\r$/, '');
            if (line.trim().length > 0) {
                return {
                    line,
                    indent: getIndentWidth(line),
                };
            }
            if (lineBreak === -1) break;
            cursor = lineBreak;
        }

        return null;
    }

    function matchRelaxedIndentedCode(text: string) {
        const firstLineRegex = /^(?<line>(?: {2,}|\t).*)/m;
        const firstMatch = firstLineRegex.exec(text);
        if (!firstMatch?.groups) return null;

        const matchIndex = firstMatch.index;
        const previousLineBreak = text.lastIndexOf('\n', Math.max(0, matchIndex - 1));
        const beforePreviousBreak = previousLineBreak > 0 ? text.lastIndexOf('\n', previousLineBreak - 1) : -1;
        const precedingLine = previousLineBreak === -1 ? '' : text.substring(beforePreviousBreak + 1, previousLineBreak);
        const hasBlankLineBefore = previousLineBreak === -1 || precedingLine.trim().length === 0;
        const previousMeaningful = findPreviousMeaningfulLine(text, matchIndex);
        const precedingMeaningful = previousMeaningful?.line ?? '';
        const precededByListItem = LIST_MARKER_PATTERN.test(precedingMeaningful.trimStart()) || /^\[[ xX]\]\s/.test(precedingMeaningful.trimStart());
        const treatAsContinuation = renderScope.withinList || precededByListItem;

        if (!treatAsContinuation && !hasBlankLineBefore) return null;

        let cursor = matchIndex;
        let blockEnd = matchIndex;
        let blockText = '';
        let hasMeaningfulLine = false;
        let hasWideIndent = false;
        let allListLike = true;
        let minIndent: number | null = null;

        while (cursor < text.length) {
            const newlineIndex = text.indexOf('\n', cursor);
            const nextIndex = newlineIndex === -1 ? text.length : newlineIndex + 1;
            const lineWithBreak = text.substring(cursor, nextIndex);
            const lineCore = lineWithBreak.replace(/\r?\n$/, '');

            const leading = /^([ \t]+)/.exec(lineCore)?.[1] ?? '';
            let indentWidth = 0;
            for (const ch of leading) indentWidth += ch === '\t' ? 4 : 1;

            const trimmed = lineCore.trim();
            const isBlankLine = trimmed.length === 0;
            const isListLike = /^([-+*•]|\d+\.)\s/.test(trimmed) || /^>\s/.test(trimmed) || /^\[[ xX]\]\s/.test(trimmed);

            if ((indentWidth >= 2 || isBlankLine) && (!isListLike || trimmed.length === 0)) {
                blockText += lineWithBreak;
                blockEnd = nextIndex;
                if (!isBlankLine) {
                    hasMeaningfulLine = true;
                    if (indentWidth >= 4) hasWideIndent = true;
                    if (minIndent === null || indentWidth < minIndent) minIndent = indentWidth;
                    if (!isListLike) allListLike = false;
                }
                cursor = nextIndex;
                continue;
            }

            break;
        }

        if (!hasMeaningfulLine) return null;
        if (!treatAsContinuation && allListLike && !hasWideIndent) return null;

        return {
            index: matchIndex,
            length: blockEnd - matchIndex,
            raw: blockText,
            minIndent: minIndent ?? 0,
            treatAsContinuation,
        };
    }

    const relaxedIndentedCode = matchRelaxedIndentedCode(markdown);
    if (!!relaxedIndentedCode) {
        if (relaxedIndentedCode.treatAsContinuation) {
            const baseIndent = relaxedIndentedCode.minIndent ?? 0;
            const continuationLimit = renderScope.continuationIndent ?? baseIndent;
            const removalWidth = continuationLimit > 0 && baseIndent > 0 ? Math.min(baseIndent, continuationLimit) : baseIndent;
            const normalizedContinuation = normalizeListContinuation(relaxedIndentedCode.raw, removalWidth);
            return insertBaseElement(relaxedIndentedCode.index, relaxedIndentedCode.length, <MarkdownElement scope={renderScope}>{normalizedContinuation}</MarkdownElement>);
        }

        const normalized = normalizeIndentedCode(relaxedIndentedCode.raw);
        return insertBaseElement(relaxedIndentedCode.index, relaxedIndentedCode.length, <CodeBlock code={normalized} />);
    }

    expressions.indentedCode.lastIndex = 0;
    const indentedCode = expressions.indentedCode.exec(markdown);
    if (!!indentedCode?.groups) {
        const rawCode = indentedCode.groups['code'] ?? '';
        const firstLine = rawCode.split(/\r?\n/)[0] ?? '';
        const codeIndentWidth = getIndentWidth(firstLine);

        let continuationThreshold = 0;
        if (renderScope.withinList) {
            if (typeof renderScope.continuationIndent === 'number') {
                continuationThreshold = renderScope.continuationIndent;
            } else if (typeof renderScope.listIndent === 'number') {
                continuationThreshold = (renderScope.listIndent + 1) * 2;
            }
        }

        if (renderScope.withinList && continuationThreshold > 0 && codeIndentWidth > 0 && codeIndentWidth <= continuationThreshold) {
            const removalWidth = Math.min(codeIndentWidth, continuationThreshold);
            const normalizedContinuation = normalizeListContinuation(rawCode, removalWidth);
            return insertBaseElement(indentedCode.index ?? 0, indentedCode[0].length, <MarkdownElement scope={renderScope}>{normalizedContinuation}</MarkdownElement>);
        }

        const previousLine = findPreviousMeaningfulLine(markdown, indentedCode.index ?? 0);
        if (previousLine && LIST_MARKER_PATTERN.test(previousLine.line.trimStart()) && codeIndentWidth - previousLine.indent <= 2) {
            const removalWidth = continuationThreshold > 0 ? Math.min(codeIndentWidth, continuationThreshold) : codeIndentWidth;
            const normalizedContinuation = normalizeListContinuation(rawCode, removalWidth);
            return insertBaseElement(indentedCode.index ?? 0, indentedCode[0].length, <MarkdownElement scope={renderScope}>{normalizedContinuation}</MarkdownElement>);
        }

        const normalized = normalizeIndentedCode(rawCode);

        return insertElement(indentedCode, <CodeBlock code={normalized} />);
    }

    const sanitizableHtmlBlock = findSanitizableHtmlBlock(markdown);
    if (!!sanitizableHtmlBlock && !isInsideInlineCode(markdown, sanitizableHtmlBlock.index)) {
        const content =
            sanitizableHtmlBlock.tag === 'details' ? (
                <MarkdownDetails source={sanitizableHtmlBlock.code} />
            ) : (
                <MarkdownHtmlContent>{sanitizableHtmlBlock.code}</MarkdownHtmlContent>
            );
        return insertBaseElement(sanitizableHtmlBlock.index, sanitizableHtmlBlock.length, content);
    }

    const htmlBlock = matchHtmlBlock(markdown);
    if (!!htmlBlock) {
        if (htmlBlock.tag && SANITIZED_HTML_BLOCK_TAGS.has(htmlBlock.tag)) {
            return <MarkdownHtmlContent>{htmlBlock.code}</MarkdownHtmlContent>;
        }
        return <CodeBlock code={htmlBlock.code} language="html" />;
    }

    const mathBlock = matchMathBlock(markdown);
    if (!!mathBlock) {
        return insertBaseElement(mathBlock.index, mathBlock.length, <MarkdownMath expression={mathBlock.expression} displayMode />);
    }

    const definitionList = matchDefinitionList(markdown);
    if (!!definitionList) {
        return insertBaseElement(definitionList.index, definitionList.length, <MarkdownDefinitionList items={definitionList.items} />);
    }

    const spoiler = findSpoilerSpan(markdown);
    const spoilerRange = spoiler ? markdown.substring(spoiler.index, spoiler.index + spoiler.length) : '';
    const spoilerContainsParagraphBreak = spoiler ? /\r?\n\r?\n/.test(spoilerRange) : false;

    if (spoilerContainsParagraphBreak && spoiler) {
        return insertBaseElement(spoiler.index, spoiler.length, <MarkdownSpoiler content={spoiler.content} />);
    }

    const paragraphSegments = markdown.split(/(\r?\n){2}/gm).filter((x) => x.trim().length > 0);
    if (paragraphSegments.length > 1) {
        return paragraphSegments.map((segment, i) => <Paragraph key={`p-${i}-${getCryptoHash(segment)}`}>{segment.trim()}</Paragraph>);
    }

    const horizontalLine = expressions.horizontalLine.exec(markdown);
    if (!!horizontalLine?.groups) return insertElement(horizontalLine, <Divider key={`hr-${getCryptoHash(horizontalLine[0])}`} />);

    const blockquoteRows = captureAll(expressions.blockQuote, markdown);
    if (!!blockquoteRows) {
        const { captures, startIndex, length } = blockquoteRows;

        const admonitionMatch = (() => {
            const typeLookup: Record<string, { type: string; title: string }> = {
                note: { type: 'note', title: 'Note' },
                tip: { type: 'tip', title: 'Tip' },
                info: { type: 'info', title: 'Info' },
                important: { type: 'important', title: 'Important' },
                warning: { type: 'warning', title: 'Warning' },
                caution: { type: 'caution', title: 'Caution' },
                danger: { type: 'danger', title: 'Danger' },
            };

            const firstText = (captures[0]?.groups['text'] ?? '').trim();
            const callout = /^\[!(?<type>[A-Z][A-Z0-9_-]*)\](?:\s+(?<label>.*))?$/i.exec(firstText);
            if (!callout?.groups) return null;

            const rawType = callout.groups['type']?.toLowerCase() ?? 'note';
            const mapping = typeLookup[rawType] ?? {
                type: rawType,
                title: rawType.charAt(0).toUpperCase() + rawType.slice(1),
            };
            const customTitle = callout.groups['label']?.trim();
            const title = customTitle && customTitle.length > 0 ? customTitle : mapping.title;

            const bodyMarkdown = captures
                .slice(1)
                .map((capture) => capture.groups['text'] ?? '')
                .join('\n');

            return insertBaseElement(startIndex, length, <MarkdownAdmonition type={mapping.type} title={title} content={bodyMarkdown} />);
        })();

        if (admonitionMatch) return admonitionMatch;

        let author: ReactNode | undefined;
        const last = expressions.quoteAuthor.exec(captures[captures.length - 1].groups['text']);
        if (last?.groups) {
            const authorText = last.groups['author'];
            author = (
                <footer className="blockquote-footer">
                    <cite title={authorText}>{authorText}</cite>
                </footer>
            );

            captures.splice(captures.length - 1, 1);
        }

        const elem = <MarkdownNestedElements items={captures} />;

        return insertBaseElement(
            startIndex,
            length,
            author ? (
                <div>
                    {elem}
                    {author}
                </div>
            ) : (
                elem
            ),
        );
    }

    if (!!spoiler) return insertBaseElement(spoiler.index, spoiler.length, <MarkdownSpoiler content={spoiler.content} />);

    const table = captureAll(expressions.tableRow, markdown);
    if (!!table) {
        const { captures, startIndex, length } = table;

        return insertBaseElement(startIndex, length, <MarkdownTable rows={captures.map((x) => x.groups['text'])} />);
    }

    const inlineMath = findInlineMathSpan(markdown);
    if (!!inlineMath) return insertBaseElement(inlineMath.index, inlineMath.length, <MarkdownMath expression={inlineMath.expression} />);

    const inlineHtml = findInlineHtmlSpan(markdown);
    if (!!inlineHtml) return insertBaseElement(inlineHtml.index, inlineHtml.length, <MarkdownInlineCode>{inlineHtml.code}</MarkdownInlineCode>);

    const footnoteBackRefMatch = expressions.footnoteBackRef.exec(markdown);
    if (!!footnoteBackRefMatch?.groups) {
        const name = footnoteBackRefMatch.groups['name'];

        if (name in backRefs) {
            const footnoteBackRef = backRefs[name] as FootnoteBackRef;
            return insertElement(footnoteBackRefMatch, <MarkdownFootnoteLink footnote={footnoteBackRef} />);
        } else {
            return insertElement(
                footnoteBackRefMatch,
                <MarkdownFootnoteLink
                    footnote={{
                        index: -1,
                        name: name,
                        label: `Footnote for '${name}' cannot be found in content.`,
                    }}
                />,
            );
        }
    }

    for (let level = 1; level <= 6; level++) {
        const headingRegex = new RegExp(`^#{${level}}(?!#)[ \t]*(?<text>[^\r\n]+?)\s*#*\s*$`, 'gm');
        headingRegex.lastIndex = 0;
        const headingMatch = headingRegex.exec(markdown);
        if (!!headingMatch?.groups) {
            const text = (headingMatch.groups['text'] ?? '').replace(/\s*#+\s*$/, '').trim();
            if (!text) continue;
            return insertElement(headingMatch, <MarkdownHeader level={level as 1 | 2 | 3 | 4 | 5 | 6} text={text} />);
        }
    }

    expressions.link.lastIndex = 0;
    const link = expressions.link.exec(markdown);
    if (!!link?.groups) {
        const url = link.groups['url'];
        const name = link.groups['name'];
        const rawLabel = link.groups['labelDouble'] ?? link.groups['labelSingle'] ?? link.groups['labelParen'];
        const label = rawLabel ? rawLabel.replace(/^['\"]|['\"]$/g, '') : name;

        return insertElement(link, <MarkdownLink url={url} name={name} label={label} isImage={!!link.groups['image']} />);
    }

    const boldItalic = expressions.boldItalic.exec(markdown);
    if (!!boldItalic?.groups) return insertElement(boldItalic, <MarkdownBoldItalic>{boldItalic.groups['text'] ?? boldItalic.groups['text2']}</MarkdownBoldItalic>);

    const bold = expressions.bold.exec(markdown);
    if (!!bold?.groups) return insertElement(bold, <MarkdownBold>{bold.groups['text'] ?? bold.groups['text2']}</MarkdownBold>);

    const italic = expressions.italic.exec(markdown);
    if (!!italic?.groups) return insertElement(italic, <MarkdownItalic>{italic.groups['text'] ?? italic.groups['text2']}</MarkdownItalic>);

    const marked = expressions.marked.exec(markdown);
    if (!!marked?.groups) return insertElement(marked, <MarkdownMarked>{marked.groups['text']}</MarkdownMarked>);

    const strikethrough = expressions.strikethrough.exec(markdown);
    if (!!strikethrough?.groups) return insertElement(strikethrough, <MarkdownStrikethrough>{strikethrough.groups['text']}</MarkdownStrikethrough>);

    const inserted = expressions.inserted.exec(markdown);
    if (!!inserted?.groups) return insertElement(inserted, <MarkdownInserted>{inserted.groups['text']}</MarkdownInserted>);

    const subscript = expressions.subscript.exec(markdown);
    if (!!subscript?.groups) return insertElement(subscript, <MarkdownSubScript>{subscript.groups['text']}</MarkdownSubScript>);

    const superscript = expressions.superscript.exec(markdown);
    if (!!superscript?.groups) return insertElement(superscript, <MarkdownSuperScript>{superscript.groups['text']}</MarkdownSuperScript>);

    const inlineCode = findInlineCodeSpan(markdown);
    if (!!inlineCode) return insertBaseElement(inlineCode.index, inlineCode.length, <MarkdownInlineCode>{inlineCode.code}</MarkdownInlineCode>);

    expressions.angleAutolink.lastIndex = 0;
    const angleAutolink = expressions.angleAutolink.exec(markdown);
    if (!!angleAutolink?.groups && angleAutolink.index != null && !isInsideInlineCode(markdown, angleAutolink.index)) {
        const target = angleAutolink.groups['target'];
        const lowerTarget = target.toLowerCase();
        const isMailto = lowerTarget.startsWith('mailto:');
        const isBareEmail = !isMailto && /@/.test(target);
        const url = isBareEmail ? `mailto:${target}` : target;
        const display = isMailto || isBareEmail ? target.replace(/^mailto:/i, '') : target;

        return insertElement(angleAutolink, <MarkdownLink url={url} name={display} />);
    }

    expressions.wwwAutolink.lastIndex = 0;
    const wwwAutolink = expressions.wwwAutolink.exec(markdown);
    if (!!wwwAutolink?.groups && wwwAutolink.index != null && !isInsideInlineCode(markdown, wwwAutolink.index)) {
        const host = wwwAutolink.groups['host'];
        const url = `https://${host}`;

        return insertElement(wwwAutolink, <MarkdownLink url={url} name={host} />);
    }

    expressions.emailAutolink.lastIndex = 0;
    const emailAutolink = expressions.emailAutolink.exec(markdown);
    if (!!emailAutolink?.groups && emailAutolink.index != null && !isInsideInlineCode(markdown, emailAutolink.index)) {
        const email = emailAutolink.groups['email'];
        const url = `mailto:${email}`;

        return insertElement(emailAutolink, <MarkdownLink url={url} name={email} />);
    }

    const linkInline = expressions.linkInline.exec(markdown);
    if (!!linkInline && linkInline.index != null && !isInsideInlineCode(markdown, linkInline.index)) {
        const raw = linkInline[0];
        const { cleaned, trailing } = sanitizeInlineUrl(raw);
        const element = cleaned.length > 0 ? <MarkdownLink url={cleaned} /> : raw;

        return (
            <>
                <MarkdownElement scope={renderScope}>{markdown.substring(0, linkInline.index)}</MarkdownElement>
                {element}
                <MarkdownElement scope={renderScope}>{trailing + markdown.substring(linkInline.index + raw.length)}</MarkdownElement>
            </>
        );
    }

    const emojiCapture = expressions.emojis.exec(markdown);
    if (!!emojiCapture?.groups) {
        const emojiText = emojiCapture.groups['emoji'];
        const emoji = emojis[emojiText];

        return insertElement(
            emojiCapture,
            emoji ? (
                <span className="emoji" role="img" aria-label={emojiText}>
                    {emoji}
                </span>
            ) : (
                <i>{emojiText}</i>
            ),
        );
    }

    const backRefMatch = expressions.linkBackRef.exec(markdown);
    if (!!backRefMatch?.groups) {
        const id = backRefMatch.groups['id'];
        const name = backRefMatch.groups['name'];

        if (id in backRefs) {
            if ((backRefs[id] as CodeBackRef)?.code) {
                const codeBackRef = backRefs[id] as CodeBackRef;
                return insertElement(
                    backRefMatch,
                    codeBackRef.language == 'mermaid' ? <MermaidChart definition={codeBackRef.code} /> : <CodeBlock code={codeBackRef.code} language={codeBackRef.language} />,
                );
            } else if ((backRefs[id] as LinkBackRef)?.url) {
                const linkBackRef = backRefs[id] as LinkBackRef;

                return insertElement(backRefMatch, <MarkdownLink url={linkBackRef.url} name={name} label={linkBackRef.label} isImage={!!backRefMatch.groups['image']} />);
            } else if ((backRefs[id] as FootnoteBackRef)?.index) {
                const footnoteBackRef = backRefs[id] as FootnoteBackRef;

                return insertElement(backRefMatch, <MarkdownFootnote footnote={footnoteBackRef} />);
            }

            return <span>{backRefMatch[0]}</span>;
        }
    }

    if (markdown.includes('\n')) {
        const lines = markdown.split(/\r?\n/);
        const nodes: ReactNode[] = [];
        for (let i = 0; i < lines.length; i++) {
            let segment = lines[i];
            if (i < lines.length - 1) {
                if (segment.endsWith('\\')) {
                    segment = segment.slice(0, -1);
                } else {
                    segment = segment.replace(/[ \t]+$/, '');
                }
            }

            if (segment.length > 0) {
                nodes.push(unescapePlaintext(segment));
            }

            if (i < lines.length - 1) {
                nodes.push('\n');
                nodes.push(<br key={`br-${i}-${getCryptoHash(markdown)}`} />);
            }
        }

        return <>{nodes}</>;
    }

    return <>{unescapePlaintext(markdown)}</>;
}
