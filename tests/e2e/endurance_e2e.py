"""끝장 퀴즈 흐름: 본선 10문제(블록 포획) → (기록 주입으로 489문제 건너뜀) → 마지막 문제 → 90점↑ 레전드 → 오답 스테이지 1·2·3 → 완료 → 새로고침 후 유지"""
import json, os, re, subprocess, tempfile, time
from playwright.sync_api import sync_playwright, expect
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = '/' + json.load(open(os.path.join(ROOT, 'app.config.json')))['repoName'] + '/'
URL = f'http://localhost:4196{BASE}'
WORDS = {i['id']: i for i in json.load(open(os.path.join(ROOT, 'src/data/words.json')))['items']}
srv = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT, env={**os.environ, 'PORT': '4196'}); time.sleep(1)
ok = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name, flush=True); ok.append(cond)
    if not cond: raise SystemExit(1)
def solve(pg, right=True):
    q = pg.locator('[data-testid="end-question"]'); q.wait_for()
    it = WORDS[q.get_attribute('data-item')]; d = q.get_attribute('data-dir')
    pg.fill('[data-testid="end-answer"]', (it['englishAnswer'] if d == 'en' else it['koreanAnswer']) if right else 'zzz')
    pg.click('[data-testid="end-answer-submit"]'); pg.locator('[data-testid="end-feedback"]').wait_for(); time.sleep(0.35)
    pg.click('[data-testid="end-next"]'); pg.locator('[data-testid="end-feedback"]').wait_for(state='detached')
    if pg.locator('[data-testid="capture-event"]').count():
        time.sleep(0.3); pg.click('[data-testid="capture-ok"]')
try:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(), executable_path='/usr/bin/google-chrome', headless=True, viewport={'width': 1180, 'height': 820}, args=['--no-sandbox'])
        pg = ctx.pages[0]; pg.goto(URL)
        pg.click('[data-testid="pick-lumo"]'); pg.click('[data-testid="start-go"]')
        pg.click('[data-testid="go-endurance"]'); pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/endurance-intro.png'))
        pg.click('[data-testid="end-start"]')
        expect(pg.locator('[data-testid="end-progress"]')).to_contain_text('본선 1 / 500')
        time.sleep(0.4); pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/endurance-play.png'))
        for k in range(10): solve(pg, True)
        expect(pg.locator('[data-testid="end-progress"]')).to_contain_text('본선 11 / 500')
        pg.goto(URL + '#/dex'); pg.click('[data-testid="dex-colosseum"]')
        check('본선 첫 10문제 모두 정답 → 콜로세움 몬스터 1마리 포획', '1/60' in pg.locator('[data-testid="dex-colosseum"]').inner_text())
        # 기록 주입: 11~499번은 정답 처리하되 30개는 오답
        pg.evaluate("""() => new Promise((res, rej) => { const r = indexedDB.open('word-monster', 1); r.onsuccess = () => { const db = r.result; const tx = db.transaction('kv', 'readwrite'); const st = tx.objectStore('kv');
          const g = st.get('endurance'); g.onsuccess = () => { const run = g.result; for (let k = 10; k < 499; k++) run.main[k] = { r: (k % 16 === 3 && k < 490) ? 'wrong' : 'strict', a: 'x' }; st.put(run, 'endurance'); }; tx.oncomplete = res; tx.onerror = rej; }; })""")
        pg.goto(URL + '#/endurance'); pg.reload()
        expect(pg.locator('[data-testid="end-progress"]')).to_contain_text('본선 500 / 500')
        check('새로고침 후 이어하기 (500번째 문제)', True)
        solve(pg, True)
        expect(pg.locator('[data-testid="end-phase"]')).to_be_visible()
        sc = pg.locator('[data-testid="end-score"]').inner_text()
        check(f'본선 결과 {sc} → 레전드 포획 표시', '레전드' in pg.locator('[data-testid="end-phase"]').inner_text() and float(sc.replace('점', '')) >= 90)
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/endurance-phase.png'))
        pg.click('[data-testid="end-next-stage"]')
        prog = pg.locator('[data-testid="end-progress"]').inner_text(); n = int(prog.split('/')[-1])
        check(f'오답 스테이지 1: 틀린 {n}문제만 출제', prog.startswith('오답 스테이지 1') and n == 30)
        time.sleep(0.3); pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/endurance-boss.png'))
        for k in range(n): solve(pg, k >= 2)  # 2개 틀림 → 28/30 = 93.3점
        check('스테이지 1 90점 이상 → 보스 레전드 포획', '레전드' in pg.locator('[data-testid="end-phase"]').inner_text())
        pg.click('[data-testid="end-next-stage"]')
        for k in range(2): solve(pg, False)
        check('스테이지 2: 0점 → 포획 실패 안내', '모자라요' in pg.locator('[data-testid="end-phase"]').inner_text())
        pg.click('[data-testid="end-next-stage"]')
        expect(pg.locator('[data-testid="end-progress"]')).to_contain_text('오답 스테이지 3')
        for k in range(2): solve(pg, True)
        check('스테이지 3: 100점 → 레전드 포획', '레전드' in pg.locator('[data-testid="end-phase"]').inner_text())
        pg.click('[data-testid="end-finish"]')
        expect(pg.locator('[data-testid="end-done"]')).to_contain_text('완전 정복')
        check('완전 정복 화면', True)
        pg.reload(); pg.goto(URL + '#/dex'); pg.click('[data-testid="dex-colosseum"]')
        t = pg.locator('[data-testid="dex-colosseum"]').inner_text()
        check('새로고침 후 도감 유지 (블록 포획 2 + 레전드 3 = 5/60): ' + t, '5/60' in t)
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/dex-colosseum.png'))
        ctx.close()
finally:
    srv.terminate()
print(f'{sum(ok)}/{len(ok)} 통과')
