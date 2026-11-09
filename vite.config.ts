import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cfg from './app.config.json';

// GitHub Pages 주소 https://아이디.github.io/<저장소이름>/ 에 맞춘 경로.
// GitHub Actions에서는 저장소 이름이 자동으로 BASE_PATH에 들어갑니다.
const base = process.env.BASE_PATH || `/${cfg.repoName}/`;

export default defineConfig({
  base,
  plugins: [react()],
  define: { __BUILD_TAG__: JSON.stringify(process.env.BUILD_TAG || new Date().toISOString()) },
  build: { assetsInlineLimit: 0, sourcemap: false },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] },
} as any);
