import { useEffect, useState } from 'react';
import { useOffline, retryPrepare, isStandalone } from '../pwa';
import { Btn, TopBar } from '../ui';
import { useApp } from '../store';

export default function Guide() {
  const o = useOffline();
  const app = useApp();
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => { navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null)); }, []);
  const standalone = isStandalone();
  return (
    <main className="screen guide">
      <TopBar title="📲 설치·오프라인 안내" back={app.game.friend ? '' : ''} />
      <section className={`panel status-${o.status}`} data-testid="offline-status" data-status={o.status}>
        {o.status === 'ready' && <h2>✅ 오프라인 사용 준비 완료</h2>}
        {o.status === 'preparing' && <h2>⏳ 오프라인 준비 중… {o.detail}</h2>}
        {o.status === 'failed' && <><h2>⚠️ 오프라인 준비 실패</h2><p>{o.detail}</p><Btn kind="gold" onClick={retryPrepare}>다시 시도</Btn></>}
        {o.status === 'unsupported' && <h2>⚠️ 이 브라우저는 오프라인 기능을 지원하지 않아요</h2>}
        {o.status === 'dev' && <h2>🛠 개발 모드 (오프라인 꺼짐)</h2>}
        <p className="small">‘준비 완료’는 인터넷 연결 여부가 아니라, 앱 파일과 500단어 데이터가 이 기기 저장소에 실제로 모두 들어 있는지 확인한 결과예요. {o.detail && o.status === 'ready' ? `(${o.detail})` : ''}</p>
        <p className="small">지금 화면: {standalone ? '🏠 홈 화면 앱' : '🧭 Safari 브라우저'} · 저장 공간 보호 요청: {persisted === null ? '확인 불가' : persisted ? '허용됨' : '허용 안 됨(기기가 공간을 정리할 때 지워질 수 있음)'}</p>
      </section>
      {!standalone && <p className="tag warn">⚠️ Safari에서 연 앱과 홈 화면에 추가한 앱은 학습 기록이 따로 저장될 수 있어요. 아래처럼 홈 화면에 추가한 뒤, 홈 화면 아이콘으로만 공부해 주세요.</p>}
      <section className="panel">
        <h3>iPad에 설치하기</h3>
        <ol>
          <li>Safari로 이 주소에 접속해요.</li>
          <li>주소창 옆 <b>공유 버튼(□↑)</b> → <b>홈 화면에 추가</b> → 추가.</li>
          <li>홈 화면에 생긴 <b>단어몬스터</b> 아이콘으로 앱을 열어요. (인터넷 연결된 상태로)</li>
          <li>이 화면에서 <b>✅ 오프라인 사용 준비 완료</b>가 보일 때까지 기다려요.</li>
          <li>그다음부터는 Wi-Fi가 없어도 아이콘으로 열면 모든 Chapter를 공부할 수 있어요.</li>
        </ol>
        <h3>알아 두세요</h3>
        <ul className="small">
          <li>학습 기록은 이 iPad 안에만 저장돼요(서버·계정 없음). 다른 기기와 자동으로 공유되지 않아요.</li>
          <li>설정 → Safari → 방문 기록 및 웹사이트 데이터 지우기, 또는 기기 저장 공간 정리로 오프라인 파일과 기록이 지워질 수 있어요. 부모 메뉴 → 백업을 가끔 해 주세요.</li>
          <li>새 버전이 나오면 “새 버전이 준비됐어요” 알림이 떠요. 눌러야 적용되고, 학습 기록은 그대로 남아요.</li>
          <li>앱이 공개 주소에 올라가 있으면 단어 데이터(교재 단어 목록)는 누구나 내려받을 수 있어요.</li>
        </ul>
      </section>
    </main>
  );
}
