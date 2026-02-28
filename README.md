# @marconian/markdown

A React Markdown renderer with extended syntax support, built for React applications that need rich content presentation.

## Features

### Core Markdown Support

- **Standard Markdown**: Headings (ATX & Setext), paragraphs, line breaks, horizontal rules
- **Text Formatting**: Bold, italic, bold-italic, strikethrough, marked (==highlight==), inserted (++underline++)
- **Lists**: Ordered, unordered, nested, and task lists with automatic continuation detection
- **Links & Images**: Inline, reference-style, autolinks (URLs, www., email), and image embedding
- **Code**: Inline code spans, indented code blocks, and fenced code blocks with syntax highlighting (via highlight.js core + opt-in languages)
- **Blockquotes**: Standard blockquotes with optional author attribution

### Extended Syntax

- **GitHub-style Admonitions**: Note, Tip, Info, Important, Warning, Caution, Danger with customizable titles
- **Math Rendering**: Inline ($...$) and display ($$...$$) math equations using KaTeX
- **Mermaid Charts**: Embedded diagram rendering with full Mermaid.js support (lazy-loaded on demand)
- **Tables**: Full table support with MUI DataGrid integration for rich data display
- **Spoilers**: Collapsible spoiler content (`||hidden text||`)
- **Definition Lists**: Term-definition pairs with colon syntax
- **Footnotes**: Reference-style footnotes with automatic numbering and back-references
- **Emoji**: Shortcode support (`:emoji_name:`) with full emojilib integration
- **HTML Elements**: Safe rendering of `<details>` and `<summary>` with attribute sanitization
- **Advanced Typography**: Subscript (~text~), superscript (^text^)

### Technical Features

- **Context-Aware References**: Automatic back-reference tracking for code blocks, footnotes, and links
- **Sanitization**: Built-in DOMPurify integration for safe HTML rendering
- **TypeScript**: Full type definitions included for all components and utilities
- **Theming**: CSS variables with auto-injected global styles
- **Dual Format**: Ships ES module (`.mjs`) and CommonJS (`.cjs`) bundles for broad compatibility
- **Tree-Shakeable**: Marked with `"sideEffects": false` for optimal bundling
- **Performance Toggles**: `configureHighlight` and `configureMermaid` APIs to control bundled languages and optional Mermaid loading

## Installation

Install the package along with its peer dependencies:

```bash
pnpm add @marconian/markdown @emotion/react @emotion/styled @mui/material @mui/icons-material @mui/x-data-grid
```

### Peer Dependencies

This package requires the following peer dependencies to be installed in your project:

| Package                              | Version              | Purpose                                         |
| ------------------------------------ | -------------------- | ----------------------------------------------- |
| `react` / `react-dom`                | ^18.0.0 \|\| ^19.0.0 | React framework                                 |
| `@mui/material`                      | ^7.0.0               | Material-UI components for tables & UI elements |
| `@mui/icons-material`                | ^7.0.0               | Material-UI icons                               |
| `@mui/x-data-grid`                   | ^8.0.0               | Advanced data grid for table rendering          |
| `@emotion/react` / `@emotion/styled` | ^11.0.0              | CSS-in-JS styling                               |

## Usage

### Basic Usage

The package publishes both ESM and CJS builds for universal compatibility:

```tsx
import { Markdown } from '@marconian/markdown';

export function Article({ content }: { content: string }) {
    return <Markdown>{content}</Markdown>;
}
```

Global styles are automatically injected on the first render of the `Markdown` component.

### Controlling Style Injection

For better control over style injection (e.g., mounting once at the application root), use `MarkdownGlobalStyles`:

```tsx
import { Markdown, MarkdownGlobalStyles } from '@marconian/markdown';

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <>
            <MarkdownGlobalStyles />
            {children}
        </>
    );
}

export function Article({ content }: { content: string }) {
    return <Markdown>{content}</Markdown>;
}
```

### Advanced Usage: Direct Component Access

````
For custom rendering pipelines, you can import individual components and utilities:

```tsx
import { MarkdownElement, MarkdownContext, getBackRefs } from '@marconian/markdown';
import type { CodeBackRef, FootnoteBackRef, LinkBackRef } from '@marconian/markdown';

const rawMarkdown = '# Hello\n\nThis is [^1] a test.\n\n[^1]: A footnote';
const { text, refs } = getBackRefs(rawMarkdown);

### Configuring Optional Integrations

Slim the bundle or opt into advanced features with the configuration helpers exported from the package entry point.

```tsx
import { configureHighlight, configureMermaid, defaultHighlightLanguages } from '@marconian/markdown';
import sql from 'highlight.js/lib/languages/sql';

// Register only the highlight.js languages you need (defaults cover JS/TS/JSON/YAML/Bash/Python).
configureHighlight({
    languages: [...defaultHighlightLanguages, { name: 'sql', definition: sql }],
});

// Disable Mermaid entirely (e.g., for projects that never render diagrams).
configureMermaid({ enabled: false });

// Or provide a custom loader that lazy-loads Mermaid from a CDN or alternative bundle.
configureMermaid({
    loader: () => import('mermaid/esm/mermaid.core.mjs'),
});
````

// Use refs for custom processing or render with MarkdownElement

````

## Exports

The package exposes the following exports:

### Components
- `Markdown` – Main React component for rendering markdown content
- `MarkdownGlobalStyles` – Optional component for manual style injection
- `MarkdownElement` – Low-level rendering component

