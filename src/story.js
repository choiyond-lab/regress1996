// ===== 이야기 사건과 진행기 =====
// at: '년-월' 그달이 시작될 때 일어난다 · when: 추가 조건 (없으면 무조건)
// cond: 날짜 없이 조건이 맞는 첫 달에 한 번 일어난다 (매력·인기로 열리는 인연)
// 대사 형식은 characters.js 머리말과 같다. 그 밖에 {art:'scene:이름'|'char:id'} {meet:id} {fx:효과} {if:함수, then:[], else:[]} {dyn:함수} 를 쓴다
const aff = id => (S.people[id] ? S.people[id].aff : 0);

const STORY = {
  prologue: { title: '회귀', at: '1996-01', art: 'scene:night2026', lines: [
    { n: '2026년 10월, 서울. 새벽 두 시.' },
    { n: '식탁 위에 봉투 하나가 놓여 있습니다. 「유전자 검사 결과 통보서」.' },
    { s: 'me', t: '친자 관계… 불성립.' },
    { n: '열한 살 아들. 결혼 12년. 아내 지수의 휴대폰에는 「현우 선배」와 나눈 메시지가 몇 년 치 쌓여 있었습니다.' },
    { s: 'me', t: '회사에서 제일 믿었던 선배였다. 아이 돌잔치 사회까지 봐 준 사람.' },
    { n: '마흔한 살. 대출 낀 아파트 한 채와 마이너스 통장. 손에 남은 것은 그것뿐이었습니다.' },
    { s: 'me', t: '…한 번만. 딱 한 번만 다시 할 수 있다면.' },
    { art: 'scene:memory' },
    { n: '눈앞이 하얗게 번집니다.' },
    { art: 'scene:room1996' },
    { n: '"준호야! 일어나! 방학이라고 늦잠 자면 못 써. 밥 먹어!"' },
    { s: 'me', t: '…엄마 목소리?' },
    { n: '벽에 걸린 달력에는 「1996년 1월」이라고 적혀 있습니다. 거울 속에는 열한 살 꼬마가 서 있습니다.' },
    { s: 'me', t: '30년 전이다. IMF는 내년 겨울에 오고, 비트코인은 세상에 없고, 삼성전자는 아직 주식 한 장에 20만원대다.' },
    { s: 'me', t: '이번엔 다르게 산다. 돈도, 사람도.' },
    { n: '큰 흐름은 기억나지만 숫자처럼 세밀한 것은 흐릿합니다. 💎 보석을 쓰면 다음 달 시세부터 한 달씩 또렷하게 떠올릴 수 있습니다. 멀리 볼수록 보석이 더 듭니다.' },
    { n: '한 달 동안 체력이 허락하는 만큼 공부·운동·일을 하고, 아래 「다음 달」 버튼으로 시간을 넘기세요. 운동을 하면 최대 체력이 조금씩 늘어납니다.' },
  ] },

  account: { title: '엄마 명의 계좌', at: '1996-01', art: 'char:mom', lines: [
    { s: 'mom', t: '아침부터 무슨 신문을 그렇게 봐? 애가 별나.' },
    { s: 'me', t: '(열한 살이 주식을 하려면 엄마 계좌가 필요하다.)' },
    { c: [
      { t: '"엄마, 제 저금통 돈으로 주식 사 주세요"', fx: { aff: { mom: 2 }, flag: 'account' }, go: [{ s: 'mom', t: '얘가 무슨 소리야? …하긴 은행에 넣어 봐야 이자 몇 푼이니. 엄마 이름으로 계좌 하나 만들어 줄게. 대신 엄마가 다 본다?' }] },
      { t: '"신문에서 봤는데, 주식이 은행 이자보다 낫대요"', fx: { aff: { mom: 4 }, int: 1, flag: 'account' }, go: [{ s: 'mom', t: '신문을 진짜 읽는 거야? 아이고… 알았어. 동네 증권사에 같이 가 보자.' }] },
    ] },
    { art: 'scene:bank' },
    { n: '동네 증권사 객장. 초록색 숫자가 흐르는 전광판 앞에 어른들이 앉아 있습니다.' },
    { meet: 'broker' },
    { s: 'broker', t: '아이고, 꼬마 사장님 오셨네! 어머님 명의로 계좌 하나 열어 드릴게요. 이건 비밀인데요, 요즘 반도체가 좋대요.' },
    { n: '증권 계좌가 생겼습니다. 투자 탭에서 주식을 사고팔 수 있습니다. 엄마 명의라서 스무 살 전까지는 엄마와 사이가 중요합니다.' },
  ] },

  school: { title: '새 학기', at: '1996-03', art: 'scene:school', lines: [
    { n: '1996년 3월. 올해부터 「국민학교」가 「초등학교」로 이름을 바꿨습니다. 4학년 새 학기 첫날입니다.' },
    { meet: 'teacher' },
    { s: 'teacher', t: '안녕하세요, 여러분. 선생님도 올해가 처음이에요. 우리 같이 잘해 봐요.' },
    { meet: 'seoyun' },
    { s: 'seoyun', t: '안녕! 나 한서윤. 우리 짝꿍이래. 너 그림 그릴 줄 알아?' },
    { s: 'me', t: '(서윤이다. 6학년 때 전학 가 버린… 그때 아무 말도 못 했었지.)' },
    { meet: 'taeho' },
    { s: 'taeho', t: '야! 너 이준호지? 오락실 갈래? 내가 철권 진짜 잘해.' },
    { s: 'me', t: '(태호. 2022년에 루나로 모든 걸 잃는 녀석이다.)' },
    { n: '인연 탭에서 새로 만난 사람들을 볼 수 있습니다.' },
  ] },

  neighbor: { title: '옆집 누나', at: '1996-04', art: 'scene:street', lines: [
    { n: '옆집에 새로 이사 온 누나가 이삿짐을 나르다 상자를 떨어뜨립니다.' },
    { meet: 'haeun' },
    { s: 'haeun', t: '야, 꼬맹이! 이것 좀 들어 줄래? 누나가 떡볶이 쏠게.' },
    { c: [
      { t: '상자를 같이 든다', fx: { aff: { haeun: 6 }, hp: 0.5 }, go: [{ s: 'haeun', t: '오, 힘 좀 쓰네? 약속은 지킨다. 떡볶이 가자.' }] },
      { t: '"저 꼬맹이 아닌데요"', fx: { aff: { haeun: 3 } }, go: [{ s: 'haeun', t: '푸핫, 말투가 아저씨네.' }] },
    ] },
  ] },

  guarantee: { title: '도장 하나', at: '1997-04', art: 'scene:home', lines: [
    { n: '저녁 식탁. 아빠가 숟가락을 내려놓고 엄마에게 말을 꺼냅니다.' },
    { s: 'dad', t: '고 사장이 공장 넓힌다고 보증 좀 서 달란다. 고향 친구 아이가. 서류에 도장만 찍으면 된다.' },
    { s: 'me', t: '(이거다. 이 도장 하나로 우리 집이 무너졌다.)' },
    { c: [
      { t: '엄마에게 매달려 운다', if: () => aff('mom') >= 50, need: '엄마 호감 50', fx: { aff: { mom: 3 }, flag: 'guaranteeBlocked' }, go: [{ s: 'mom', t: '…애가 이렇게까지 우는 건 처음 봐. 여보, 이번엔 하지 마.' }, { s: 'dad', t: '…알았다. 알았어.' }] },
      { t: '아빠에게 직접 말한다', if: () => aff('dad') >= 45, need: '아빠 호감 45', fx: { aff: { dad: 5 }, flag: 'guaranteeBlocked' }, go: [{ s: 'dad', t: '니가 뭘 안다고… (한참 침묵) …그래, 내도 마음이 안 놓이긴 했다.' }] },
      { t: '연쇄 부도 기사를 보여 준다', if: () => stat('int') >= 40, need: '지성 40', fx: { int: 1, aff: { dad: 2 }, flag: 'guaranteeBlocked' }, go: [{ n: '신문을 읽던 아빠가 보증 서류를 다시 봉투에 넣습니다.' }] },
      { t: '아무 말도 하지 못한다', fx: { flag: 'guaranteeSigned' }, go: [{ n: '다음 날, 아빠는 보증 서류에 도장을 찍었습니다.' }] },
    ] },
  ] },

  guaranteeBust: { title: '빚 독촉', at: '1998-02', when: () => S.flags.guaranteeSigned, art: 'scene:home', lines: [
    { n: '고 사장의 공장이 부도났습니다. 고 사장은 연락이 끊겼고, 빚 독촉 전화가 집으로 옵니다.' },
    { s: 'mom', t: '3천만원이래… 집을 내놔야 한대.' },
    { c: [
      { t: '모은 돈으로 빚을 갚는다', fx: { cash: -30000000, aff: { mom: 25, dad: 25 }, flag: 'debtPaid' }, go: [{ s: 'mom', t: '너… 이 돈이 다 어디서…' }, { s: 'dad', t: '…미안타. 아빠가 미안타.' }] },
      { t: '갚을 수 없다', fx: { aff: { dad: -5 }, hp: -3, flag: 'houseLost' }, go: [{ n: '가족은 반지하 단칸방으로 이사했습니다. 전생과 같은 길입니다.' }] },
    ] },
  ] },

  dadRetire: { title: '명예퇴직', at: '1998-03', art: 'char:dad', lines: [
    { n: '아빠 회사가 구조조정을 합니다. 아빠는 명예퇴직 서류에 서명하고 돌아왔습니다.' },
    { s: 'dad', t: '퇴직금이 4천 나왔다. 치킨집을 하든지… 뭐라도 해야지.' },
    { s: 'me', t: '(전생에 그 치킨집은 1년 반 만에 문을 닫았다. 그리고 지금 코스피는 300이다.)' },
    { c: [
      { t: '"그 돈, 저한테 맡겨 주세요"', if: () => aff('dad') >= 55 || aff('mom') >= 70, need: '아빠 호감 55 또는 엄마 호감 70', fx: { cash: 40000000, flag: 'familyFund', aff: { dad: 5 } },
        go: [{ s: 'dad', t: '…니 통장 수익률 엄마한테 들었다. 미친 소리 같지만… 해 봐라. 대신 망하면 우리 집 끝이다.' }, { n: '아빠의 퇴직금 4,000만원을 맡았습니다. 어른이 되면 돌려드려야 합니다.' }] },
      { t: '"은행에 넣어 두세요. 지금 금리가 20%예요"', fx: { aff: { dad: 4, mom: 4 }, flag: 'dadBank' }, go: [{ s: 'dad', t: '20%? …그래, 그게 낫겠다.' }] },
      { t: '말리지 않는다', fx: { flag: 'chicken' }, go: [{ n: '아빠는 동네에 작은 치킨집을 열었습니다.' }] },
    ] },
  ] },

  chickenClose: { title: '치킨집', at: '1999-09', when: () => S.flags.chicken, art: 'char:dad', lines: [
    { n: '아빠의 치킨집이 1년 반 만에 문을 닫습니다. 전생과 같은 날입니다. 가게에는 갚지 못한 외상값이 남았습니다.' },
    { c: [
      { t: '남은 빚을 대신 갚는다', fx: { cash: -10000000, aff: { dad: 18, mom: 10 } }, go: [{ s: 'dad', t: '…아들한테 이런 걸 받다니. 됐다. 고맙다.' }] },
      { t: '아빠 어깨를 두드린다', fx: { aff: { dad: 4 } }, go: [{ s: 'dad', t: '아빠는 괜찮다.' }] },
    ] },
  ] },

  suneung: { title: '수능', at: '2004-11', art: 'scene:school', lines: [
    { n: '2004년 11월. 수능 날 아침, 엄마가 싸 준 도시락이 아직 따뜻합니다.' },
    { dyn: () => {
      const i = stat('int'), g = i >= 85 ? 'S' : i >= 70 ? 'A' : i >= 55 ? 'B' : i >= 40 ? 'C' : 'D';
      const say = { S: '전국 상위 0.1%. 서울대 합격입니다.', A: '연세대·고려대에 합격했습니다.', B: '서울에 있는 대학에 합격했습니다.', C: '지방 국립대에 합격했습니다.', D: '전문대에 합격했습니다.' }[g];
      return [{ fx: { edu: g } }, { n: `지성 ${Math.round(i)}. ${say}` }, { s: 'mom', t: ['S', 'A', 'B'].includes(g) ? '우리 아들! 엄마가 동네 다 자랑할 거야!' : '수고했어. 엄마는 네가 건강하면 돼.' }];
    } },
  ] },

  college: { title: '스무 살', at: '2005-03', art: 'scene:campus', lines: [
    { dyn: () => [{ n: `2005년 3월. ${EDU[S.edu || 'C'].label} 입학식. 스무 살이 되었습니다.` }] },
    { n: '증권 계좌를 내 이름으로 옮겼습니다. 이제 대출을 받고, 집을 내 이름으로 살 수 있습니다.' },
    { meet: 'chaerin' },
    { s: 'chaerin', t: '옆자리 비었나요? 윤채린입니다. 경제학 원론은 출석이 20%라서요.' },
    { s: 'me', t: '(전생엔 말 한 번 못 붙였던 사람이다.)' },
  ] },

  familyRepay: { title: '아빠의 퇴직금', at: '2005-03', when: () => S.flags.familyFund, art: 'char:dad', lines: [
    { s: 'dad', t: '니가 맡아 준 그 돈 말이다… 아빠는 잊어버렸다. 니 써라.' },
    { c: [
      { t: '두 배로 돌려드린다 (8,000만원)', fx: { cash: -80000000, aff: { dad: 20, mom: 15 } }, go: [{ s: 'dad', t: '…이게 뭐꼬. 됐다, 됐어.' }, { n: '아빠가 고개를 돌립니다. 어깨가 떨립니다.' }] },
      { t: '원금을 돌려드린다 (4,000만원)', fx: { cash: -40000000, aff: { dad: 6 } }, go: [{ s: 'dad', t: '그래. 잘 썼네.' }] },
      { t: '"감사히 쓸게요"', fx: { aff: { dad: -8, mom: -5 } }, go: [{ s: 'mom', t: '…그래, 네 돈이지 뭐.' }] },
    ] },
  ] },

  bitcoinMeet: { title: '1비트코인 = 70원', at: '2010-07', art: 'scene:cafe', lines: [
    { n: '해외 개발자 게시판에 「비트코인」 글을 올린 한국인이 있습니다. 메일을 보냈더니 바로 만나자는 답이 왔습니다.' },
    { meet: 'doyun' },
    { s: 'doyun', t: '이건 혁명이에요. 지금 1비트코인에 100원도 안 해요. 피자 두 판을 1만 비트코인에 산 사람도 있다니까요.' },
    { s: 'me', t: '(11년 뒤 1비트코인은 8,000만원을 넘는다.)' },
    { n: '코인 거래가 열렸습니다. 투자 → 주식 → 코인 탭에서 사고팔 수 있습니다.' },
  ] },

  job: { title: '합격 통지', at: '2011-01', art: 'scene:office', lines: [
    { n: '2011년 1월. 전생에 다녔던 회사에서 합격 통지가 왔습니다.' },
    { s: 'me', t: '(이 회사에서 현우 선배를 만났고, 그 선배 소개로 지수를 만났다.)' },
    { c: [
      { t: '입사한다', fx: { job: 'office', meet: ['hyunwoo', 'minji'] }, go: [
        { s: 'hyunwoo', t: '에이, 신입! 반가워요. 모르는 거 있으면 다 나한테 물어봐요.' },
        { s: 'me', t: '(보조개가 들어가는 웃음. 그대로다.)' },
        { s: 'minji', t: '입사 동기 서민지예요. 3년 안에 팀장 달 거예요. 잘 부탁해요.' },
        { n: '이제 「일」을 하면 회사 급여를 받습니다. 한 번에 주급만큼, 한 달에 네 번까지입니다.' }] },
      { t: '전업 투자자의 길을 간다', fx: { job: 'investor', fame: 3 }, go: [{ n: '합격 통지서를 서랍에 넣었습니다. 이번 생의 직장은 시장입니다.' }, { n: '이제 「일」은 돈 대신 지성을 조금 올려 줍니다.' }] },
    ] },
  ] },

  meetJisu: { title: '강남역 카페', at: '2013-04', art: 'scene:cafe', lines: [
    { dyn: () => [{ n: `2013년 봄. ${S.job === 'office' ? '현우 선배' : '태호'}가 소개팅을 주선했습니다. 약속 장소는 강남역 카페. 전생과 같은 날, 같은 자리입니다.` }] },
    { s: 'me', t: '(창가 자리. 고양이 같은 눈매. 지수다.)' },
    { c: [
      { t: '자리에 앉는다', fx: { meet: 'jisu', flag: 'metJisu' }, go: [{ s: 'jisu', t: '안녕하세요, 강지수예요. 좋은 분이라고 들었어요.' }, { s: 'me', t: '(이 사람은 아직 아무것도 하지 않았다.)' }] },
      { t: '카페 앞에서 돌아선다', fx: { flag: ['avoidJisu', 'jisuClosed'] }, go: [{ n: '유리창 너머 지수의 옆모습을 한 번 보고, 당신은 돌아섰습니다.' }, { s: 'me', t: '(이번 생에서 우리는 모르는 사람이다.)' }] },
    ] },
  ] },

  blindDate: { title: '소개팅', cond: () => age() >= 24 && cha() >= 45 && stat('fame') >= 25, art: 'scene:cafe', lines: [
    { n: '대학 동기에게서 연락이 왔습니다. "너 요즘 인기 많더라. 내 친구가 한번 보고 싶대."' },
    { meet: 'suyeon' },
    { s: 'suyeon', t: '안녕하세요, 공수연이에요. 약사예요. …사진보다 실물이 나으시네요.' },
    { s: 'me', t: '(전생에는 없던 자리다. 매력과 소문이 만든 인연.)' },
    { c: [
      { t: '편하게 이야기를 이끈다', if: () => cha() >= 60, need: '매력 60', fx: { aff: { suyeon: 12 } }, go: [{ s: 'suyeon', t: '…저 원래 이런 자리 어색한데, 오늘은 시간 가는 줄 몰랐어요.' }] },
      { t: '솔직하게 투자 이야기를 한다', fx: { aff: { suyeon: 5 }, int: 1 }, go: [{ s: 'suyeon', t: '음, 그건 좀 생각해 볼게요. 그래도 신기하네요.' }] },
    ] },
  ] },

  snsMeet: { title: 'DM 한 통', cond: () => year() >= 2012 && stat('fame') >= 55 && cha() >= 35, art: 'scene:cafe', lines: [
    { dyn: () => [{ n: `${snsName(curYM())}에 올린 글이 화제가 되자 메시지가 하나 왔습니다. 「같이 콘텐츠 해 보실래요?」` }] },
    { meet: 'gaeun' },
    { s: 'gaeun', t: '안녕하세요! 조가은이에요. 글 보고 완전 반했어요. 이거 콘텐츠 되겠다 싶어서요!' },
    { c: [
      { t: '같이 영상을 찍는다', fx: { aff: { gaeun: 10 }, fame: 6 }, go: [{ s: 'gaeun', t: '와, 카메라 체질이시네요!' }] },
      { t: '커피만 마시고 헤어진다', fx: { aff: { gaeun: 4 } }, go: [{ s: 'gaeun', t: '아쉽다. 다음엔 꼭 찍어요!' }] },
    ] },
  ] },

  hyunwooVisit: { title: '선배의 방문', at: '2016-05', when: () => spouseId() === 'jisu' && S.people.hyunwoo, art: 'char:hyunwoo', lines: [
    { s: 'hyunwoo', t: '에이, 준호 씨. 신혼집 집들이 언제 해요? 제가 와인 한 병 들고 갈게요.' },
    { s: 'me', t: '(전생엔 이날부터였다. 선배가 우리 집에 드나들기 시작한 게.)' },
    { c: [
      { t: '"좋죠, 오세요"', fx: { aff: { hyunwoo: 10 }, flag: 'hwHome' }, go: [{ s: 'hyunwoo', t: '역시 우리 준호 씨!' }] },
      { t: '"집들이는 안 하기로 했어요"', fx: { aff: { hyunwoo: -10 }, flag: 'hwDistance' }, go: [{ s: 'hyunwoo', t: '…그래요? 아쉽네.' }, { n: '현우의 웃음이 잠깐 굳었습니다.' }] },
    ] },
  ] },

  taehoLuna: { title: '인생 한 방', at: '2022-04', when: () => S.people.taeho, art: 'char:taeho', lines: [
    { s: 'taeho', t: '야, 나 루나에 다 넣었다. 대출까지. 이자를 20% 준다니까? 인생 한 방이지!' },
    { c: [
      { t: '"이번 주 안에 전부 빼"', if: () => aff('taeho') >= 55 || S.flags.taehoDotcom, need: '태호 호감 55', fx: { aff: { taeho: 10 }, flag: 'taehoSaved' }, go: [{ s: 'taeho', t: '…너 옛날 새롬기술 때도 그랬지. 알았다. 너 말은 듣는다.' }] },
      { t: '말려 본다', fx: { flag: 'taehoLost' }, go: [{ s: 'taeho', t: '에이, 걱정 마. 이번엔 진짜야.' }] },
    ] },
  ] },
};

