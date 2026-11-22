import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const out = 'node_modules/.cache/animal-sample.mjs';
await build({ stdin: { contents: `import { renderToStaticMarkup } from 'react-dom/server'; import { createElement as h } from 'react'; import { ChibiMonster as AnimalMonster } from './src/art/ChibiMonster';
const S = [
 ['C001 스파이콘', '고슴도치·바위', { shape: 'egg', element: 'rock', tier: 'common', parts: ['spines', 'ears-small', 'snout'] }],
 ['C041 루파콘', '늑대·얼음', { shape: 'egg', element: 'ice', tier: 'common', parts: ['ears-pointy', 'tail-bushy', 'snout', 'claws'] }],
 ['C058 그리즈젤', '곰·불꽃', { shape: 'tall', element: 'fire', tier: 'common', parts: ['ears-round', 'snout', 'claws'] }],
 ['C073 케라톤', '코뿔소·강철', { shape: 'wide', element: 'metal', tier: 'common', parts: ['ears-small', 'horn', 'tail-tuft'] }],
 ['C099 에코젤', '박쥐·번개', { shape: 'egg', element: 'electric', tier: 'common', parts: ['ears-bat', 'wings-bat', 'teeth'] }],
 ['C151 세라닉스', '피라냐·강철', { shape: 'drop', element: 'metal', tier: 'common', parts: ['fins', 'tail-fin', 'teeth', 'feet-none', 'dorsal'] }],
 ['C167 핀서덱스', '게·강철', { shape: 'wide', element: 'metal', tier: 'common', parts: ['pincers', 'legs-many', 'feet-none', 'antennae'] }],
 ['R005 부투제스', '전갈·그림자', { shape: 'wide', element: 'shadow', tier: 'rare', parts: ['pincers', 'tail-stinger', 'legs-many', 'feet-none'] }],
 ['R058 랩투쿼르', '독수리·바람', { shape: 'tall', element: 'wind', tier: 'rare', parts: ['wings-bird', 'beak-hook', 'crest'] }],
 ['L001 레오고로스', '사자·그림자', { shape: 'egg', element: 'shadow', tier: 'legend', parts: ['mane', 'ears-round', 'snout', 'tail-tuft'] }],
 ['L006 그램푸펜라스', '범고래·강철', { shape: 'wide', element: 'metal', tier: 'legend', parts: ['dorsal', 'fins', 'tail-fluke', 'feet-none'] }],
 ['L018 후드라펜라스', '코브라·그림자', { shape: 'tall', element: 'shadow', tier: 'legend', parts: ['hood', 'tail-coil', 'stripes'] }],
];
export const items = S.map(([n, d, a]) => ({ n, d, svg: renderToStaticMarkup(h(AnimalMonster, { art: a, size: 220 })) }));`, resolveDir: '.', loader: 'tsx' },
  bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', packages: 'external' });
const { items } = await import('../' + out);
const cols = 4, cw = 240, ch = 280;
let body = '';
items.forEach(({ n, d, svg }, i) => {
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  body += `<g transform="translate(${x} ${y})"><rect x="4" y="4" width="${cw - 8}" height="${ch - 8}" rx="14" fill="#262150"/>${svg.replace('<svg', '<svg x="10" y="8"')}<text x="${cw / 2}" y="${ch - 34}" text-anchor="middle" font-size="17" fill="#fff" font-family="Noto Sans CJK KR, sans-serif" font-weight="700">${n}</text><text x="${cw / 2}" y="${ch - 14}" text-anchor="middle" font-size="13" fill="#c9c3ff" font-family="Noto Sans CJK KR, sans-serif">${d}</text></g>`;
});
const W = cols * cw, H = Math.ceil(items.length / cols) * ch;
writeFileSync('node_modules/.cache/animal.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#15122e"/>${body}</svg>`);
execFileSync('rsvg-convert', ['-o', 'tests/e2e/screens/animal-sample.png', 'node_modules/.cache/animal.svg']);
console.log('ok');