### Utilities
- `getBackRefs(markdown: string)` – Extracts and resolves back-references from markdown text
- `MarkdownContext` – React context for markdown rendering state
- `configureHighlight(config)` – Register additional highlight.js languages or override defaults
- `defaultHighlightLanguages` – The built-in highlight.js language registrations used by the library
- `configureMermaid(config)` – Enable/disable Mermaid support or provide a custom loader for diagrams
- `isMermaidEnabled()` – Runtime flag indicating whether Mermaid rendering is active

### Types
- `CaptureInfo` – Regex capture information
- `CodeBackRef` – Code block back-reference definition
- `FootnoteBackRef` – Footnote back-reference definition
- `LinkBackRef` – Link back-reference definition
- `TableCellDefinition` – Table cell structure definition
- `DefinitionListItem` – Definition list item structure
- `HighlightConfiguration` / `HighlightLanguageRegistration` – Type-safe configuration for syntax highlighting
- `MermaidConfiguration` – Options for controlling Mermaid loading behaviour

## Development

### Setup & Scripts

```bash
pnpm install           # Install dependencies
pnpm run test          # Run Vitest test suite (jsdom environment)
pnpm run test:watch    # Run tests in watch mode
pnpm run build         # Build library bundles and type declarations
pnpm run lint          # Lint TypeScript/TSX files with ESLint
pnpm run format        # Format code with Prettier
````

### Build Artifacts

The build process generates the following outputs in `dist/`:

```
dist/
├── index.mjs              # ES module bundle (tree-shakeable)
├── index.cjs              # CommonJS bundle
├── index.mjs.map          # Source map for ES module
├── index.cjs.map          # Source map for CommonJS
└── types/                 # TypeScript declaration files
    ├── index.d.ts
    ├── markdown/
    │   ├── index.d.ts
    │   ├── components/
    │   ├── models/
    │   └── utils/
    └── ...
```

> **Note**: Global styles are injected at runtime via Emotion CSS-in-JS. No standalone CSS file is emitted.

## Project Structure

```
@marconian/markdown/
├── src/
│   ├── index.ts                    # Package entry point & public exports
│   ├── global.d.ts                 # Global type declarations
│   └── markdown/
│       ├── index.tsx               # Main Markdown component & context provider
│       ├── styles.tsx              # Global style injection (Emotion)
│       ├── components/             # Rendering primitives
│       │   ├── MarkdownElement.tsx       # Core recursive renderer
│       │   ├── CodeBlock.tsx             # Syntax-highlighted code blocks
│       │   ├── MarkdownTable.tsx         # MUI DataGrid table renderer
│       │   ├── MarkdownAdmonition.tsx    # GitHub-style callouts
│       │   ├── MarkdownMath.tsx          # KaTeX math renderer
│       │   ├── MermaidChart.tsx          # Mermaid diagram renderer
│       │   ├── MarkdownSpoiler.tsx       # Collapsible spoiler
│       │   ├── MarkdownFootnote.tsx      # Footnote reference
│       │   ├── MarkdownLink.tsx          # Link & image renderer
│       │   └── ...                       # 30+ specialized components
│       ├── models/                 # TypeScript data models
│       │   ├── CaptureInfo.ts            # Regex capture metadata
│       │   ├── CodeBackRef.ts            # Code block references
│       │   ├── FootnoteBackRef.ts        # Footnote references
│       │   ├── LinkBackRef.ts            # Link references
│       │   └── TableCellDefinition.ts    # Table structure
│       └── utils/                  # Helper utilities
│           ├── getBackRefs.ts            # Back-reference extraction
│           ├── getCryptoHash.ts          # Crypto-based key generation
│           ├── captureAll.ts             # Regex capture utility
│           ├── emojis.ts                 # Emoji shortcode mapping
│           ├── getIndentWidth.ts         # Indentation calculation
│           └── stripIndent.ts            # Indentation normalization
├── .github/
│   └── workflows/
│       ├── ci.yml                   # GitHub Actions CI (build + test)
│       └── publish.yml              # GitHub Actions npm publish on release
├── tsconfig.json                   # TypeScript config (development)
├── tsconfig.base.json              # Shared TypeScript settings
├── tsconfig.build.json             # TypeScript config (type emission)
├── vite.config.ts                  # Vite library build configuration
├── vitest.config.ts                # Vitest test runner setup
├── eslint.config.mjs               # ESLint configuration
└── package.json                    # Package metadata & scripts
```

## Dependencies

This package bundles the following runtime dependencies:

| Dependency     | Version  | Purpose                                                                          |
| -------------- | -------- | -------------------------------------------------------------------------------- |
| `dompurify`    | ^3.2.7   | HTML sanitization for safe rendering                                             |
| `emojilib`     | ^3.0.0   | Emoji shortcode-to-unicode mapping                                               |
| `highlight.js` | ^11.9.0  | Syntax highlighting core; only lightweight language packs are bundled by default |
| `katex`        | ^0.16.11 | Math equation rendering                                                          |
| `lodash`       | ^4.17.21 | Utility functions                                                                |
| `mermaid`      | ^10.9.1  | Diagram and chart rendering (lazy-loaded when diagrams are present)              |
| `uuid`         | ^9.0.1   | Unique ID generation                                                             |

> **Note**: These are bundled as dependencies, not peer dependencies. Consumers do not need to install them separately.

## Testing

The package includes comprehensive test coverage using:

- **Vitest** – Fast, Vite-powered test runner
- **jsdom** – Browser environment simulation
- **@testing-library/react** – React component testing utilities
- **@testing-library/jest-dom** – Extended DOM matchers

Tests are co-located with source files (`*.test.tsx`) and cover all major rendering features including edge cases for nested lists, complex tables, math expressions, and admonitions.

## License

MIT © [marconian](https://github.com/marconian)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/marconian/react-markdown).