// 사건 키 → {title, art, lines}
function resolveEvent(key) {
  const [kind, a, b] = key.split(':');
  if (kind === 'story') { const e = STORY[a]; return e && { title: e.title, art: e.art, lines: e.lines }; }
  if (kind === 'news') {
    const h = HISTORY[+a]; if (!h) return null;
    if (h.memo) return { title: '전생의 기억', art: 'scene:memory', lines: [{ s: 'me', t: h.s }] };
    const lines = [{ n: h.s }];
    if (h.gold) lines.push({ c: [
      { t: '돌반지를 들고 간다', fx: { fame: 3, aff: { mom: 3 } }, go: [{ s: 'mom', t: '우리 아들 기특하네.' }] },
      { t: '지켜만 본다', fx: {} },
    ] });
    return { title: h.t, art: 'scene:news', lines };
  }
  if (kind === 'char') {
    const c = CH[a], e = c && c.ev.find(x => x.id === b);
    return e && { title: e.t, art: 'char:' + a, lines: e.lines };
  }
  if (kind === 'lover') return { title: '고백', art: 'char:' + a, lines: [
    { s: 'me', t: '좋아해. 오래전부터.' },
    { s: a, t: LOVER_LINE[a] || '…나도. 언제 말하나 기다렸어.' },
    { n: `${CH[a].name}와 연인이 되었습니다.` },
  ] };
  if (kind === 'wedding') return { title: '결혼식', art: 'char:' + a, lines: [
    { n: `${year()}년 ${month()}월. 작은 예식장에 가족과 친구들이 모였습니다.` },
    { s: a, t: '앞으로도 잘 부탁해.' },
    { if: () => a === 'jisu', then: [{ s: 'me', t: '(같은 사람과 두 번째 결혼식. 이번에는 끝을 다르게 만든다.)' }], else: [{ s: 'me', t: '(전생에는 없던 결혼식이다.)' }] },
  ] };
  if (kind === 'caught') {   // 양다리가 들켰다
    const ps = partners(); if (ps.length < 2) return null;
    const names = ps.map(id => CH[id].name);
    const who = names.slice(0, -1).map(n => josa(n, '과', '와')).join(' ') + ' ' + josa(names[names.length - 1], '이', '가');
    return { title: '들통', art: 'char:' + ps[0], lines: [
      { n: `${who} 같은 날, 같은 곳에서 마주쳤습니다. 휴대폰 속 메시지까지 모두 드러났습니다.` },
      { s: ps[0], t: '…설명해 봐.' },
      { c: [
        ...ps.map(id => ({ t: `${josa(CH[id].name, '을', '를')} 붙잡는다`, fx: { fn: () => breakOthers(id) }, go: [{ n: `${CH[id].name}만 곁에 남았습니다. 소문이 퍼졌습니다.` }] })),
        { t: '모두에게 무릎 꿇고 사과한다', if: () => cha() >= 70, need: '매력 70', fx: { fn: () => { ps.forEach(id => addAff(id, -25)); scandal(); } }, go: [{ n: '간신히 붙잡았습니다. 하지만 예전 같지는 않습니다.' }] },
      ] },
    ] };
  }
  if (kind === 'sponsor') {   // 인기 70 이상, 해마다 6월
    const amt = won100((stat('fame') - 60) * 1e6 * cpiF());
    return { title: '광고 제안', art: 'scene:office', lines: [
      { n: `${snsName(curYM())}에서 이름이 알려지자 광고 제안이 들어왔습니다. 계약금은 ${fmtWon(amt)}입니다.` },
      { c: [
        { t: '계약한다', fx: { cash: amt, fame: 2 }, go: [{ n: '광고가 나가자 알아보는 사람이 늘었습니다.' }] },
        { t: '거절한다', fx: { int: 1 }, go: [{ s: 'me', t: '(지금은 돈보다 조용히 사는 게 낫다.)' }] },
      ] },
    ] };
  }
  if (kind === 'lotto') {
    const L = S.lottoLast; if (!L || String(L.no) !== a) return null;
    return { title: `로또 ${L.best}등`, art: 'scene:news', lines: [
      { n: `제${L.no}회 로또 당첨 번호 ${L.win.join(', ')}, 보너스 ${L.bonus}.` },
      { n: `${L.best}등 당첨입니다. 당첨금은 ${fmtWon(L.prize[L.best])}, 이번 회차에서 세금을 떼고 모두 ${fmtWon(L.won)}을 받았습니다.` },
      { s: 'me', t: L.best === 1 ? '(전생에 매주 사던 로또였다. 번호를 떠올리는 게 이렇게 쉬웠다니.)' : '(나쁘지 않다. 다음엔 여섯 개 다 떠올려 볼까.)' },
    ] };
  }
  if (kind === 'sport') {   // 그 시절 특별 이벤트: 내기 창 하나 (금액 막대 + 보기). 화면은 ui.js 의 betHTML
    const q = SPORT[a]; if (!q) return null;
    return { title: '그 시절 특별 이벤트 · ' + betKind().label, art: 'scene:stadium', lines: [{ bet: q.id }] };
  }
  if (kind === 'sportres') {
    const q = SPORT[a], b = (S.betsDone || []).find(x => x.id === a); if (!q || !b) return null;
    return { title: '결과 발표 · ' + q.title, art: 'scene:stadium', lines: [
      { n: q.res },
      b.pay ? { n: `${q.opts[b.k][0]}에 건 ${fmtWon(b.stake)}이 맞았습니다. 배당 ${b.odds || q.opts[b.k][1]}배, ${fmtWon(b.pay)}을 받았습니다.` } : { n: `${q.opts[b.k][0]}에 건 ${fmtWon(b.stake)}은 날아갔습니다.` },
      { s: 'me', t: b.pay ? '(기억이 맞았다.)' : '(분명 그랬던 것 같은데… 기억도 가끔 틀린다.)' },
    ] };
  }
  if (kind === 'finale') return { title: '2026년 가을', art: 'scene:night2026', lines: [{ dyn: finaleLines }] };
  return null;
}
const LOVER_LINE = {
  seoyun: '…바보. 4학년 때부터 기다렸는데. 아 잠깐만, 이 얼굴 그리고 싶다.',
  haeun: '꼬맹이가 언제 이렇게 컸냐. …응, 나도.',
  chaerin: '확인했습니다. 저도요. …이건 계산 안 해 봐도 알겠네요.',
  minji: '오, 기한 안에 말했네요. 좋아요.',
  jisu: '그랬구나. …저도 그런 것 같아요.',
};

