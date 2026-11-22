// 동물 몬스터 300종 한눈에 보기: node scripts/monster-gallery.mjs → tests/e2e/screens/monsters-300-*.png
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const out = 'node_modules/.cache/mg.mjs';
await build({ stdin: { contents: `import { renderToStaticMarkup } from 'react-dom/server'; import { createElement as h } from 'react'; import { ChibiMonster } from './src/art/ChibiMonster'; import { MONSTERS } from './src/core/monsters';
export const items = MONSTERS.map((m) => ({ m, svg: renderToStaticMarkup(h(ChibiMonster, { art: m.art, size: 120, label: false })) }));`, resolveDir: '.', loader: 'tsx' }, bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', packages: 'external', logLevel: 'error' });
const { items } = await import('../' + out);
const per = 100, cols = 10, cw = 130, ch = 150;
for (let page = 0; page * per < items.length; page++) {
  let body = '';
  items.slice(page * per, page * per + per).forEach(({ m, svg }, i) => {
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    body += `<g transform="translate(${x} ${y})"><rect x="2" y="2" width="${cw - 4}" height="${ch - 4}" rx="10" fill="${m.tier === 'legend' ? '#4a3a10' : m.tier === 'rare' ? '#2e2a66' : '#22203d'}"/>${svg.replace('<svg', '<svg x="5" y="2"')}<text x="${cw / 2}" y="${ch - 12}" text-anchor="middle" font-size="11" fill="#fff" font-family="Noto Sans CJK KR, sans-serif">${m.id} ${m.name}</text></g>`;
  });
  const n = Math.min(per, items.length - page * per), W = cols * cw, H = Math.ceil(n / cols) * ch;
  writeFileSync(`node_modules/.cache/mg${page}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#15122e"/>${body}</svg>`);
  execFileSync('rsvg-convert', ['-o', `tests/e2e/screens/monsters-300-${page + 1}.png`, `node_modules/.cache/mg${page}.svg`]);
}
console.log('ok', items.length);
