import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Suppress chunk size warnings for files < 1MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Chunk strategy: separate vendor bundle
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('@react')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
            return 'vendor';
          }
          // Chunk strategy: separate components
          if (id.includes('components')) {
            return 'components';
          }
          if (id.includes('pages')) {
            return 'pages';
          }
          if (id.includes('lib') || id.includes('utils')) {
            return 'utils';
          }
        },
      },
    },
  },
});
