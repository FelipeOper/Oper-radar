import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/oper-radar/',
  // design-system/ fica na raiz do repositorio, fora de app/.
  server: { fs: { allow: ['..'] } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const caminho = id.replaceAll('\\', '/');
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
