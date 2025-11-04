# @tauw/markdown

A reusable Markdown rendering package extracted from the TauwGPT client application. It packages the existing React components and helper utilities without code changes so they can be consumed by any React project.

## Features

- Full Markdown rendering pipeline with admonitions, tables, spoilers, math, charts, and emoji support
- Context-aware back references for code blocks, footnotes, and links
- Uses the existing Tauw design language via `@tauw/tauw-theme-sass`
- Ships pre-built ES module and CommonJS bundles plus TypeScript declarations

## Getting started

```bash
pnpm add @tauw/markdown @emotion/react @emotion/styled @mui/material @mui/x-data-grid @fortawesome/react-fontawesome @fortawesome/pro-solid-svg-icons @fortawesome/pro-light-svg-icons @fortawesome/fontawesome-svg-core @tauw/tauw-theme-sass
```

The package publishes both ESM and CJS builds. In your React application:

```tsx
import { Markdown } from '@tauw/markdown';
import '@tauw/markdown/styles';

export function Article({ content }: { content: string }) {
    return <Markdown>{content}</Markdown>;
}
```

> **Note**
> Consumers are responsible for providing peer dependencies (React, MUI, FontAwesome Pro icons, Tauw theme sass, etc.).

## Development

```bash
pnpm install      # install dependencies
pnpm run test     # run vitest suite (jsdom)
pnpm run build    # generate dist bundles and type declarations
```

The build outputs to `dist/` and produces:

- `dist/index.mjs` (ES module bundle)
- `dist/index.cjs` (CommonJS bundle)
- `dist/types/*` (TypeScript declarations)
- `dist/styles/style.css` (compiled styles)

## Project layout

- `src/markdown` – markdown component, tests, and supporting modules
    - `Markdown.tsx` – main React component + context provider
    - `components/` – rendering primitives (tables, math, spoilers, etc.)
    - `models/` – shared data contracts for back references
    - `utils/` – helper utilities such as `getCryptoHash`
- `src/index.ts` – library entrypoint exports
- `tsconfig.*` – TypeScript configuration for development and type emission
- `vite.config.ts` – Vite library build configuration
- `vitest.config.ts` – Vitest setup with jsdom environment and jest-dom matchers

## Azure Pipelines

The pipeline definition lives in `pipelines/azure-pipelines.yml` and reuses templates from `Shared.Pipelines`. It provides three stages:

1. **Check** – optional advanced security scanning
2. **Build** – installs dependencies, runs `pnpm run build`, and publishes package artifacts
3. **Test** – executes the Vitest suite with caching for pnpm

New shared job templates were added in `Shared.Pipelines/jobs` to support Node package builds and tests (`build-node-package-job.yml`, `run-node-tests-job.yml`).

## Known warnings

- Sass currently emits deprecation warnings due to upstream `@import` usage in theme packages. No code changes were made; warnings are documented for future migrations.
