import { describe, it, expect } from 'vitest';
import { ITEMS, ITEM_BY_ID, WORD_DATA } from '../../src/core/data';

describe('단어 데이터', () => {
  it('500항목, Chapter 1~25 각 20개, 번호 1~20 누락·중복 없음', () => {
    expect(ITEMS.length).toBe(500); expect(WORD_DATA.itemCount).toBe(500);
    for (let ch = 1; ch <= 25; ch++) {
      const nums = ITEMS.filter((i) => i.chapter === ch).map((i) => i.number).sort((a, b) => a - b);
      expect(nums).toEqual(Array.from({ length: 20 }, (_, k) => k + 1));
    }
  });
  it('안정적인 ID와 중복 영어 보존', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(500);
    expect(ITEM_BY_ID['ch06-07'].englishAnswer).toBe('disable');
    expect(ITEM_BY_ID['ch17-18'].englishAnswer).toBe('disable');
    expect(ITEM_BY_ID['ch06-07'].koreanAnswer).not.toBe(ITEM_BY_ID['ch17-18'].koreanAnswer);
    expect(ITEM_BY_ID['ch10-12'].englishAnswer).toBe('have');
    expect(ITEM_BY_ID['ch24-02'].englishAnswer).toBe('have');
  });
  it('C·D·E열 매핑', () => {
    const t = ITEM_BY_ID['ch18-08'];
    expect([t.englishDisplay, t.englishAnswer, t.koreanAnswer]).toEqual(['take(took) a walk', 'take a walk', '산책하다']);
    expect(ITEM_BY_ID['ch06-07'].englishDisplay).toBe('disable(-d)');
    expect(ITEM_BY_ID['ch06-07'].koreanAnswer).toBe('장애가 있는');
    expect(ITEM_BY_ID['ch12-04'].koreanAnswer).toBe('비밀로 하다');
    expect(ITEM_BY_ID['ch22-03'].englishAnswer).toBe('write neatly');
    expect(ITEM_BY_ID['ch24-02'].koreanAnswer).toBe('가지다, 먹다');
  });
  it('괄호·쉼표·슬래시·하이픈·공백 보존', () => {
    expect(ITEM_BY_ID['ch08-03'].englishAnswer).toBe('am/are/is');
    expect(ITEM_BY_ID['ch08-03'].koreanAnswer).toBe('이다, 있다, 되다');
    expect(ITEM_BY_ID['ch21-04'].englishAnswer).toBe('good-looking');
    expect(ITEM_BY_ID['ch06-18'].koreanAnswer).toBe('퍽(아이스하키에서 공처럼 치는 고무 원반)');
    expect(ITEM_BY_ID['ch08-18'].englishAnswer).toBe('hang out with friends');
    expect(ITEM_BY_ID['ch01-18'].koreanAnswer).toBe('(~한 상태로) 변하다, 되다');
    expect(ITEM_BY_ID['ch16-08'].koreanAnswer).toBe('-판, 버전, 설명');
    for (const i of ITEMS) { expect(i.grading.en).toBe(i.englishAnswer.normalize('NFC').trim()); expect(i.grading.ko).toBe(i.koreanAnswer.normalize('NFC').trim()); }
  });
});
