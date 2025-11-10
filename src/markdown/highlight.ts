import hljs from 'highlight.js/lib/core';
import type { HLJSApi, LanguageFn } from 'highlight.js';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';

export type HighlightLanguageRegistration = {
    name: string;
    definition: LanguageFn;
};

const registeredLanguages = new Set<string>();

const defaultLanguageRegistrations: HighlightLanguageRegistration[] = [
    { name: 'javascript', definition: javascript },
    { name: 'js', definition: javascript },
    { name: 'typescript', definition: typescript },
    { name: 'ts', definition: typescript },
    { name: 'tsx', definition: typescript },
    { name: 'json', definition: json },
    { name: 'yaml', definition: yaml },
    { name: 'yml', definition: yaml },
    { name: 'bash', definition: bash },
    { name: 'sh', definition: bash },
    { name: 'shell', definition: bash },
    { name: 'python', definition: python },
    { name: 'py', definition: python },
];

function registerLanguage({ name, definition }: HighlightLanguageRegistration) {
    if (registeredLanguages.has(name) || hljs.getLanguage(name)) {
        return;
    }

    hljs.registerLanguage(name, definition);
    registeredLanguages.add(name);
}

defaultLanguageRegistrations.forEach(registerLanguage);

export interface HighlightConfiguration {
    languages?: HighlightLanguageRegistration[];
}

export function configureHighlight({ languages }: HighlightConfiguration = {}) {
    languages?.forEach(registerLanguage);
}

export function highlightElement(target: HTMLElement) {
    hljs.highlightElement(target);
}

export function getHighlightInstance(): HLJSApi {
    return hljs;
}

export { defaultLanguageRegistrations as defaultHighlightLanguages };
