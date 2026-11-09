// 내 컴퓨터에서 확인: dist를 GitHub Pages와 같은 하위 경로(/<저장소이름>/)로 띄움
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import cfg from '../app.config.json' with { type: 'json' };
const base = process.env.BASE_PATH || `/${cfg.repoName}/`;
const root = process.argv[2] || 'dist';
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/' ) { res.writeHead(302, { Location: base }); return res.end(); }
  if (!url.startsWith(base)) { res.writeHead(404); return res.end('404 (GitHub Pages 하위 경로 흉내)'); }
  let p = join(root, url.slice(base.length));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(readFileSync(p));
}).listen(port, () => console.log(`http://localhost:${port}${base} 에서 확인하세요 (끄려면 Ctrl+C)`));
