
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all environment variables
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Pick up the key from Vercel or local env
  const apiKey = env.API_KEY || env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Direct replacement for browser usage
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
        outDir: 'dist',
        sourcemap: false
    }
  };
});