function finaleLines() {
  const out = [{ n: '2026년 가을. 전생에서 모든 것이 무너졌던 바로 그 계절입니다.' }];
  const sp = spouseId();
  if (sp === 'jisu') {
    if (S.flags.hwHome) out.push({ n: '식탁 위에 봉투가 놓여 있습니다. 같은 봉투, 같은 글씨.' }, { s: 'me', t: '…두 번을 살아도, 같은 사람을 집에 들였구나.' }, { n: '이번에는 통장에 남은 숫자가 다릅니다. 하지만 그것으로 메워지지 않는 자리가 있습니다.' });
    else out.push({ s: 'jisu', t: '여보, 오늘 저녁 뭐 먹을래요?' }, { s: 'me', t: '(봉투는 없다. 이번 생의 지수는 다른 길을 걸었다.)' }, { n: '같은 사람과 다른 결말. 당신은 그것을 지켜 냈습니다.' });
  } else if (sp) out.push({ s: sp, t: '왜 그렇게 봐? 무슨 생각 해?' }, { s: 'me', t: '(전생엔 없던 사람이 내 옆에 있다.)' }, { n: `${CH[sp].name}와 함께 맞는 가을입니다.` });
  else if (S.flags.avoidJisu) out.push({ n: '당신은 그 카페 앞에서 돌아선 뒤로 지수를 다시 만나지 않았습니다.' }, { s: 'me', t: '(혼자지만, 누구에게도 배신당하지 않았다.)' });
  else out.push({ s: 'me', t: '(옆에 누가 없어도, 이번 생은 내가 고른 생이다.)' });
  if (S.flags.guaranteeBlocked || S.flags.debtPaid) out.push({ n: '부모님은 그 보증 사건 없이 늙어 가셨습니다. 엄마의 손목은 멀쩡합니다.' });
  else out.push({ n: '부모님은 그 겨울의 빚을 끝내 다 갚으셨습니다. 엄마는 아직도 손목에 파스를 붙입니다.' });
  if (S.flags.taehoSaved) out.push({ s: 'taeho', t: '야, 이번 주 소주는 내가 산다. 진짜로.' });
  else if (S.flags.taehoLost) out.push({ n: '태호는 루나로 모든 것을 잃었습니다. 하지만 이번에는 당신이 곁에 있었습니다.' });
  out.push({ n: `순자산 ${fmtWon(netWorth())}. 1996년 1월, 저금통에서 시작한 돈입니다.` });
  out.push({ s: 'me', t: '이번 생은, 내가 고른 생이다.' });
  return out;
}
function endingGrade() {
  const nw = netWorth();
  const money = nw >= 1e12 ? 'S' : nw >= 1e11 ? 'A' : nw >= 1e10 ? 'B' : nw >= 1e9 ? 'C' : nw >= 1e8 ? 'D' : 'F';
  let rel = 0;
  for (const c of metList()) rel += S.people[c.id].aff;
  rel = rel / Math.max(1, metList().length);
  return { money, rel: Math.round(rel), nw };
}

