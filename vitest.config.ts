import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, './frontend/node_modules/react'),
      'react-dom': path.resolve(__dirname, './frontend/node_modules/react-dom'),
    },
  },
  test: {
    projects: [
      {
        test: {
          name: 'backend',
          include: ['backend/tests/**/*.test.ts'],
          environment: 'node',
          globals: true,
          testTimeout: 20000,
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'frontend',
          include: ['frontend/tests/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          globals: true,
          setupFiles: [path.resolve(__dirname, './frontend/tests/setup.ts')],
          testTimeout: 20000,
        },
      },
    ],
  },
});
