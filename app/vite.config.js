import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Producao: '/oper-radar/'. Para validar numa pasta paralela use VITE_BASE=/oper-radar-beta/ (scripts/empacotar_frontend.py).
  base: process.env.VITE_BASE || '/oper-radar/',
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
