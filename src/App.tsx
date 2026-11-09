import { useEffect, useState } from 'react';
import { useApp } from './store';
import { useOffline, applyUpdate } from './pwa';
import { setSoundEnabled } from './sound';
import { Btn, nav } from './ui';
import Start from './screens/Start';
import Home from './screens/Home';
import MapScreen from './screens/MapScreen';
import Cards from './screens/Cards';
import Battle from './screens/Battle';
import Result from './screens/Result';
import Dex from './screens/Dex';
import Exam from './screens/Exam';
import Parent from './screens/Parent';
import Guide from './screens/Guide';

function useRoute() {
  const get = () => location.hash.replace(/^#\/?/, '').split('?')[0];
  const [r, setR] = useState(get());
  useEffect(() => { const f = () => { setR(get()); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
}

export default function App() {
  const app = useApp();
  const route = useRoute();
  const off = useOffline();
  useEffect(() => { setSoundEnabled(app.settings.sound); }, [app.settings.sound]);
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', app.settings.reduceMotion);
    document.documentElement.classList.toggle('skip-fx', app.settings.skipEffects);
  }, [app.settings.reduceMotion, app.settings.skipEffects]);

  if (!app.loaded) return <div className="center-screen">불러오는 중…</div>;
  const busy = route === 'battle' || route === 'exam';
  let screen;
  if (!app.game.friend && route !== 'guide' && route !== 'parent') screen = <Start />;
  else switch (route) {
    case 'map': screen = <MapScreen />; break;
    case 'cards': screen = <Cards />; break;
    case 'battle': screen = <Battle />; break;
    case 'result': screen = <Result />; break;
    case 'dex': screen = <Dex />; break;
    case 'exam': screen = <Exam />; break;
    case 'parent': screen = <Parent />; break;
    case 'guide': screen = <Guide />; break;
    default: screen = <Home />;
  }
  return (
    <div className="app">
      {app.loadError && <div className="banner error" role="alert">⚠️ 기기 저장소를 열 수 없어요. 기록이 저장되지 않을 수 있어요. ({app.loadError}) 개인정보 보호 브라우징(비공개 탭)이면 일반 탭이나 홈 화면 앱으로 열어 주세요.</div>}
      {app.saveError && <div className="banner error" role="alert">⚠️ {app.saveError} <Btn kind="ghost" onClick={() => { app.clearSaveError(); nav('parent'); }}>백업하러 가기</Btn></div>}
      {off.updateReady && !busy && (
        <div className="banner info" role="status">✨ 새 버전이 준비됐어요. 학습 기록은 그대로 남아요.
          <Btn kind="gold" onClick={applyUpdate}>지금 적용</Btn>
        </div>
      )}
      {screen}
    </div>
  );
}
