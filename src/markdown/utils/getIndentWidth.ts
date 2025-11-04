export function getIndentWidth(line: string) {
    let width = 0;
    for (const ch of line) {
        if (ch === ' ') width += 1;
        else if (ch === '\t') width += 4;
        else break;
    }
    return width;
}
