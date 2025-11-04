import { sortBy } from 'lodash';
import { v4 as uuid } from 'uuid';
import CodeBackRef from '../models/CodeBackRef';
import FootnoteBackRef from '../models/FootnoteBackRef';
import LinkBackRef from '../models/LinkBackRef';
import { captureAll } from './captureAll';
import { getIndentWidth } from './getIndentWidth';
import { stripIndent } from './stripIndent';

export function getBackRefs(markdown: string): {
    text: string;
    refs: Record<string, LinkBackRef | FootnoteBackRef | CodeBackRef>;
} {
    const refs: Record<string, LinkBackRef | FootnoteBackRef | CodeBackRef> = {};
    let text = markdown;

    const codeBlockRegex = /^(?<indent>[ \t]*)(?<fence>`{3}|~{3})[ \t]*(?<info>[^\r\n]*)\r?\n(?<code>[\s\S]*?)(?:\r?\n)?\k<indent>\k<fence>[ \t]*(?=\r?\n|$)/gm;
    const codeBlockCaptures = captureAll(codeBlockRegex, text);

    for (const capture of sortBy(codeBlockCaptures?.captures ?? [], (x) => -x.index)) {
        const key = uuid();
        const indent = capture.groups['indent'] ?? '';
        const info = (capture.groups['info'] ?? '').trim();
        const firstToken = info.split(/\s+/)[0] ?? '';
        const language = firstToken && !firstToken.startsWith('{') ? firstToken : undefined;
        const rawCode = (capture.groups['code'] ?? '').replace(/\r?\n$/, '');
        const indentPattern = indent.length > 0 ? new RegExp(`^${indent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gm') : null;
        const code = indentPattern ? rawCode.replace(indentPattern, '') : rawCode;
        refs[key] = {
            code,
            language,
        };

        const before = text.substring(0, capture.index);
        const after = text.substring(capture.index + capture.length);
        const placeholder = `${indent}[_][${key}]`;
        text = `${before}${placeholder}${after}`;
    }

    const footnoteRegex = /^\[\^(?<name>[^\]]+)]:[ \t]*(?<label>.*(?:\r?\n(?:(?: {2,}|\t).*)*)*)/gm;
    const footnoteCaptures = captureAll(footnoteRegex, text)?.captures ?? [];

    let i = footnoteCaptures.length;
    for (const capture of sortBy(footnoteCaptures, (x) => -x.index)) {
        const key = uuid();
        const rawLabel = capture.groups['label'] ?? '';
        const lines = rawLabel.split(/\r?\n/);
        const [firstLine = '', ...continuation] = lines;

        let minIndent: number | null = null;
        for (const line of continuation) {
            if (line.trim().length === 0) continue;
            const width = getIndentWidth(line);
            if (width === 0) {
                minIndent = 0;
                break;
            }
            if (minIndent === null || width < minIndent) {
                minIndent = width;
            }
        }

        const removalWidth = minIndent !== null && minIndent >= 2 ? minIndent : 0;
        const normalizedContinuation = continuation.map((line) => (removalWidth > 0 ? stripIndent(line, removalWidth) : line));
        const normalizedLabel = [firstLine.replace(/\s+$/, ''), ...normalizedContinuation]
            .join('\n')
            .replace(/^\s*\n/, '')
            .replace(/\s+$/, '');
        refs[key] = refs[capture.groups['name']] = {
            name: capture.groups['name'],
            index: i,
            label: normalizedLabel,
        };

        text = `${text.substring(0, capture.index)}\n[_][${key}]\n${text.substring(capture.index + capture.length)}`;
        i--;
    }

    const linkRegex =
        /\[(?<name>[^\^].*?)\]: (?<url>[^\s]+)(?:\s+(?:"(?<labelDouble>[^"\\]*(?:\\.[^"\\]*)*)"|'(?<labelSingle>[^'\\]*(?:\\.[^'\\]*)*)'|\((?<labelParen>[^)]*)\)))?/gm;
    const linkCaptures = captureAll(linkRegex, text);

    for (const capture of sortBy(linkCaptures?.captures ?? [], (x) => -x.index)) {
        const label = capture.groups['labelDouble'] ?? capture.groups['labelSingle'] ?? capture.groups['labelParen'];
        refs[capture.groups['name']] = {
            name: capture.groups['name'],
            url: capture.groups['url'],
            label: label,
        };

        text = `${text.substring(0, capture.index)}${text.substring(capture.index + capture.length)}`;
    }

    return {
        text,
        refs,
    };
}
