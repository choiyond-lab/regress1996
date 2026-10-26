// 회귀자의 선택 1996 — 빌드 스크립트
// src/ 의 조각들을 하나의 index.html 로 합친다. 실행: node build.js
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'index.html');

// 실행 순서가 중요하다. 데이터 → 엔진 → 이야기 → 그림 → 화면 → 시작
const DATA = ['market-data.js', 'tickers.js', 'data.js', 'characters.js'];
const LOGIC = ['engine.js', 'story.js', 'art.js', 'ui.js', 'boot.js'];

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
// 노드용 module.exports 줄은 브라우저에 넣지 않는다
const strip = s => s.replace(/^if \(typeof module !== 'undefined'\).*$/gm, '');

// 부동산 매물 이미지: assets/estate/<매물 id>.png(.jpg·.webp) 가 있으면 그것을, 없으면 기본 이미지를 쓴다
const EST_DIR = path.join(__dirname, 'assets', 'estate');
const estateImgs = fs.existsSync(EST_DIR) ? fs.readdirSync(EST_DIR).filter(f => /^[a-z0-9_]+\.(png|jpg|jpeg|webp)$/i.test(f)) : [];

const html =
  read('shell.html') + '\n' +
  '<script id="game-data">\n' + DATA.map(f => strip(read(f))).join('\n') + '\nconst ESTATE_IMGS = ' + JSON.stringify(estateImgs) + ';\n</script>\n' +
  '<script>\n' + LOGIC.map(read).join('\n') + '\n</script>\n</body>\n</html>\n';

fs.writeFileSync(OUT, html, 'utf8');

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
try {
  new Function(scripts);
  console.log(`빌드 완료 — index.html (${html.length.toLocaleString()} bytes) · 문법 이상 없음`);
} catch (e) {
  console.error('문법 오류:', e.message);
  process.exit(1);
}
