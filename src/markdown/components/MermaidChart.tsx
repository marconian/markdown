import mermaid from 'mermaid';
import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';

function MermaidChart({ definition }: { definition: string }) {
    const handleRef = useCallback(
        async (e: HTMLDivElement | null) => {
            if (!e || !(await mermaid.parse(definition))) return;

            const { svg, bindFunctions } = await mermaid.render(`diagram-${uuid()}`, definition);
            e.innerHTML = svg;
            bindFunctions?.(e);
        },
        [definition],
    );

    return (
        <div
            className="w-100 mb-3 overflow-auto"
            ref={(e) => {
                handleRef(e);
            }}
        />
    );
}

export default MermaidChart;
