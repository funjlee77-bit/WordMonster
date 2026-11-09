// 엑셀(data-source/도윤_영단어_GRADE5.xlsx) → src/data/words.json 변환 + 검사
// 사용: npm run convert   (검사만: npm run check-data)
import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = 'data-source';
const OUT = 'src/data/words.json';
const REPORT = 'data-source/검사결과.txt';
const checkOnly = process.argv.includes('--check');

const file = readdirSync(SRC_DIR).find((f) => f.endsWith('.xlsx'));
if (!file) { console.error('data-source 폴더에 .xlsx 파일이 없습니다.'); process.exit(1); }
const path = join(SRC_DIR, file);
const buf = readFileSync(path);
const sha256 = createHash('sha256').update(buf).digest('hex');

const wb = new ExcelJS.Workbook();
await wb.xlsx.load(buf);
const ws = wb.getWorksheet('단어목록');
const errors = [];
if (!ws) { console.error('"단어목록" 시트가 없습니다.'); process.exit(1); }

const expectedHeader = ['과', '번호', '영어(교재 표기)', '뜻', '철자 정답(괄호 제외)', '대조 확인', '메모'];
const header = expectedHeader.map((_, i) => cellText(ws.getRow(1).getCell(i + 1).value));
expectedHeader.forEach((h, i) => { if (header[i] !== h) errors.push(`헤더 ${i + 1}열: "${header[i]}" (예상 "${h}")`); });

function cellText(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if ('richText' in v) return v.richText.map((t) => t.text).join('');
    if ('result' in v) return String(v.result ?? '');
    if ('text' in v) return String(v.text);
  }
  return String(v);
}

const items = [];
for (let r = 2; r <= ws.rowCount; r++) {
  const row = ws.getRow(r);
  const vals = [1, 2, 3, 4, 5, 6, 7].map((c) => cellText(row.getCell(c).value));
  if (vals.every((v) => v.trim() === '')) continue;
  const [chS, noS, C, D, E, F, G] = vals;
  const chapter = Number(chS), number = Number(noS);
  if (!Number.isInteger(chapter) || !Number.isInteger(number)) { errors.push(`${r}행: 과/번호가 숫자가 아님 (${chS}, ${noS})`); continue; }
  for (const [name, v] of [['C(영어)', C], ['D(뜻)', D], ['E(철자 정답)', E]]) if (v.trim() === '') errors.push(`${r}행 ${name} 비어 있음`);
  const id = `ch${String(chapter).padStart(2, '0')}-${String(number).padStart(2, '0')}`;
  items.push({
    id, chapter, number,
    englishDisplay: C, koreanAnswer: D, englishAnswer: E,
    sourceCheck: F, note: G,
    // 채점용 정규화 결과(원문과 별도 보관): NFC + 앞뒤 공백 제거만
    grading: { en: E.normalize('NFC').trim(), ko: D.normalize('NFC').trim() },
    sourceRow: r,
  });
}

// 검사
if (items.length !== 500) errors.push(`총 항목 ${items.length}개 (예상 500)`);
for (let ch = 1; ch <= 25; ch++) {
  const nums = items.filter((i) => i.chapter === ch).map((i) => i.number);
  if (nums.length !== 20) errors.push(`Chapter ${ch}: ${nums.length}개 (예상 20)`);
  for (let n = 1; n <= 20; n++) {
    const c = nums.filter((x) => x === n).length;
    if (c === 0) errors.push(`Chapter ${ch} ${n}번 누락`);
    if (c > 1) errors.push(`Chapter ${ch} ${n}번 중복 ${c}개`);
  }
}
const extra = items.filter((i) => i.chapter < 1 || i.chapter > 25 || i.number < 1 || i.number > 20);
extra.forEach((i) => errors.push(`범위 밖 항목: ${i.id} (${i.sourceRow}행)`));
const ids = new Set(); items.forEach((i) => { if (ids.has(i.id)) errors.push(`ID 중복 ${i.id}`); ids.add(i.id); });

const differ = items.filter((i) => i.englishDisplay !== i.englishAnswer);
const enDup = {}; items.forEach((i) => (enDup[i.grading.en] ??= []).push(i.id));
const koDup = {}; items.forEach((i) => (koDup[i.grading.ko] ??= []).push(i.id));
const fmt = (o) => Object.entries(o).filter(([, v]) => v.length > 1).map(([k, v]) => `  ${k}: ${v.join(', ')}`).join('\n');

const report = [
  `검사 시각: ${new Date().toISOString()}`,
  `원본 파일: ${file}`, `SHA-256: ${sha256}`,
  `총 항목: ${items.length}`,
  `Chapter별 항목 수: ${Array.from({ length: 25 }, (_, k) => `${k + 1}:${items.filter((i) => i.chapter === k + 1).length}`).join(' ')}`,
  `C열과 E열이 다른 항목: ${differ.length}개`,
  ...differ.map((i) => `  ${i.id}  C="${i.englishDisplay}"  E="${i.englishAnswer}"`),
  `F열(대조 확인) 값이 있는 항목: ${items.filter((i) => i.sourceCheck.trim()).length}개`,
  `G열(메모) 값이 있는 항목: ${items.filter((i) => i.note.trim()).length}개`,
  `같은 영어 정답이 여러 Chapter에 있음(합치지 않고 따로 보존):`, fmt(enDup) || '  없음',
  `같은 뜻이 여러 항목에 있음(출제 시 Chapter·번호 표시):`, fmt(koDup) || '  없음',
  `오류: ${errors.length ? '\n  ' + errors.join('\n  ') : '없음'}`,
].join('\n');
writeFileSync(REPORT, report + '\n');
console.log(report);
if (errors.length) { console.error('\n검사 실패: JSON을 만들지 않았습니다.'); process.exit(1); }
if (!checkOnly) {
  const out = { dataVersion: 1, textbook: 'GRADE 5 Key Words (1~25과)', sourceFile: file, sourceSha256: sha256, itemCount: items.length,
    items: items.map(({ sourceRow, ...rest }) => rest) };
  writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
  console.log(`\n${OUT} 저장 완료`);
}
