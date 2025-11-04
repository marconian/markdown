export function stripIndent(line: string, width: number) {
    if (width <= 0) return line;

    let remaining = width;
    let index = 0;
    while (remaining > 0 && index < line.length) {
        const char = line[index];
        if (char === ' ') {
            remaining -= 1;
            index++;
        } else if (char === '\t') {
            const removal = Math.min(4, remaining);
            remaining -= removal;
            index++;
        } else {
            break;
        }
    }

    return line.slice(index);
}
