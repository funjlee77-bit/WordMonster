"""브라우저 자동 검증 (데스크톱 Chrome으로 iPad 화면 크기 흉내 — 실제 iPad 테스트가 아님)
온라인 준비 → 앱 종료 → 오프라인으로 새로 실행 → 미방문 Chapter 탐험 → 기록 저장 확인 → 새 버전 적용 후 기록 유지
사용: npm run build 후  python3 tests/e2e/offline_e2e.py
"""
import json, re, os, shutil, subprocess, sys, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright, expect

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CFG = json.load(open(os.path.join(ROOT, 'app.config.json')))
BASE = f"/{CFG['repoName']}/"
PORT = 4199
URL = f"http://localhost:{PORT}{BASE}"
WORDS = {i['id']: i for i in json.load(open(os.path.join(ROOT, 'src/data/words.json')))['items']}
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
results = []

def check(name, cond):
    results.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name, flush=True)
    if not cond: raise SystemExit(1)

def launch(p, udd, offline=False):
    return p.chromium.launch_persistent_context(udd, executable_path=CHROME, headless=True, offline=offline,
        viewport={'width': 1180, 'height': 820}, has_touch=True, locale='ko-KR', args=['--no-sandbox'])

def answer_round(page, wrong_first=True):
    seen_wrong = False; n = 0; retry_seen = False
    while True:
        page.locator('[data-testid="result"], [data-testid="question"]').first.wait_for()
        if page.locator('[data-testid="result"]').count(): break
        q = page.locator('[data-testid="question"]')
        if not q.count(): page.screenshot(path='/tmp/fail.png'); print(page.inner_text('body')[:500])
        iid, d = q.get_attribute('data-item'), q.get_attribute('data-dir')
        if '다시 도전' in q.inner_text(): retry_seen = True
        it = WORDS[iid]; ans = it['englishAnswer'] if d == 'en' else it['koreanAnswer']
        if d == 'ko': ans = re.sub(r'[\s(),~/\-.]', '', ans)  # 뜻 쓰기: 부호·띄어쓰기 없이 입력해도 정답이어야 함
        if wrong_first and not seen_wrong: ans = 'zzz'; seen_wrong = True
        page.fill('[data-testid="answer"]', ans)
        page.click('[data-testid="answer-submit"]')
        page.locator('[data-testid="feedback"]').wait_for()
        time.sleep(0.35)
        page.click('[data-testid="next"]'); n += 1
        page.locator('[data-testid="feedback"]').wait_for(state='detached')
        if n > 20: raise SystemExit('too many questions')
    return n, retry_seen

def main():
    udd = tempfile.mkdtemp()
    srv = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT, env={**os.environ, 'PORT': str(PORT)})
    time.sleep(1)
    try:
        # 하위 경로 확인
        try: urllib.request.urlopen(f"http://localhost:{PORT}/other/"); check('하위 경로 밖은 404', False)
        except Exception as e: check('하위 경로 밖은 404 (Pages 흉내)', '404' in str(e))
        with sync_playwright() as p:
            ctx = launch(p, udd); page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.goto(URL)
            page.click('[data-testid="pick-quilly"]'); page.click('[data-testid="start-go"]')
            expect(page.locator('[data-testid="offline-chip"]')).to_contain_text('준비 완료', timeout=20000)
            check('온라인 첫 실행 후 "오프라인 사용 준비 완료" 표시', True)
            page.goto(URL + '#/map'); page.reload()
            expect(page.locator('[data-testid="region-25"]')).to_be_visible(timeout=10000)
            check('#/map 직접 접속·새로고침 정상', True)
            ctx.close()

            # 오프라인으로 새로 실행
            ctx = launch(p, udd, offline=True); page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.goto(URL)
            expect(page.locator('[data-testid="go-map"]')).to_be_visible(timeout=10000)
            check('오프라인 새 실행: 홈 화면 표시', True)
            expect(page.locator('[data-testid="offline-chip"]')).to_contain_text('준비 완료', timeout=10000)
            page.click('[data-testid="go-map"]')
            page.click('[data-testid="region-1"]')  # 기본 선택 해제
            page.click('[data-testid="region-23"]')  # 한 번도 열지 않은 Chapter
            page.click('[data-testid="start-explore"]')
            n, retry_seen = answer_round(page)
            check(f'오프라인에서 Chapter 23 탐험 {n}문제 완료', n == 8)
            check('오답이 같은 판 2~4문제 뒤 재출제됨', retry_seen)
            expect(page.locator('[data-testid="capture-event"]')).to_be_visible()
            check('별 2개 이상 → 과일 몬스터 포획 이벤트 화면', True)
            time.sleep(1.2); page.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/capture-event.png'))
            page.click('[data-testid="capture-ok"]')
            page.click('[data-testid="home"]')
            expect(page.locator('[data-testid="home-dex"]')).to_contain_text('1/50')
            check('홈 도감 1/50 표시', True)
            page.reload()
            expect(page.locator('[data-testid="go-map"]')).to_be_visible()
            page.click('[data-testid="go-map"]')
            txt = page.locator('[data-testid="region-23"]').inner_text()
            check('새로고침 후 Chapter 23 기록 유지: ' + txt.replace('\n', ' | '), '만난 단어 8/20' in txt or '만난 단어 7/20' in txt)
            ctx.close()

            # 앱 종료 후 다시 실행해도(오프라인) 기록 유지 + 오답 추격
            ctx = launch(p, udd, offline=True); page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.goto(URL + '#/map')
            expect(page.locator('[data-testid="region-23"]')).to_be_visible(timeout=10000)
            check('재실행 후 기록 유지', '만난 단어' in page.locator('[data-testid="region-23"]').inner_text())
            ctx.close()

            # 새 버전 배포 → 안내 → 적용 → 기록 유지
            subprocess.run(['npm', 'run', 'build'], cwd=ROOT, env={**os.environ, 'BUILD_TAG': f'e2e-{time.time()}'}, check=True, capture_output=True)
            ctx = launch(p, udd); page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.goto(URL)
            banner = page.get_by_text('새 버전이 준비됐어요')
            expect(banner).to_be_visible(timeout=20000)
            check('새 버전 준비 안내 표시 (강제 새로고침 없음)', True)
            page.get_by_role('button', name='지금 적용').click()
            page.wait_for_load_state('load'); time.sleep(1.5)
            expect(page.locator('[data-testid="offline-chip"]')).to_contain_text('준비 완료', timeout=20000)
            page.click('[data-testid="go-map"]')
            check('업데이트 후 학습 기록 유지', '만난 단어 0/20' not in page.locator('[data-testid="region-23"]').inner_text())
            # 실전 모드
            page.goto(URL + '#/exam')
            page.click('[data-testid="exam-n-10"]'); page.click('[data-testid="exam-start"]')
            for i in range(10):
                page.locator('[data-testid="exam-answer"]').fill('x'); page.locator('[data-testid="exam-answer"]').press('Enter'); time.sleep(0.1)
            page.click('[data-testid="exam-confirm"]')  # 마지막 문제에서 Enter → 제출 확인 창
            expect(page.locator('[data-testid="exam-result"]')).to_contain_text('0 / 10')
            check('실전 모드 10문제 제출·채점', True)
            page.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/exam-result.png'), full_page=False)
            ctx.close()
    finally:
        srv.terminate(); shutil.rmtree(udd, ignore_errors=True)
    print(f"\n{sum(r for _, r in results)}/{len(results)} 통과")

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'tests/e2e/screens'), exist_ok=True)
    main()
