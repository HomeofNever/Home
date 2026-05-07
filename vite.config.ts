import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  plugins: [yaml(), sveltekit()],
  test: {
    include: ['src/**/*.test.ts']
  }
});
