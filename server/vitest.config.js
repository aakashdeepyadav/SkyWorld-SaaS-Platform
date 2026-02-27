import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 10000,
        hookTimeout: 10000,
        include: ['__tests__/**/*.test.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['utils/**', 'services/**', 'middleware/**', 'controllers/**', 'models/**'],
            exclude: ['node_modules', '__tests__'],
        },
    },
});
