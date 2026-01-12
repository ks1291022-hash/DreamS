
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Try multiple naming conventions commonly used locally
  const apiKey = env.GEMINI_API_KEY || env.VITE_API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Stringify the key properly for injection into the browser environment
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
