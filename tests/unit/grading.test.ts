import { describe, it, expect } from 'vitest';
import { gradeItem, STRICT, findSiblingMatch, diffChars } from '../../src/core/grading';
import { ITEM_BY_ID, itemsInChapters } from '../../src/core/data';
import type { Overrides } from '../../src/core/types';
const I = ITEM_BY_ID; const none: Overrides = {};
const g = (inp: string, id: string, dir: 'en' | 'ko', o = STRICT, ov = none) => gradeItem(inp, I[id], dir, ov, o).kind;

describe('엄격 채점', () => {
  it('여러 뜻은 전체·순서까지 일치해야 정답', () => {
    expect(g('이동하다, 여행하다', 'ch01-14', 'ko')).toBe('strict');
    expect(g('여행하다', 'ch01-14', 'ko')).toBe('wrong');
    expect(g('여행하다, 이동하다', 'ch01-14', 'ko')).toBe('wrong');
  });
  it('뜻 쓰기는 부호·띄어쓰기만 무시 (순서·글자는 그대로)', () => {
    expect(g('이동하다,여행하다', 'ch01-14', 'ko')).toBe('strict');
    expect(g('이동하다 여행하다', 'ch01-14', 'ko')).toBe('strict');
    expect(g('이동하다여행하다', 'ch01-14', 'ko')).toBe('strict');
    expect(g('여행하다 이동하다', 'ch01-14', 'ko')).toBe('wrong');
    expect(g('한상태로변하다/되다', 'ch01-18', 'ko')).toBe('strict');
    expect(g('한 상태로 변하다 되다', 'ch01-18', 'ko')).toBe('strict');
    expect(g('변하다, 되다', 'ch01-18', 'ko')).toBe('wrong');
    expect(g('퍽 아이스하키에서 공처럼 치는 고무 원반', 'ch06-18', 'ko')).toBe('strict');
    expect(g('판 버전 설명', 'ch16-08', 'ko')).toBe('strict');
    expect(g('목표로 하다', 'ch23-06', 'ko')).toBe('strict');
    expect(g('목표', 'ch23-06', 'ko')).toBe('wrong');
    expect(g('100 백', 'ch12-13', 'ko')).toBe('strict');
    expect(g('...', 'ch12-13', 'ko')).toBe('wrong');
  });
  it('영어 쓰기는 여전히 엄격 (부호·띄어쓰기 구분)', () => {
    expect(g('good looking', 'ch21-04', 'en')).toBe('wrong');
    expect(g('am are is', 'ch08-03', 'en')).toBe('wrong');
    expect(g('takea walk', 'ch18-08', 'en')).toBe('wrong');
  });
  it('동의어 불인정, 교재 뜻 그대로', () => {
    expect(g('비밀로 하다', 'ch12-04', 'ko')).toBe('strict');
    expect(g('숨기다', 'ch12-04', 'ko')).toBe('wrong');
  });
  it('영어는 C열이 아닌 E열로 채점', () => {
    expect(g('take a walk', 'ch18-08', 'en')).toBe('strict');
    expect(g('take(took) a walk', 'ch18-08', 'en')).toBe('wrong');
    expect(g('took a walk', 'ch18-08', 'en')).toBe('wrong');
    expect(g('disable', 'ch06-07', 'en')).toBe('strict');
    expect(g('disabled', 'ch06-07', 'en')).toBe('wrong');
    expect(g('am/are/is', 'ch08-03', 'en')).toBe('strict');
    expect(g('am', 'ch08-03', 'en')).toBe('wrong');
  });
  it('NFC 정규화와 앞뒤 공백만 제거', () => {
    expect(g('  engineer  ', 'ch01-01', 'en')).toBe('strict');
    expect(g('산책하다'.normalize('NFD'), 'ch18-08', 'ko')).toBe('strict');
    expect(g('take  a walk', 'ch18-08', 'en')).toBe('wrong');
    expect(g('Engineer', 'ch01-01', 'en')).toBe('wrong');
    expect(g('goodlooking', 'ch21-04', 'en')).toBe('wrong');
    expect(g('Europe', 'ch20-18', 'en')).toBe('strict');
    expect(g('europe', 'ch20-18', 'en')).toBe('wrong');
  });
  it('완화 설정: 대소문자·공백·문장부호, 그리고 완화 정답은 relaxed로 구분', () => {
    const relaxed = { caseSensitive: false, spaceSensitive: false, punctSensitive: false };
    expect(g('europe', 'ch20-18', 'en', { ...STRICT, caseSensitive: false })).toBe('relaxed');
    expect(g('takea walk', 'ch18-08', 'en', { ...STRICT, spaceSensitive: false })).toBe('relaxed');
    expect(g('이동하다,여행하다', 'ch01-14', 'ko', relaxed)).toBe('strict');
    expect(g('여행하다, 이동하다', 'ch01-14', 'ko', relaxed)).toBe('wrong'); // 순서는 완화되지 않음
    expect(g('숨기다', 'ch12-04', 'ko', relaxed)).toBe('wrong');
    expect(g('Europe', 'ch20-18', 'en', relaxed)).toBe('strict');
  });
  it('부모가 등록한 대체 정답은 별도 저장되어 인정', () => {
    const ov: Overrides = { 'ch12-04': { ko: { alternates: ['숨기다'], updatedAt: '' } } };
    expect(g('숨기다', 'ch12-04', 'ko', STRICT, ov)).toBe('strict');
    expect(I['ch12-04'].koreanAnswer).toBe('비밀로 하다');
  });
  it('같은 뜻의 다른 항목 영어는 인정하지 않고 찾아서 알려줌', () => {
    const scope = itemsInChapters([1, 3]);
    expect(g('journalist', 'ch01-11', 'en')).toBe('wrong');
    expect(findSiblingMatch('journalist', I['ch01-11'], 'en', scope, none, STRICT)?.id).toBe('ch03-06');
    expect(findSiblingMatch('jornalist', I['ch01-11'], 'en', scope, none, STRICT)).toBeNull();
    const s2 = itemsInChapters([6, 17]);
    expect(findSiblingMatch('불구가 된', I['ch06-07'], 'ko', s2, none, STRICT)?.id).toBe('ch17-18');
  });
  it('다른 부분 표시', () => {
    const d = diffChars('take walk', 'take a walk');
    expect(d.answer.filter((s) => s.kind === 'missing').map((s) => s.text).join('')).toBe('a ');
    expect(d.changed).toBe(2);
  });
});
