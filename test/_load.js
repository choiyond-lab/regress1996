// 테스트 공용: index.html 의 스크립트를 브라우저 없이 새 컨텍스트에서 돌린다
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function mkEl() {
  return { innerHTML: '', textContent: '', hidden: false, scrollTop: 0, dataset: {}, style: {}, querySelector() { return null; }, addEventListener() {} };
}
// 게임 스크립트 뒤에 테스트 코드를 붙여 한 번에 실행한다 (let/const 전역을 그대로 쓰기 위해)
function run(testCode, extra) {
  const els = {};
  const store = {};
  const ctx = Object.assign({
    window: { __TEST__: true },
    document: { getElementById: id => els[id] || (els[id] = mkEl()), querySelector: () => null, documentElement: { dataset: {} }, addEventListener() {} },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    setTimeout: () => 0, clearTimeout() {}, clearInterval() {}, console, els, ROOT: path.join(__dirname, '..'), fs, path,
  }, extra || {});
  vm.createContext(ctx);
  vm.runInContext(scripts + '\n;' + testCode, ctx, { filename: 'game+test.js' });
  return ctx;
}
// 이야기를 끝까지 넘긴다. pick(choices) 가 고를 번호를 돌려준다 (없으면 고를 수 있는 첫 번째)
const STORY_HELPERS = `
function playStory(pick, limit) {
  let n = 0;
  storyStart();
  while (RUN && n++ < (limit || 2000)) {
    if (RUN.cur && RUN.cur.c) {
      const ok = RUN.cur.c.map((c, i) => [c, i]).filter(([c]) => !choiceNeed(c)).map(([, i]) => i);
      const k = pick ? pick(RUN.cur.c, ok) : ok[0];
      if (!storyChoose(k == null ? ok[0] : k)) throw new Error('선택 실패: ' + RUN.key);
    } else storyAdvance();
  }
  if (RUN) throw new Error('이야기가 끝나지 않음: ' + RUN.key);
}
`;
module.exports = { run, STORY_HELPERS, scripts };
