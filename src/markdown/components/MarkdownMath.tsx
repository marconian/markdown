import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

type MarkdownMathProps = {
    expression: string;
    displayMode?: boolean;
};

function MarkdownMath({ expression, displayMode = false }: MarkdownMathProps) {
    const rendered = useMemo(() => {
        try {
            return katex.renderToString(expression, {
                displayMode,
                throwOnError: false,
                strict: 'ignore',
                output: 'html',
            });
        } catch {
            return expression;
        }
    }, [expression, displayMode]);

    const Tag = displayMode ? 'div' : 'span';
    const className = displayMode ? 'markdown-math-block' : 'markdown-inline-math';

    if (rendered === expression) {
        return <Tag className={className}>{expression}</Tag>;
    }

    return <Tag className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
}

export default MarkdownMath;
