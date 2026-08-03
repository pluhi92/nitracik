import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-payment': ['@stripe/stripe-js'],
          'vendor-forms': ['react-bootstrap', 'react-imask', 'react-colorful'],
        },
      },
    },
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
});