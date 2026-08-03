import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const caminho = id.replaceAll('\\', '/');
          if (caminho.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }
          if (
            caminho.includes('/node_modules/react/')
            || caminho.includes('/node_modules/react-dom/')
            || caminho.includes('/node_modules/scheduler/')
          ) {
            return 'react';
          }
        },
      },
    },
  },
});
