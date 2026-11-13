"""전설 몬스터 출현·포획 흐름 확인: 숙련 기록을 미리 넣고 Chapter 5 탐험 → 전설 출현 → 도움 없이 전부 정답 → LEGEND 포획 이벤트"""
import json, os, re, subprocess, tempfile, time
from playwright.sync_api import sync_playwright, expect
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = '/' + json.load(open(os.path.join(ROOT, 'app.config.json')))['repoName'] + '/'
URL = f'http://localhost:4197{BASE}'
WORDS = {i['id']: i for i in json.load(open(os.path.join(ROOT, 'src/data/words.json')))['items']}
srv = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT, env={**os.environ, 'PORT': '4197'}); time.sleep(1)
ok = []
try:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(), executable_path='/usr/bin/google-chrome', headless=True, viewport={'width': 1180, 'height': 820}, args=['--no-sandbox'])
        pg = ctx.pages[0]; pg.goto(URL)
        pg.click('[data-testid="pick-moko"]'); pg.click('[data-testid="start-go"]'); time.sleep(0.5)
        ids = [i for i in WORDS if WORDS[i]['chapter'] in (1, 2)][:20]
        pg.evaluate("""(ids) => new Promise((res, rej) => { const r = indexedDB.open('word-monster', 1); r.onsuccess = () => { const db = r.result; const tx = db.transaction('progress', 'readwrite');
          const rec = { attempts: 5, unaidedCorrect: 5, relaxedCorrect: 0, aidedCorrect: 0, wrong: 0, practiced: 0, helpCount: 0, lastResult: 'strict', lastAt: '2026-11-01T00:00:00Z', lastHelpUsed: false, stage: 5, due: '2026-12-30', lastStageUpDate: '2026-11-01', lastWrongDate: null, pendingRetry: false, served: 5, lastServedAt: '2026-11-01T00:00:00Z' };
          for (const id of ids) { tx.objectStore('progress').put(rec, id + '|en'); tx.objectStore('progress').put(rec, id + '|ko'); } tx.oncomplete = res; tx.onerror = rej; }; })""", ids)
        pg.reload(); pg.click('[data-testid="go-map"]'); pg.click('[data-testid="region-1"]'); pg.click('[data-testid="region-5"]'); pg.click('[data-testid="start-explore"]')
        expect(pg.locator('[data-testid="appear"]')).to_contain_text('전설의 몬스터가 나타났다'); ok.append('전설 출현 화면')
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/legend-appear.png')); pg.click('[data-testid="appear-go"]')
        while True:
            pg.locator('[data-testid="result"], [data-testid="question"]').first.wait_for()
            if pg.locator('[data-testid="result"]').count(): break
            q = pg.locator('[data-testid="question"]'); it = WORDS[q.get_attribute('data-item')]
            pg.fill('[data-testid="answer"]', it['englishAnswer'] if q.get_attribute('data-dir') == 'en' else it['koreanAnswer'])
            pg.click('[data-testid="answer-submit"]'); pg.locator('[data-testid="feedback"]').wait_for(); time.sleep(0.35)
            pg.click('[data-testid="next"]'); pg.locator('[data-testid="feedback"]').wait_for(state='detached')
        expect(pg.locator('[data-testid="capture-event"]')).to_contain_text('LEGEND'); ok.append('LEGEND 포획 이벤트')
        time.sleep(1.3); pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/legend-capture.png'))
        pg.click('[data-testid="capture-ok"]'); pg.goto(URL + '#/dex'); time.sleep(0.5)
        expect(pg.locator('[data-testid="dex-count"]')).to_contain_text('1 / 50'); ok.append('도감 등록')
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/dex-legend.png'), full_page=False)
        ctx.close()
finally:
    srv.terminate()
print('PASS', ok)
