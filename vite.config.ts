import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const stripTildeImporter = (url: string) => {
    if (url.startsWith('~')) {
        return { file: url.slice(1) };
    }
    return null;
};

const external = [
    'react',
    'react-dom',
    '@mui/material',
    '@mui/x-data-grid',
    '@fortawesome/react-fontawesome',
    '@fortawesome/fontawesome-svg-core',
    '@fortawesome/pro-solid-svg-icons',
    '@fortawesome/pro-light-svg-icons',
    '@tauw/tauw-theme-sass',
];

const sharedDependencies = ['dompurify', 'emojilib', 'highlight.js', 'katex', 'lodash', 'mermaid', 'uuid'];

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        sourcemap: true,
        emptyOutDir: true,
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'TauwMarkdown',
            formats: ['es', 'cjs'],
            fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
        },
        rollupOptions: {
            external: [...external, ...sharedDependencies],
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                        return 'styles/[name][extname]';
                    }
                    return 'assets/[name][extname]';
                },
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                importer: [stripTildeImporter],
            },
        },
    },
});