// ---- 사건 발생 ----
function condOk(c, cid) {
  if (!c) return true;
  const ym = curYM();
  if (c.aff != null && aff(cid) < c.aff) return false;
  if (c.age != null && age() < c.age) return false;
  if (c.ym && ym < c.ym) return false;
  if (c.to && ym > c.to) return false;
  if (c.flag && !S.flags[c.flag]) return false;
  if (c.noflag && S.flags[c.noflag]) return false;
  return true;
}
function enqueue(key) { if (!S.done[key] && !S.queue.includes(key)) S.queue.push(key); }
function checkEvents() {
  if (S.ended && !S.queue.includes('finale')) return;
  const ym = curYM();
  for (const [id, e] of Object.entries(STORY)) {
    if (e.cond) { if (e.cond()) enqueue('story:' + id); continue; }
    if (e.at !== ym) continue;
    if (e.when && !e.when()) continue;
    enqueue('story:' + id);
  }
  HISTORY.forEach((h, i) => { if (h.ym === ym) enqueue('news:' + i); });
  if (stat('fame') >= SPONSOR_FAME && year() >= SNS_INCOME_FROM && month() === 6) enqueue('sponsor:' + year());
  for (const q of SPORTS) if (q.ask === ym) enqueue('sport:' + q.id);
  if (!S.queue.some(k => k.startsWith('char:'))) {
    outer: for (const c of metList()) for (const e of c.ev) {
      const key = 'char:' + c.id + ':' + e.id;
      if (S.done[key]) continue;
      if (condOk(e.c, c.id)) { enqueue(key); break outer; }
    }
  }
}

