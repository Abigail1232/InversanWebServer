declare module 'rollup-plugin-visualizer' {
  import type { Plugin } from 'rollup';
  export function visualizer(options?: { open?: boolean; filename?: string; gzipSize?: boolean }): Plugin;
}
