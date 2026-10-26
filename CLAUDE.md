# 작업 규칙

게임 「회귀자의 선택 1996」 프로젝트다. 상위 폴더의 2017년 스튜디오 경영 버전과는 별개로 관리한다. 자세한 설명은 `README.md` 에 있다.

## 반드시 지킬 것

- **`index.html` 을 직접 고치지 않는다.** 빌드 결과물이다. `src/` 를 고치고 `node build.js` 를 실행한다.
- **`src/market-data.js` 를 직접 고치지 않는다.** `node tools/fetch-market.js` 로 다시 받는다. 종목을 바꾸려면 `src/tickers.js` 를 고친다.
- **인물 관련 내용은 `src/characters.js` 한 곳만 고친다.** 고친 뒤 `node tools/export-characters.js` 로 `docs/인물표.md` 를 갱신하고, 새 일러스트를 썼으면 `node tools/prep-portraits.js` 를 실행한다.
- **소스를 고쳤으면 테스트를 돌린다.** `node test/bughunt.js` 가 기본이고, 시간 흐름·정산·밸런스를 바꿨으면 `node test/smoke.js` 도 돌린다.

## 자주 쓰는 명령

```bash
node build.js
```

```bash
node test/bughunt.js
```

```bash
node tools/serve.js
```

## 구조 요약

`src/` 의 파일이 순서대로 이어 붙어 하나의 HTML 이 된다. 순서는 `build.js` 의 `DATA`, `LOGIC` 배열에 있다. 모든 코드는 전역 상태 객체 `S` 하나를 읽고 쓰며, 화면은 `render()` 한 번으로 다시 그린다. 이벤트 진행 상태는 `RUN`, 화면 전용 상태는 `UI` 에 있다.

- 밸런스 수치·장비·스포츠 문항: `src/data.js`
- 종목 목록: `src/tickers.js` · 실제 시세: `src/market-data.js` (자동 생성)
- 인물 15명과 인물끼리의 관계: `src/characters.js` · 이야기 사건: `src/story.js`
- 시간은 한 달 단위다. 행동은 시간을 쓰지 않고, `nextMonth()` 만 달을 넘긴다.

## 문체

주석, 커밋 메시지, 게임 내 문구는 모두 한국어로 쓴다. 게임 안 설명과 나레이션은 존댓말 설명체, 주인공 속마음은 반말 혼잣말, 인물 대사는 `src/characters.js` 의 `voice` 를 따른다.
