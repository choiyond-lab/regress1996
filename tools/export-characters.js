// src/characters.js → docs/인물표.md . 실행: node tools/export-characters.js
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'characters.js'), 'utf8');
const { CHARS, REL_LINKS } = new Function(src + ';return { CHARS, REL_LINKS }')();
const KIND = { family: '가족', friend: '친구', romance: '연애 가능', mentor: '어른', rival: '경계' };
const meet = c => c.meet === 'start' ? '처음부터' : c.meet === 'event' ? '이야기 사건' : c.meet.ym;
const cell = s => String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ');

const out = ['# 인물표', '', '`src/characters.js` 에서 자동 생성. 직접 고치지 않는다.', '',
  '| 이름 | 성별 | 출생 | 구분 | 관계 | 특징 | 만남 | 일러스트 | 좋아하는 것 |', '|---|---|---|---|---|---|---|---|---|'];
for (const c of CHARS) out.push(`| ${c.name} | ${c.gender} | ${c.born} | ${KIND[c.kind]} | ${c.role} | ${c.feature} | ${meet(c)} | ${c.asset}${c.adultAt ? ` (${c.adultAt}살부터)` : ''} | ${c.likes.join(', ')} |`);
out.push('', '## 인물끼리의 관계', '', '| 인물 | 인물 | 관계 | 악연 |', '|---|---|---|---|');
const nm = id => CHARS.find(c => c.id === id).name;
for (const l of REL_LINKS) out.push(`| ${nm(l.a)} | ${nm(l.b)} | ${l.t} | ${l.bad ? '예' : ''} |`);
out.push('');
for (const c of CHARS) {
  out.push(`## ${c.name} — ${c.role}`, '', `- **대사 스타일** ${cell(c.voice)}`, `- **전생의 기억** ${cell(c.past)}`);
  for (const e of c.ev) out.push(`- **이벤트 「${e.t}」** 조건 ${JSON.stringify(e.c)}`);
  out.push('');
}
fs.mkdirSync(path.join(__dirname, '..', 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'docs', '인물표.md'), out.join('\n'), 'utf8');
console.log(`인물 ${CHARS.length}명 → docs/인물표.md`);
