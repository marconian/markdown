import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        setupFiles: ['@testing-library/jest-dom/vitest', 'src/markdown/__tests__/test-utils.tsx'],
        deps: {
            inline: ['@mui/x-data-grid'],
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
        },
        css: {
            modules: {
                classNameStrategy: 'stable',
            },
        },
    },
});
