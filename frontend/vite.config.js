import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Middleware plugin to safely sanitize malformed URIs (e.g. unescaped % characters)
// preventing decodeURI() in Vite's viteTransformMiddleware from throwing "URI malformed"
const safeUriPlugin = () => ({
  name: 'safe-uri-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url) {
        try {
          decodeURI(req.url);
        } catch {
          // Fix % not followed by 2 hex digits
          req.url = req.url.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
          try {
            decodeURI(req.url);
          } catch {
            // Fallback: encode any remaining % that forms an invalid byte sequence
            req.url = req.url.replace(/%/g, '%25');
          }
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [safeUriPlugin(), react()],
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-motion': ['motion/react'],
            'vendor-react':  ['react', 'react-dom'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/spotify': {
          target: backendTarget,
          changeOrigin: true,
        }
      }
    }
  };
});


