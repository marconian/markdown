import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const external = [
    'react',
    'react-dom',
    '@mui/material',
    '@mui/x-data-grid',
    '@fortawesome/react-fontawesome',
    '@fortawesome/fontawesome-svg-core',
    '@fortawesome/pro-solid-svg-icons',
    '@fortawesome/pro-light-svg-icons',
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
});
