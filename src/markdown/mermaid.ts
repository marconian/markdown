import type mermaid from 'mermaid';

export type MermaidModule = typeof mermaid;
export type MermaidLoader = () => Promise<{ default: MermaidModule }>;

export interface MermaidConfiguration {
    enabled?: boolean;
    loader?: MermaidLoader;
}

let mermaidEnabled = true;
let mermaidLoader: MermaidLoader = () => import('mermaid');
let cachedMermaid: Promise<MermaidModule | null> | null = null;

export function configureMermaid({ enabled, loader }: MermaidConfiguration = {}) {
    if (typeof enabled === 'boolean') {
        mermaidEnabled = enabled;
        if (!mermaidEnabled) {
            cachedMermaid = Promise.resolve(null);
        } else {
            cachedMermaid = null;
        }
    }

    if (loader) {
        mermaidLoader = loader;
        cachedMermaid = null;
    }
}

async function loadMermaid(): Promise<MermaidModule | null> {
    if (!mermaidEnabled) return null;

    if (!cachedMermaid) {
        cachedMermaid = mermaidLoader()
            .then((mod) => mod.default)
            .catch(() => null);
    }

    return cachedMermaid;
}

export async function getMermaid(): Promise<MermaidModule | null> {
    return loadMermaid();
}

export function isMermaidEnabled(): boolean {
    return mermaidEnabled;
}
