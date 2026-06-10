import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude draco3dgltf from standard pre-bundling so the worker can load the WASM dynamically
    exclude: ['draco3dgltf']
  },
  server: {
    headers: {
      // Required for High-Performance Web Workers and SharedArrayBuffer memory transfers
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});