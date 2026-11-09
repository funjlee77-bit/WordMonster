// 빌드된 dist 폴더의 모든 파일 목록과 내용 해시로 sw.js를 만듦 (파일이 바뀌면 버전도 바뀜)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const DIST = 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(DIST).filter((p) => !p.endsWith('sw.js') && !p.endsWith('.map')).sort();
const h = createHash('sha256');
for (const f of files) { h.update(f); h.update(readFileSync(f)); }
const version = h.digest('hex').slice(0, 12);
const list = ['./', ...files.map((f) => './' + relative(DIST, f).split('\\').join('/'))];
const tpl = readFileSync('scripts/sw-template.js', 'utf8');
writeFileSync(join(DIST, 'sw.js'), tpl.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(list, null, 1)));
// GitHub Pages가 _로 시작하는 파일 등을 숨기지 않도록
writeFileSync(join(DIST, '.nojekyll'), '');
console.log(`sw.js 생성: 버전 ${version}, 사전 캐시 파일 ${list.length}개`);
