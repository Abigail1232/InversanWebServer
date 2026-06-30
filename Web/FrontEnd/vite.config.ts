import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig(async () => {
  const plugins = [react(), svgr()];
  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true }));
  }
  return {
    plugins,
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      watch: {
        usePolling: true,
      },
      host: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'leaflet', 'react-leaflet'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-router': ['react-router-dom'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
