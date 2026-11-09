"""화면 캡처(시각 확인용, iPad 크기 흉내): python3 tests/e2e/screenshots.py"""
import json, os, subprocess, tempfile, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = '/' + json.load(open(os.path.join(ROOT, 'app.config.json')))['repoName'] + '/'
URL = f'http://localhost:4198{BASE}'
OUT = os.path.join(ROOT, 'tests/e2e/screens'); os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT, env={**os.environ, 'PORT': '4198'}); time.sleep(1)
try:
    with sync_playwright() as p:
        for name, vp in [('portrait', {'width': 820, 'height': 1180}), ('landscape', {'width': 1180, 'height': 820})]:
            ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(), executable_path='/usr/bin/google-chrome', headless=True, viewport=vp, has_touch=True, args=['--no-sandbox'])
            pg = ctx.pages[0]; pg.goto(URL)
            pg.screenshot(path=f'{OUT}/{name}-1-start.png')
            pg.click('[data-testid="pick-lumo"]'); pg.click('[data-testid="start-go"]'); time.sleep(0.5)
            pg.screenshot(path=f'{OUT}/{name}-2-home.png')
            pg.click('[data-testid="go-map"]'); pg.click('[data-testid="region-3"]'); time.sleep(0.3)
            pg.screenshot(path=f'{OUT}/{name}-3-map.png')
            pg.click('[data-testid="start-explore"]'); time.sleep(0.5)
            pg.screenshot(path=f'{OUT}/{name}-4-battle.png')
            pg.fill('[data-testid="answer"]', 'take walk'); pg.click('[data-testid="answer-submit"]'); time.sleep(0.4)
            pg.screenshot(path=f'{OUT}/{name}-5-wrong.png', full_page=True)
            ow = pg.evaluate('document.documentElement.scrollWidth > window.innerWidth')
            print(name, '가로 넘침' if ow else '가로 넘침 없음')
            pg.goto(URL + '#/dex'); time.sleep(0.4); pg.screenshot(path=f'{OUT}/{name}-6-dex.png', full_page=True)
            ctx.close()
finally:
    srv.terminate()
