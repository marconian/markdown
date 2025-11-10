import { useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { getMermaid } from '../mermaid';

function MermaidChart({ definition }: { definition: string }) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const target: HTMLDivElement = container;

        let cancelled = false;

        async function renderMermaid() {
            const mermaid = await getMermaid();
            if (!mermaid || cancelled) return;

            try {
                const parsed = await mermaid.parse(definition);
                if (!parsed || cancelled) return;

                const { svg, bindFunctions } = await mermaid.render(`diagram-${uuid()}`, definition);
                if (cancelled) return;

                target.innerHTML = svg;
                bindFunctions?.(target);
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Mermaid rendering failed', error);
                }
            }
        }

        renderMermaid();

        return () => {
            cancelled = true;
            target.innerHTML = '';
        };
    }, [definition]);

    return <div ref={containerRef} className="w-100 mb-3 overflow-auto" />;
}

export default MermaidChart;
