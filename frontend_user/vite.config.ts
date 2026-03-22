import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-dom/client': 'react-dom/client',
      '@react-three/fiber': path.resolve(__dirname, './node_modules/@react-three/fiber'),
      'three': path.resolve(__dirname, './node_modules/three'),
    },
  },
  optimizeDeps: {
    include: ['react-dom/client', '@react-three/fiber'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