// ---- 진행기 ----
// 화면과 무관하게 돈다. 화면은 RUN 을 읽어 그린다
let RUN = null;
function applyFx(fx) {
  const extra = [];
  if (fx.cash) { const v = fx.cash * (fx.cpi ? cpiF() : 1); S.cash += v; log(`${v >= 0 ? '받은 돈' : '쓴 돈'} ${fmtSigned(v)}`, v >= 0 ? 'good' : 'warn'); }
  if (fx.aff) for (const [id, n] of Object.entries(fx.aff)) { if (!S.people[id]) meet(id); addAff(id, n); }
  applyStats(fx);
  if (fx.flag) [].concat(fx.flag).forEach(f => { S.flags[f] = true; });
  if (fx.meet) [].concat(fx.meet).forEach(id => meet(id));
  if (fx.job) { S.job = fx.job; S.jobSince = S.mi; }
  if (fx.edu) S.edu = fx.edu;
  if (fx.gems) S.gems += fx.gems;
  if (fx.fn) fx.fn();
  if (fx.tip) {
    const to = Math.min(LAST_MI, S.mi + 6);
    let best = null, bv = 0;
    for (const t of TICKERS) {
      if (!['KS', 'KQ'].includes(tkTab(t.id)) || !listed(t.id) || !listed(t.id, to)) continue;
      const r = MARKET.s[t.id].c[to] / price(t.id); if (r > bv) { bv = r; best = t; }
    }
    if (best) extra.push({ s: 'broker', t: `「${tkName(best.id)}」이요. 큰손들이 몰래 담고 있대요. 저는 말 안 했습니다?` });
  }
  return extra;
}
function choiceNeed(ch) {
  if (ch.if && !ch.if()) return ch.need || '조건 부족';
  if (ch.fx && ch.fx.cash < 0) { const v = -ch.fx.cash * (ch.fx.cpi ? cpiF() : 1); if (S.cash < v) return '현금 ' + fmtWon(v) + ' 필요'; }
  return '';
}
function storyStart() {
  if (RUN || !S.queue.length) return;
  const key = S.queue[0], ev = resolveEvent(key);
  if (!ev) { S.queue.shift(); return storyStart(); }
  RUN = { key, title: ev.title, art: ev.art, lines: ev.lines.slice(), i: -1, cur: null };
  storyAdvance();
}
function storyAdvance() {
  if (!RUN) return;
  if (RUN.cur && RUN.cur.c) return;   // 선택지는 골라야 넘어간다
  for (;;) {
    RUN.i++;
    if (RUN.i >= RUN.lines.length) { storyFinish(); return; }
    const L = RUN.lines[RUN.i];
    if (L.fx) { const ex = applyFx(L.fx); if (ex.length) RUN.lines.splice(RUN.i + 1, 0, ...ex); continue; }
    if (L.meet) { meet(L.meet); continue; }
    if (L.art) { RUN.art = L.art; continue; }
    if (L.if) { RUN.lines.splice(RUN.i + 1, 0, ...((L.if() ? L.then : L.else) || [])); continue; }
    if (L.dyn) { RUN.lines.splice(RUN.i + 1, 0, ...L.dyn()); continue; }
    if (L.s && L.s !== 'me' && CH[L.s]) RUN.art = 'char:' + L.s;
    if (!L.c) RUN.prev = L;   // 선택지가 뜰 때 바로 앞 대사를 함께 보여 준다
    RUN.cur = L;
    return;
  }
}
function storyChoose(k) {
  if (!RUN || !RUN.cur || !RUN.cur.c) return false;
  const ch = RUN.cur.c[k]; if (!ch || choiceNeed(ch)) return false;
  const ex = applyFx(ch.fx || {});
  RUN.lines.splice(RUN.i + 1, 0, ...(ch.go || []), ...ex);
  RUN.cur = null;
  storyAdvance();
  return true;
}
function storyFinish() {
  S.done[RUN.key] = true;
  S.queue.shift();
  RUN = null;
  record();
  save();
  if (S.queue.length) storyStart();
}
