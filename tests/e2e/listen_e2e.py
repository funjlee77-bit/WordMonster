"""🎧 듣고 쓰기: 화면에 영어·뜻이 안 보임, 버튼 한 번 = 두 번 읽기(2초 간격), 무작위 순서, 채점·포획·듣기 오답 다시 듣기
브라우저 음성은 가짜(기록만 하는 speechSynthesis)로 바꿔서 검사해요."""
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
FAKE_TTS = """
window.__said = [];
const fake = { speaking: false, pending: false,
  getVoices: () => [{ name: 'Samantha (Enhanced)', lang: 'en-US', localService: true, default: true, voiceURI: 's' }, { name: 'Yuna', lang: 'ko-KR', localService: true }],
  addEventListener() {}, cancel() { this.speaking = false; window.__said.push({ cancel: true, t: performance.now() }); },
  speak(u) { this.speaking = true; window.__said.push({ text: u.text, lang: u.lang, voice: u.voice && u.voice.name, rate: u.rate, t: performance.now() });
    setTimeout(() => { this.speaking = false; window.__said[window.__said.length - 1].end = performance.now(); u.onend && u.onend(); }, 400); } };
Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
"""
try:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(), executable_path='/usr/bin/google-chrome', headless=True, viewport={'width': 1180, 'height': 820}, has_touch=True, args=['--no-sandbox'])
        ctx.add_init_script(FAKE_TTS)
        pg = ctx.pages[0]; pg.goto(URL)
        pg.click('[data-testid="pick-quilly"]'); pg.click('[data-testid="start-go"]'); time.sleep(0.4)
        pg.click('[data-testid="go-listen"]')
        expect(pg.locator('[data-testid="start-listen"]')).to_contain_text('50문제')
        pg.click('[data-testid="start-listen"]')
        q = pg.locator('[data-testid="question"]'); q.wait_for()
        it = WORDS[q.get_attribute('data-item')]
        card = q.inner_text()
        check('문제 화면에 영어·뜻·과 번호가 보이지 않음', it['englishAnswer'] not in card and it['englishDisplay'] not in card and it['koreanAnswer'] not in card and 'Chapter' not in card and not re.search(r'\d+\s*번', card))
        check('읽기 전에는 소리 없음(버튼을 눌러야 읽음)', pg.evaluate('window.__said.filter(x => x.text).length') == 0)
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/listen-question.png'))
        pg.click('[data-testid="listen"]'); time.sleep(3.3)
        said = [x for x in pg.evaluate('window.__said') if 'text' in x]
        check(f'버튼 한 번 → 두 번 읽음 ({len(said)}번)', len(said) == 2 and all(x['text'] == it['englishAnswer'] for x in said))
        gap = said[1]['t'] - said[0]['end']
        check(f'첫 번째가 끝나고 약 2초 뒤 다시 읽음 ({gap:.0f}ms)', 1900 <= gap <= 2600)
        check('영어 음성(향상된 음성)으로 읽음', said[0]['voice'] == 'Samantha (Enhanced)' and said[0]['lang'] == 'en-US')
        order = []; caps = 0; first = it['id']; wrong_typed = 0
        while True:
            pg.locator('[data-testid="result"], [data-testid="question"]').first.wait_for()
            if pg.locator('[data-testid="result"]').count(): break
            q = pg.locator('[data-testid="question"]'); iid = q.get_attribute('data-item'); it = WORDS[iid]; order.append(iid)
            if iid == first: pg.fill('[data-testid="answer"]', it['englishAnswer'] + 'x'); wrong_typed += 1
            else: pg.fill('[data-testid="answer"]', it['englishAnswer'])
            pg.click('[data-testid="answer-submit"]'); fb = pg.locator('[data-testid="feedback"]'); fb.wait_for()
            if len(order) == 1:
                check('틀리면 오답 + 들려준 단어 철자·뜻 공개', fb.get_attribute('data-result') == 'wrong' and it['englishAnswer'] in pg.locator('[data-testid="listen-answer"]').inner_text())
                pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/listen-wrong.png'))
            time.sleep(0.32); pg.click('[data-testid="next"]'); fb.wait_for(state='detached')
            if pg.locator('[data-testid="capture-event"]').count(): caps += 1; pg.click('[data-testid="capture-ok"]')
        check(f'50문제(틀린 단어는 2~4문제 뒤 다시 출제, {wrong_typed}번 만남)', len(order) == 50 and wrong_typed == 2)
        ids = list(dict.fromkeys(order))
        check('출제 순서가 무작위(교재 순서 아님)', ids != sorted(ids) and all(WORDS[i]['chapter'] <= 5 for i in ids))
        check(f'연속 정답 포획 {caps}번', caps >= 4)
        check('결과: 듣고 쓰기 완료 + 다시 만날 단어 표시', '듣고 쓰기 완료' in pg.inner_text('[data-testid="result"]') and WORDS[first]['englishAnswer'] in pg.locator('[data-testid="listen-carried"]').inner_text())
        pg.goto(URL + '#/map'); time.sleep(0.5)
        expect(pg.locator('[data-testid="listen-wrong"]')).to_contain_text('(1)')
        pg.click('[data-testid="listen-wrong"]')
        q = pg.locator('[data-testid="question"]'); q.wait_for()
        check('듣기 오답 다시 듣기: 틀린 단어가 나옴', q.get_attribute('data-item') == first)
        pg.fill('[data-testid="answer"]', WORDS[first]['englishAnswer']); pg.click('[data-testid="answer-submit"]')
        expect(pg.locator('[data-testid="feedback"]')).to_have_attribute('data-result', 'strict')
        pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/listen-correct.png'))
        time.sleep(0.32); pg.click('[data-testid="next"]'); pg.locator('[data-testid="result"]').wait_for()
        pg.goto(URL + '#/map'); time.sleep(0.5)
        check('맞히면 듣기 오답에서 빠짐', pg.locator('[data-testid="listen-wrong"]').count() == 0)
        # 같은 소리 단어: 불꽃화산 왕국에 male(30과) → mail 입력
        pg.click('[data-testid="kingdom-1"]'); pg.click('[data-testid="kingdom-6"]')
        pg.click('[data-testid="start-listen"]')
        for _ in range(60):
            q = pg.locator('[data-testid="question"]'); q.wait_for(); iid = q.get_attribute('data-item')
            if WORDS[iid]['englishAnswer'] == 'male': break
            pg.fill('[data-testid="answer"]', WORDS[iid]['englishAnswer']); pg.click('[data-testid="answer-submit"]'); pg.locator('[data-testid="feedback"]').wait_for(); time.sleep(0.32)
            pg.click('[data-testid="next"]'); pg.locator('[data-testid="feedback"]').wait_for(state='detached')
            if pg.locator('[data-testid="capture-event"]').count(): pg.click('[data-testid="capture-ok"]')
        if WORDS[iid]['englishAnswer'] == 'male':
            pg.fill('[data-testid="answer"]', 'mail'); pg.click('[data-testid="answer-submit"]'); time.sleep(0.3)
            check('같은 소리 단어(mail) → 틀림 아님, 뜻 힌트 후 다시 쓰기', pg.locator('[data-testid="homophone"]').count() == 1 and pg.locator('[data-testid="feedback"]').count() == 0)
            pg.screenshot(path=os.path.join(ROOT, 'tests/e2e/screens/listen-homophone.png'))
        else: print('SKIP male이 60문제 안에 안 나옴')
        ctx.close()
finally:
    srv.terminate()
print(f'{sum(ok)}/{len(ok)} 통과')
