export type Explanation = {
  definition: string
  analogy: string
  role: string
}

export type TermEntry = {
  term: string
  aliases: string[]
  explanations: Explanation[]
}

export const MOCK_TERMS: TermEntry[] = [
  {
    term: '피싱',
    aliases: ['phishing', '피슁', '피씽'],
    explanations: [
      {
        definition:
          '믿을 만한 곳처럼 위장해 사람을 속이고 정보를 빼내는 사기 수법이에요.',
        analogy:
          '택배 기사 옷을 입고 초인종을 누르는 낯선 사람과 같아요. 옷차림은 그럴듯하지만, 문을 열어주면 집 안을 훑어보고 지갑을 챙겨 갑니다. 진짜 기사인지 확인하려면 문틈으로 사원증을 보여달라고 해야 하죠.',
        role:
          '실제 침해 사고의 시작점 대부분이 피싱 메일입니다. 그래서 기업은 메일 필터링과 모의 피싱 훈련으로 "문을 열지 않는 습관"을 만듭니다.',
      },
      {
        definition:
          '가짜 화면이나 메시지로 로그인 정보·결제 정보를 자발적으로 넘기게 만드는 공격이에요.',
        analogy:
          '학교 앞에 원래 없던 매점이 하룻밤 사이 생겼다고 상상해 보세요. 간판도 진열대도 똑같지만, 카드를 긁으면 결제만 되고 물건은 나오지 않습니다. 간판이 아니라 주소를 확인해야 진짜를 구분할 수 있어요.',
        role:
          '보안에서 피싱 대응은 "기술"보다 "확인 절차"에 가깝습니다. 발신 주소 확인, 링크 대신 직접 접속, 이중 인증이 기본 방어선이 됩니다.',
      },
      {
        definition: '사람의 심리를 노리는 사회공학적 공격의 대표 유형입니다.',
        analogy:
          '"엄마, 나 휴대폰 깨졌어"로 시작하는 문자와 똑같습니다. 급하다는 말로 생각할 시간을 빼앗고, 확인 전화 한 통만 하면 무너지는 거짓말이죠.',
        role:
          '방화벽도 백신도 사용자가 직접 비밀번호를 입력하면 막을 수 없습니다. 그래서 피싱은 기술 방어의 빈틈을 노리는 공격으로 분류됩니다.',
      },
    ],
  },
  {
    term: 'VPN',
    aliases: ['vpn', '브이피엔', 'vpm', '가상사설망'],
    explanations: [
      {
        definition:
          '공용 인터넷 위에 나만 쓰는 비밀 통로를 만들어 통신을 감싸주는 기술이에요.',
        analogy:
          '북적이는 지하철에서 통화하는 대신, 방음 부스로 들어가는 것과 같습니다. 같은 역에 있다는 건 보이지만, 무슨 이야기를 하는지는 아무도 듣지 못하죠.',
        role:
          '카페 와이파이처럼 신뢰할 수 없는 망에서 사내 시스템에 접속할 때 씁니다. 통신 내용을 암호화해 중간에서 훔쳐보는 것을 막아줍니다.',
      },
      {
        definition:
          '내 기기와 목적지 서버 사이 트래픽을 암호화해 전달하는 중개 통로입니다.',
        analogy:
          '우편엽서 대신 봉인된 서류 봉투로 편지를 보내는 셈입니다. 집배원은 봉투를 어디로 옮기는지만 알고, 안에 적힌 글은 볼 수 없습니다.',
        role:
          '원격 근무 환경에서 사내망 접근 통제의 기본 장치로 쓰이며, 접속 위치를 회사 네트워크로 고정해 권한 정책을 적용하게 해줍니다.',
      },
    ],
  },
  {
    term: '랜섬웨어',
    aliases: ['ransomware', '랜섬', '렌섬웨어'],
    explanations: [
      {
        definition:
          '파일을 몰래 잠근 뒤 풀어주는 대가로 돈을 요구하는 악성 프로그램이에요.',
        analogy:
          '누군가 집 안의 모든 서랍에 자기 자물쇠를 걸고, 열쇠를 사려면 돈을 내라고 쪽지를 남긴 상황입니다. 집은 그대로인데 내 물건만 쓸 수 없게 되죠.',
        role:
          '피해 규모가 가장 큰 공격 유형 중 하나입니다. 그래서 보안에서는 "복구 가능성"이 핵심이며, 분리 보관된 백업이 사실상 유일한 확실한 대응책입니다.',
      },
      {
        definition:
          '데이터를 암호화해 인질로 삼고 금전을 협박하는 사이버 범죄 도구입니다.',
        analogy:
          '숙제 노트를 알아볼 수 없는 암호로 전부 바꿔놓고, 해독표를 팔겠다고 하는 것과 같습니다. 돈을 줘도 해독표가 진짜인지 보장은 없습니다.',
        role:
          '최근에는 데이터를 유출까지 하는 이중 협박형이 흔합니다. 대응은 백업 + 망 분리 + 최소 권한 원칙의 조합으로 이루어집니다.',
      },
    ],
  },
  {
    term: '방화벽',
    aliases: ['firewall', '파이어월', '방화백'],
    explanations: [
      {
        definition:
          '들어오고 나가는 네트워크 통신을 규칙에 따라 허용하거나 차단하는 장치예요.',
        analogy:
          '건물 1층 로비의 경비 데스크와 같습니다. 방문 목적과 출입증을 확인해 통과시킬 사람만 들여보내고, 목록에 없는 사람은 정중히 돌려보냅니다.',
        role:
          '네트워크 보안의 가장 기본적인 경계선입니다. 불필요한 포트를 닫아 공격자가 시도할 수 있는 "문의 개수" 자체를 줄여줍니다.',
      },
      {
        definition:
          '허용 규칙 목록을 기준으로 트래픽을 걸러내는 네트워크 필터입니다.',
        analogy:
          '초대장에 적힌 이름만 입장시키는 결혼식 안내 데스크입니다. 누가 왔는지 기록도 남기니, 나중에 이상한 손님을 되짚어볼 수 있죠.',
        role:
          '로그가 함께 남기 때문에 침입 탐지와 사고 조사의 출발점으로도 활용됩니다.',
      },
    ],
  },
  {
    term: '이중 인증',
    aliases: ['2fa', 'mfa', '다중인증', '이중인증', '투팩터'],
    explanations: [
      {
        definition:
          '비밀번호 외에 한 가지 증거를 더 확인해 본인임을 검증하는 방식이에요.',
        analogy:
          '은행 금고를 열 때 열쇠 하나로는 부족하고, 직원 두 사람이 각자의 열쇠를 함께 돌려야 하는 규칙과 같습니다. 하나가 털려도 금고는 그대로 잠겨 있죠.',
        role:
          '비밀번호 유출 사고의 피해를 실질적으로 막아주는 가장 가성비 높은 보안 조치로 꼽힙니다.',
      },
      {
        definition:
          '지식(비밀번호)과 소유(휴대폰·보안키)를 조합해 로그인을 지키는 인증 체계입니다.',
        analogy:
          '공항에서 여권만 보여주는 게 아니라 탑승권까지 함께 확인받는 것과 같습니다. 서류 하나를 주워도 비행기에는 탈 수 없습니다.',
        role:
          '피싱으로 비밀번호가 새어 나가도 두 번째 인증 단계에서 공격이 멈추기 때문에, 계정 탈취 방어의 표준으로 자리 잡았습니다.',
      },
    ],
  },
  {
    term: '암호화',
    aliases: ['encryption', '엔크립션', '암호화기술'],
    explanations: [
      {
        definition:
          '정해진 열쇠가 있어야만 원래 내용을 읽을 수 있게 데이터를 바꾸는 기술이에요.',
        analogy:
          '친구와 나만 아는 규칙으로 쪽지를 적는 것과 같습니다. 쪽지를 주워도 규칙을 모르면 낙서로만 보입니다.',
        role:
          '데이터가 유출되어도 내용을 읽지 못하게 만드는 마지막 안전장치입니다. 저장 중(디스크)과 전송 중(HTTPS) 모두에 적용됩니다.',
      },
      {
        definition:
          '평문을 암호문으로 변환해 열쇠 없는 사람에게는 의미 없는 값으로 만드는 처리입니다.',
        analogy:
          '음식을 지문 인식 도시락통에 넣어 두는 셈입니다. 통은 누구나 들 수 있지만, 뚜껑을 여는 건 등록된 손가락뿐입니다.',
        role:
          '개인정보보호 법규에서 요구하는 필수 통제 항목이며, 열쇠 관리가 곧 암호화의 실제 안전도를 결정합니다.',
      },
    ],
  },
  {
    term: 'DDoS',
    aliases: ['ddos', '디도스', '분산서비스거부'],
    explanations: [
      {
        definition:
          '수많은 접속을 한꺼번에 보내 서비스를 마비시키는 공격이에요.',
        analogy:
          '작은 분식집 전화번호로 장난 전화 수천 통을 동시에 거는 것과 같습니다. 가게는 멀쩡한데 진짜 손님은 아무도 주문을 못 하게 되죠.',
        role:
          '정보를 훔치는 대신 가용성을 무너뜨리는 공격입니다. CDN, 트래픽 스크러빙, 속도 제한 같은 완충 장치로 대응합니다.',
      },
      {
        definition:
          '여러 곳에 흩어진 기기를 동원해 서버 자원을 고갈시키는 분산 공격입니다.',
        analogy:
          '한 명이 놀이공원 줄에 계속 끼어드는 게 아니라, 수만 명이 동시에 입장 게이트로 몰려드는 상황입니다. 게이트가 고장 난 게 아니라 감당이 안 되는 거죠.',
        role:
          '공격 트래픽과 정상 트래픽을 구분하는 것이 핵심이라, 평소의 트래픽 기준선을 아는 것 자체가 방어의 시작입니다.',
      },
    ],
  },
  {
    term: '제로데이',
    aliases: ['zero-day', 'zeroday', '제로 데이', '0day'],
    explanations: [
      {
        definition:
          '아직 패치가 나오지 않은 미공개 취약점, 또는 그것을 노린 공격이에요.',
        analogy:
          '건물 설계 도면에 표시되지 않은 뒷문을 도둑이 먼저 발견한 상황입니다. 관리인은 그 문이 있다는 사실조차 몰라 잠글 수도 없습니다.',
        role:
          '패치가 없으니 탐지·격리·최소 권한 같은 "피해 확산 줄이기" 전략이 방어의 중심이 됩니다.',
      },
      {
        definition:
          '개발사가 인지하기 전에 악용되는 보안 결함으로, 대응 시간이 0일이라는 뜻입니다.',
        analogy:
          '시험 문제 오류를 학생이 먼저 발견해 조용히 이용하는 것과 비슷합니다. 출제자가 알아채는 순간 정정되지만, 그 전까지는 무방비죠.',
        role:
          '위험도가 높아 거래 가격도 높습니다. 조직은 자산 목록과 신속한 패치 체계를 갖춰 공개 직후의 골든타임을 줄입니다.',
      },
    ],
  },
]

export const SUGGESTED_TERMS = ['피싱', 'VPN', '랜섬웨어', '방화벽']

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function levenshtein(a: string, b: string) {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  )

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

export function findTerm(query: string): TermEntry | null {
  const q = normalize(query)
  if (!q) return null

  return (
    MOCK_TERMS.find(
      (entry) =>
        normalize(entry.term) === q ||
        entry.aliases.some((alias) => normalize(alias) === q),
    ) ?? null
  )
}

/** 오탈자로 추정되는 가장 가까운 용어를 반환합니다. */
export function suggestTerm(query: string): string | null {
  const q = normalize(query)
  if (q.length < 2) return null

  let best: { term: string; distance: number } | null = null

  for (const entry of MOCK_TERMS) {
    for (const candidate of [entry.term, ...entry.aliases]) {
      const distance = levenshtein(q, normalize(candidate))
      if (!best || distance < best.distance) {
        best = { term: entry.term, distance }
      }
    }
  }

  if (!best) return null
  const threshold = q.length <= 3 ? 1 : 2
  return best.distance > 0 && best.distance <= threshold ? best.term : null
}

export function getExplanation(entry: TermEntry, index: number): Explanation {
  return entry.explanations[index % entry.explanations.length]
}
