import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fix: Use process.cwd() with an explicit cast if the environment's Process type definition is missing the method.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This bridges your GEMINI_API_KEY from .env.local to the code
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_API_KEY || env.API_KEY),
    },
    server: {
      port: 3000,
      host: true
    }
  };
});