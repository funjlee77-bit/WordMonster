// 과일 몬스터 50종 한눈에 보기 이미지 (확인용): node scripts/gallery.mjs → tests/e2e/screens/fruit-gallery.png
import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const out = 'node_modules/.cache/gallery-entry.mjs';
await build({ stdin: { contents: `import { renderToStaticMarkup } from 'react-dom/server'; import { createElement as h } from 'react'; import { FruitMonster } from './src/art/FruitMonster'; import { FRUITS } from './src/core/fruits';
export const items = FRUITS.map((f) => ({ f, svg: renderToStaticMarkup(h(FruitMonster, { def: f, size: 160 })) }));`, resolveDir: '.', loader: 'tsx' },
  bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', packages: 'external' });
const { items } = await import('../' + out);
const cols = 11, cw = 170, ch = 200;
let body = '';
items.forEach(({ f, svg }, i) => {
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  body += `<g transform="translate(${x} ${y})"><rect width="${cw - 4}" height="${ch - 4}" rx="10" fill="#fffaf0"/>${svg.replace('<svg', '<svg x="3" y="0"')}<text x="${cw / 2}" y="${ch - 14}" text-anchor="middle" font-size="14" font-family="Noto Sans CJK KR, sans-serif" font-weight="700">${f.chapter || '⚔'} ${f.name}</text></g>`;
});
const W = cols * cw, H = Math.ceil(items.length / cols) * ch;
mkdirSync('tests/e2e/screens', { recursive: true });
writeFileSync('node_modules/.cache/gallery.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#2d2a6e"/>${body}</svg>`);
execFileSync('rsvg-convert', ['-o', 'tests/e2e/screens/fruit-gallery.png', 'node_modules/.cache/gallery.svg']);
console.log('gallery ok', items.length);
