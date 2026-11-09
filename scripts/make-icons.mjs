// 앱 아이콘 만들기(한 번만 실행): 캐릭터 SVG → public/icons/*.png  (rsvg-convert 필요)
import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const out = 'node_modules/.cache/icon-entry.mjs';
await build({ stdin: { contents: `import { renderToStaticMarkup } from 'react-dom/server'; import { AppIconArt } from './src/art/Characters'; export const svg = renderToStaticMarkup(AppIconArt());`, resolveDir: '.', loader: 'tsx' },
  bundle: true, platform: 'node', format: 'esm', outfile: out, packages: 'external', jsx: 'automatic' });
const { svg } = await import('../' + out);
mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon.svg', svg);
// 마스커블: 가장자리 여백 확보
const maskable = svg.replace('<svg viewBox="0 0 200 200"', '<svg viewBox="-30 -30 260 260"').replace('<rect width="200" height="200"', '<rect x="-30" y="-30" width="260" height="260"');
writeFileSync('node_modules/.cache/maskable.svg', maskable);
for (const [name, size, src] of [['icon-192.png', 192, 'public/icons/icon.svg'], ['icon-512.png', 512, 'public/icons/icon.svg'], ['apple-touch-icon.png', 180, 'public/icons/icon.svg'], ['maskable-512.png', 512, 'node_modules/.cache/maskable.svg']])
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', `public/icons/${name}`, src]);
console.log('icons ok');
