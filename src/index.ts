export { default as Markdown, MarkdownContext } from './markdown';
export { MarkdownGlobalStyles } from './markdown/styles';
export { getBackRefs } from './markdown/utils/getBackRefs';
export { MarkdownElement } from './markdown/components/MarkdownElement';
export { configureHighlight, defaultHighlightLanguages, getHighlightInstance } from './markdown/highlight';
export { configureMermaid, isMermaidEnabled } from './markdown/mermaid';

export type { HighlightLanguageRegistration, HighlightConfiguration } from './markdown/highlight';
export type { MermaidConfiguration } from './markdown/mermaid';

export type { DefinitionListItem } from './markdown/components/MarkdownDefinitionList';
export type { default as CaptureInfo } from './markdown/models/CaptureInfo';
export type { default as CodeBackRef } from './markdown/models/CodeBackRef';
export type { default as FootnoteBackRef } from './markdown/models/FootnoteBackRef';
export type { default as LinkBackRef } from './markdown/models/LinkBackRef';
export type { default as TableCellDefinition } from './markdown/models/TableCellDefinition';
