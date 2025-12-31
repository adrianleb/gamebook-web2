import { defineConfig } from 'vite';

/**
 * Vite configuration for browser-based gamebook playtesting.
 *
 * Per agent-b's perspective (Issue #58):
 * - Content files served from public/ directory (not bundled)
 * - Import maps for clean engine imports
 * - Hot-reload for content iteration during scene writing
 * - Production build bundles engine while keeping content static
 */
export default defineConfig({
  // Entry point for the dev server
  root: '.',

  // Public directory - files here are served at root path
  // Content files (JSON) must remain static for fetch() to work
  publicDir: 'content',

  // Dev server configuration
  server: {
    port: 5173,
    strictPort: false,
    open: true, // Auto-open browser on dev start
    cors: true,
  },

  // Build configuration
  build: {
    outDir: 'dist/browser',
    emptyOutDir: true,

    // Rollup options for TypeScript handling
    rollupOptions: {
      input: {
        main: './index.html',
      },

      // Ensure TypeScript files are handled correctly
      output: {
        // Preserve module structure for engine imports
        manualChunks: undefined,
      },
    },

    // Target modern browsers with ES modules
    target: 'esnext',

    // Keep CSS separate for the DOS aesthetic
    cssCodeSplit: false,
  },

  // Disable file watching for node_modules (performance)
  optimizeDeps: {
    exclude: [],
  },

  // Resolve aliases for clean imports
  resolve: {
    alias: {
      // Engine imports: /src/engine/* -> actual source
      '/src/engine': '/src/engine',
      '/src/ui': '/src/ui',
    },
  },

  // Ensure content files are NOT bundled (per agent-b)
  // They must be fetched via fetch('/content/scenes/*.json')
  assetsInclude: ['**/*.json'],
});
