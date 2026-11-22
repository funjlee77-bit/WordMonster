"""재도전 스테이지: 오답 29개면 잠김 → 30개면 열림 → 쌓인 오답 전체 출제 → 5연속 포획, 오늘의 미션, 동료 지정"""
import json, os, subprocess, tempfile, time
from playwright.sync_api import sync_playwright, expect
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = '/' + json.load(open(os.path.join(ROOT, 'app.config.json')))['repoName'] + '/'
URL = f'http://localhost:4195{BASE}'
WORDS = {i['id']: i for i in json.load(open(os.path.join(ROOT, 'src/data/words.json')))['items']}
srv = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT, env={**os.environ, 'PORT': '4195'}); time.sleep(1)
ok = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name, flush=True); ok.append(cond)
    if not cond: raise SystemExit(1)
SEED = """(n) => new Promise((res, rej) => { const r = indexedDB.open('word-monster', 1); r.onsuccess = () => { const db = r.result; const tx = db.transaction('progress', 'readwrite');
  const ids = []; for (let c = 1; c <= 2; c++) for (let k = 1; k <= 20; k++) ids.push('ch0' + c + '-' + String(k).padStart(2, '0'));
  ids.slice(0, n).forEach((id, i) => tx.objectStore('progress').put({ attempts: 1, unaidedCorrect: 0, relaxedCorrect: 0, aidedCorrect: 0, wrong: 1, practiced: 0, helpCount: 0, lastResult: 'wrong', lastAt: '2026-11-0' + (1 + i % 9) + 'T00:00:00Z', lastHelpUsed: false, stage: 1, due: '2026-11-10', lastStageUpDate: null, lastWrongDate: '2026-11-09', pendingRetry: true, served: 1, lastServedAt: null }, id + '|en'));
  tx.oncomplete = res; tx.onerror = rej; }; })"""
try:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(), executable_path='/usr/bin/google-chrome', headless=True, viewport={'width': 1180, 'height': 820}, args=['--no-sandbox'])
        pg = ctx.pages[0]; pg.goto(URL)
        pg.click('[data-testid="pick-quilly"]'); pg.click('[data-testid="start-go"]'); time.sleep(0.4)
        pg.evaluate(SEED, 29); pg.reload()
        check('오답 29개: 재도전 잠김 표시', '29/30' in pg.locator('[data-testid="go-retry-home"]').inner_text())
        pg.evaluate(SEED, 30); pg.reload()
        expect(pg.locator('[data-testid="go-retry-home"]')).to_contain_text('열림')
        check('오답 30개: 재도전 스테이지 열림', True)
        pg.click('[data-testid="go-retry-home"]')
        n = 0; caps = 0
        while True:
            pg.locator('[data-testid="result"], [data-testid="question"]').first.wait_for()
            if pg.locator('[data-testid="result"]').count(): break
            q = pg.locator('[data-testid="question"]'); it = WORDS[q.get_attribute('data-item')]
            pg.fill('[data-testid="answer"]', it['englishAnswer'] if q.get_attribute('data-dir') == 'en' else it['koreanAnswer'])
            pg.click('[data-testid="answer-submit"]'); pg.locator('[data-testid="feedback"]').wait_for(); time.sleep(0.32)
            pg.click('[data-testid="next"]'); pg.locator('[data-testid="feedback"]').wait_for(state='detached'); n += 1
            if pg.locator('[data-testid="capture-event"]').count(): caps += 1; pg.click('[data-testid="capture-ok"]')
        check(f'재도전: 쌓인 오답 {n}문제 전체 출제', n == 30)
        check(f'5·10·15·20·25·30연속 → 포획 {caps}번', caps == 6)
        pg.click('[data-testid="home"]')
        m = pg.locator('[data-testid="missions"]').inner_text()
        check('오늘의 미션: 10연속·오답 5개 극복 달성 표시', '받기' in m)
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/home-missions.png'))
        pg.click('[data-testid="go-dex"]')
        first = pg.locator('.fruit-card.got').first
        if not first.count():
            for k in range(2, 7):
                pg.click(f'[data-testid="dex-k-{k}"]')
                if pg.locator('.fruit-card.got').count(): break
        pg.locator('.fruit-card.got').first.click(); pg.click('[data-testid="set-partner"]')
        pg.goto(URL); time.sleep(0.4)
        check('동료 지정 후 홈에 동료 표시', '동료' in pg.locator('.hero').inner_text())
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/home-partner.png'))
        ctx.close()
finally:
    srv.terminate()
print(f'{sum(ok)}/{len(ok)} 통과')
