import CaptureInfo from '../models/CaptureInfo';

export function captureAll(regExp: RegExp, text: string) {
    const matches = text.matchAll(regExp);

    let result: IteratorResult<RegExpExecArray>;
    const captures: CaptureInfo[] = [];
    do {
        result = matches.next();
        const value = result.value as RegExpExecArray | null;
        if (!value?.groups) break;

        captures.push({
            index: value.index,
            length: value[0].length,
            groups: value.groups,
        });
    } while (!result.done);

    if (!captures.length) return null;

    const startIndex = Math.min(...captures.map((x) => x.index));
    const endIndex = Math.max(...captures.map((x) => x.index + x.length));
    const length = endIndex - startIndex;

    return { captures, startIndex, endIndex, length };
}
