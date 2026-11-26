import { describe, it, expect } from 'vitest';
import { ITEMS, ITEM_BY_ID } from '../../src/core/data';
import { gradeListen, applyListen, listenPending, planListen, HOMOPHONES, listenForm } from '../../src/core/listen';
import { spokenText } from '../../src/speech';
import { DEFAULT_GAME } from '../../src/core/types';

const find = (en: string) => ITEMS.find((i) => i.grading.en === en)!;

describe('듣고 쓰기 채점', () => {
  it('철자가 같으면 정답, 한 글자라도 다르면 오답', () => {
    const it_ = find('engineer');
    expect(gradeListen('engineer', it_, {}).kind).toBe('strict');
    expect(gradeListen('enginer', it_, {}).kind).toBe('wrong');
    expect(gradeListen('', it_, {}).kind).toBe('wrong');
  });
  it('숙어는 띄어쓰기까지 맞아야 정답', () => {
    const it_ = find('take a walk');
    expect(gradeListen('take a walk', it_, {}).kind).toBe('strict');
    expect(gradeListen('takeawalk', it_, {}).kind).toBe('wrong');
    expect(gradeListen('take(took) a walk', it_, {}).kind).toBe('wrong');
  });
  it('대문자는 소리로 안 들리니 소문자도 정답(case 알림)', () => {
    const it_ = find('Wednesday');
    expect(gradeListen('Wednesday', it_, {}).kind).toBe('strict');
    expect(gradeListen('wednesday', it_, {}).kind).toBe('case');
    expect(gradeListen('wensday', it_, {}).kind).toBe('wrong');
  });
  it('am/are/is는 슬래시·쉼표·띄어쓰기 모두 정답', () => {
    const it_ = find('am/are/is');
    for (const s of ['am/are/is', 'am are is', 'am, are, is', 'am / are / is']) expect(gradeListen(s, it_, {}).kind).toBe('strict');
    expect(gradeListen('am is are', it_, {}).kind).toBe('wrong');
  });
  it('하이픈은 철자의 일부', () => {
    const it_ = find('good-looking');
    expect(gradeListen('good-looking', it_, {}).kind).toBe('strict');
    expect(gradeListen('good looking', it_, {}).kind).toBe('wrong');
  });
  it('소리가 같은 다른 단어는 오답이 아니라 다시 쓰기(homophone)', () => {
    expect(gradeListen('sea', find('see'), {})).toMatchObject({ kind: 'homophone', homophone: 'sea' });
    expect(gradeListen('mail', find('male'), {}).kind).toBe('homophone');
    expect(gradeListen('hole', find('whole'), {}).kind).toBe('homophone');
  });
  it('같은 소리 목록의 교재 단어는 모두 600단어 안에 있고, 그 짝 단어는 교재에 없음', () => {
    const set = new Set(ITEMS.map((i) => listenForm(i.grading.en)));
    for (const [w, hs] of Object.entries(HOMOPHONES)) { expect(set.has(w)).toBe(true); hs.forEach((h) => expect(set.has(h)).toBe(false)); }
  });
  it('부모가 등록한 대체 정답도 인정', () => {
    const it_ = find('engineer');
    expect(gradeListen('enginear', it_, { [it_.id]: { en: { alternates: ['enginear'], updatedAt: 'x' } } }).kind).toBe('strict');
  });
});

describe('듣고 쓰기 기록·출제', () => {
  it('틀리면 오답 표시, 맞히면 해제', () => {
    const a = applyListen(undefined, false, 't1');
    expect(a).toMatchObject({ ok: 0, ng: 1, pending: true });
    const b = applyListen(a, true, 't2');
    expect(b).toMatchObject({ ok: 1, ng: 1, pending: false });
  });
  it('범위 안 듣기 오답만 찾음', () => {
    const scope = ITEMS.filter((i) => i.chapter === 1);
    const g = { ...DEFAULT_GAME, listen: { 'ch01-01': applyListen(undefined, false, 'x'), 'ch02-01': applyListen(undefined, false, 'x') } };
    expect(listenPending(g, scope)).toEqual(['ch01-01']);
  });
  it('무작위 순서, 중복 없음, 범위보다 많이 달라면 범위 전체', () => {
    const scope = ITEMS.filter((i) => i.chapter <= 5);
    const a = planListen(scope, 50, () => 0.3), b = planListen(scope, 50);
    expect(a).toHaveLength(50); expect(new Set(a).size).toBe(50);
    expect(a.every((id) => ITEM_BY_ID[id].chapter <= 5)).toBe(true);
    expect(a.join() === scope.slice(0, 50).map((i) => i.id).join()).toBe(false);
    expect(b).toHaveLength(50);
    expect(planListen(scope, 999)).toHaveLength(100);
  });
  it('읽을 글: 슬래시는 쉼표로 끊어 읽기', () => {
    expect(spokenText('am/are/is')).toBe('am, are, is');
    expect(spokenText('take a walk')).toBe('take a walk');
  });
});
