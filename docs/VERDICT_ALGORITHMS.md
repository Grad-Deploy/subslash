# SubSlash 5대 구독 가치 판정 알고리즘 명세서

> 임계값(4회/10일/10시간/50%/80% 등)은 학술 근거가 있는 값이 아니라 제품 판단에 따른 경험적 기준이며, 실제 체크인 데이터 분포로 튜닝할 예정이다.

SubSlash는 구독 서비스의 특성에 따라 단순히 '금액'만으로 판단하지 않고, 서비스 성격에 최적화된 **5가지 가치 지표(`ValueMetric`)**를 기준으로 위험도(`RiskLevel`: `red` | `yellow` | `green`)와 이용 목표 달성 여부를 판정합니다.

모든 지표의 목표량(`GOOD_AT`)과 구간별 위험도 임계값(`VERDICT_THRESHOLDS`)은 **`packages/shared/src/constants/thresholds.ts`**를 단일 출처(Single Source of Truth)로 참조합니다.

---

## 1. 5대 판정 지표 및 기본 원리

### 1) `uses` (이용 횟수 판정)

- **적용 대상**: OTT(넷플릭스, 티빙, 디즈니+), 스트리밍, 웹툰/콘텐츠 구독
- **계산 공식 (`calculateCostPerUse`)**:
  - `amount <= 0`이면 `0`, `usageCount <= 0`이면 `amount`, 그 외에는 $\text{costPerUse} = \frac{\text{monthlyShare}}{\text{usageCount}}$
- **판정 기준 (`getRiskLevel`, `VERDICT_THRESHOLDS.uses`)**:
  - 🔴 **위험 (Red)**: `usageCount < 2` (`VERDICT_THRESHOLDS.uses.redBelow`) 또는 (`amount > 0`이고 `1회 단가 > 월 부담금의 50%` (`amount / redBelow`))
  - 🟢 **잘 씀 (Green)**:
    - 유료 구독(`amount > 0`): `1회 단가 <= 월 부담금의 25%` (`amount / GOOD_AT.uses`, 즉 정상 호출 기준 `usageCount >= 4`)
    - 무료·0원 부담 구독(`amount <= 0`): `usageCount >= GOOD_AT.uses` (4회 이상)
  - 🟡 **주의 (Yellow)**: 그 사이의 구간 (정수 기준 2~3회 이용 구간)
- **0원·가족 공유 0원 부담 구독 경계 및 문구 분리 원칙**:
  - 빨강 경계를 `usageCount <= 1`이 아닌 `usageCount < 2`로 통일해, 폰 사용 기록 환산(`opensPer30`) 같은 소수 횟수(예: `1.5회`)에서도 유료 구독과 0원 부담 구독이 항상 같은 색(`red`)을 반환합니다(정수 입력 결과는 `0~1 red`, `2~3 yellow`, `4+ green`으로 동일).
  - 과거 `getRiskLevel`에 남아 있던 `usageCount >= 8` 레거시 분기는 삭제하고 `GOOD_AT.uses`에서 파생된 단일 기준만 사용합니다.
  - `monthly <= 0`일 때는 `describeCheckInOutcome`, `describeUsageMetaphor`, `AppCheckInResult`, `CostEfficiencyGauge`에서 `"₩0을 아껴요"`, `"₩0을 냈어요"` 같은 금전 손실·절약 문구와 해지 안내 CTA를 제안하지 않고 이용 목표까지 남은 횟수만 안내합니다.
- **기본 원리**: 30일 동안 최소 주 1회(한 달 4회) 이상 시청하면 1회당 단가가 월 요금의 1/4 이하로 내려가 "충분히 돈값을 했다"고 판단합니다.

---

### 2) `days` (출석/사용 일수 판정)

- **적용 대상**: AI 코딩/대화 도구(ChatGPT Plus, Claude Pro, Cursor, Antigravity), 업무/생산성 도구
- **계산 공식**: 최근 30일 중 5분 이상 활성 사용한 일수 (`coveredDays` 중 활성 일수)
- **판정 기준 (`metricRiskLevel: 'days'`)**:
  - 🔴 **위험 (Red)**: `quantity <= 2` (30일 중 2일 이하 사용)
  - 🟢 **잘 씀 (Green)**: `quantity >= 10` (`GOOD_AT.days`, 30일 중 10일 이상 사용)
  - 🟡 **주의 (Yellow)**: 3~9일 사용
- **예외 보정 규칙**:
  - **무료 요금제 충분 (`freeTier: "enough"`)**: 10일 이상 썼더라도 사용자가 "무료로도 충분했다"고 답하면 🟢이 아닌 🟡(주의)로 판정합니다 (유료 구독 필요성 재검토).
  - **API 가치 보정 (`apiValueRatio`)**: PC 기록의 토큰 환산 가치가 월 구독료 이상이면, 출석일수가 10일 미만이어도 🟢(Green)으로 인정합니다.

---

### 3) `hours` (이용 시간 판정)

- **적용 대상**: 음원 스트리밍(멜론, 스포티파이, 유튜브 뮤직), 오디오북, 전자책(밀리의 서재)
- **계산 공식**: 최근 30일 동안의 총 재생/백그라운드 청취 시간(시간 단위)
- **판정 기준 (`metricRiskLevel: 'hours'`)**:
  - 🔴 **위험 (Red)**: `quantity < 2` (30일 동안 2시간 미만 사용)
  - 🟢 **잘 씀 (Green)**: `quantity >= 10` (`GOOD_AT.hours`, 30일 동안 10시간 이상 사용)
  - 🟡 **주의 (Yellow)**: 2시간 이상 ~ 10시간 미만 사용
- **기본 원리**: 화면을 켜지 않고 백그라운드로 소모하는 서비스는 횟수를 셀 수 없으므로, 한 달에 10시간(하루 약 20분) 이상 즐겼는지를 만족의 기준으로 삼습니다.

---

### 4) `benefit` (환급/할인 혜택 판정)

- **적용 대상**: 쇼핑/배달/결제 멤버십(쿠팡 와우, 네이버플러스 멤버십, 배민클럽 등)
- **계산 공식**:
  $$\text{benefitRatio} = \frac{\text{quantity (환급·할인 총액, KRW)}}{\text{toKRW}(\text{monthlyShare}, \text{currency})}$$
- **판정 기준 (`metricRiskLevel: 'benefit'`, `VERDICT_THRESHOLDS.benefit`)**:
  - 🔴 **위험 (Red)**: `benefitRatio < 0.5` (`redBelowRatio`, 월 회비의 50%도 돌려받지 못함)
  - 🟢 **잘 씀 (Green)**: `benefitRatio >= 1.0` (`greenAtRatio`) 또는 `monthlyKRW <= 0` (회비 이상의 혜택을 환급받아 이용 목표 달성)
  - 🟡 **주의 (Yellow)**: 50% 이상 ~ 100% 미만 환급
- **예외 방어 및 저장 규칙**:
  - `metricRiskLevel`은 `currency: Currency`를 기본값 없는 필수 인자로 받아, 비원화(USD) 금액을 넘기면서 통화를 생략해 달러가 원화로 계산되는 실수를 컴파일 타임에 차단합니다.
  - 프로덕션의 정상 구독 흐름에서는 구독 통화가 `KRW`가 아닌 경우 `metricForSubscription`에서 `uses`로 폴백하므로 비원화 `benefit`에 도달하지 않습니다.
  - 다만 `evaluateMetric("benefit", ...)`이나 `metricRiskLevel("benefit", ...)`이 직접 호출될 때(단위 테스트 등 방어용 경로)도 회비를 `toKRW(monthlyShare, currency)`로 환산해 `costPerUse`(원화 회비 ÷ 원화 혜택액, `quantity === 0`이면 원화 회비)와 `outcome.monthly`(`KRW`)를 저장합니다. 이를 통해 `checkInEvidence`의 `costPerUse × usageCount = 월 회비(KRW)` 복원 전제가 통화 혼합 없이 항상 성립합니다.
  - 기존 기록 표시(`unitCostPart`, `shortUnitCost`)에서 구독 통화가 `KRW`가 아닌 경우 환급률 단가 문구를 생략(`null` / `"-"`)해 레거시 데이터와의 호환성을 지킵니다.
- **기본 원리**: 앱 방문 횟수와 상관없이, 실제로 절감한 배송비/적립금/할인 혜택이 월 회비를 넘어섰는지를 직접 비교합니다.

---

### 5) `storage` (저장 공간 점유율 판정)

- **적용 대상**: 클라우드 스토리지(iCloud+, Google One, 네이버 MYBOX, Dropbox)
- **계산 공식**: 현재 사용 용량 / 요금제 제공 용량 (%)
- **판정 기준 (`metricRiskLevel: 'storage'`)**:
  - 🔴 **위험 (Red)**: `quantity === 0` (0% 점유, 아무것도 저장하지 않고 방치)
  - **요금제 다운사이징 탐색 (`storagePlanFit`)**:
    - 사용량이 더 저렴한 하위 요금제 용량의 80%(`HEADROOM = 0.8`) 이하에 들어가면 🟡(주의 - 요금제 낮추기 권유)
    - 더 작은 요금제가 없거나 부가 혜택(`extras`)이 빠지게 되는 경우 🟢(잘 씀)
  - 요금제 정보를 모르는 경우: 50% 미만 🟡, 50% 이상 🟢
- **기본 원리**: 단순히 용량을 채웠는지가 아니라, 더 저렴한 요금제로 내려갈 수 있는 여유 공간이 있는지를 판별합니다.

---

## 2. 연관 판정 보조 알고리즘

### 1) 이용 목표 게이지 (`getBreakEvenInfo`) 및 1회 단가 막대 (`getCostPerUseBarState`)

- **이용 목표 게이지 (`getBreakEvenInfo`, `CostEfficiencyGauge` — `uses` 지표 전용)**:
  - **기본 목표 횟수**: `GOOD_AT.uses` (4회)
  - **진행률 계산**:
    $$\text{progressPercent} = \text{round}\left(\frac{\text{currentUsage}}{\text{breakEvenTarget}} \times 100\right)$$
  - **단계 구분**:
    - 기본 목표(`GOOD_AT.uses`)일 때 위험(`danger`) 경계는 `VERDICT_THRESHOLDS.uses.redBelow`(2회 미만, 4회 기준 50% 미만)에서 파생되며, `< 100%`는 `warning`(주의, 2~3회), `>= 100%`는 `safe`(목표 달성, 4회 이상)입니다.
    - **주의**: 이 게이지는 `uses` 지표 전용입니다. `days`(빨강: 2일 이하 = 목표 10일의 20%)나 `hours`(빨강: 2시간 미만 = 목표 10시간의 20%) 지표에 붙이면 `metricRiskLevel`의 빨강 구간과 게이지의 `danger` 단계가 어긋나므로 다른 지표에는 사용하지 않습니다.
- **1회 이용당 비용 막대 (`getCostPerUseBarState`, `CostPerUseBar`)**:
  - **막대 길이 (`ratio`)**: 월 부담금 대비 1회 단가 비중(`Math.round((costPerUse / monthlyAmount) * 100)`)을 나타내며, 이용 횟수가 1회(100%) ➔ 2회(50%) ➔ 4회(25%) ➔ 10회(10%)로 늘수록 점진적으로 줄어듭니다 (`usageCount <= 0`이고 유료 구독이면 100%, `monthlyAmount <= 0`인 0원 부담 구독은 0%).
  - **막대 색상 (`variant`)**: 막대 길이와 별개로 `getRiskLevel`의 4회 이용 목표 판정(`0~1회 destructive`, `2~3회 warning`, `4회 이상 success`)을 따릅니다.

### 2) 행동 큐 우선순위 정렬 및 최신 체크인 추출 (`getActionQueue`, `latestCheckInBySubscription`)

- **최신 체크인 추출 (`latestCheckInBySubscription`)**:
  - `parseTimestamp`로 유효한 날짜만 인정하며(깨진 `checkedAt` 문자열 제외), 시각이 동률일 때는 배열 뒤쪽(나중에 기록된 항목)을 최신으로 선택합니다.
- **다단계 정렬 원칙 (`getActionQueue`)**:
  1. 우선순위(`PRIORITY: 0~10`) 오름차순 (`charged-after-kill: 0`, `cancel-notice`·`trial-ending`·`billing-soon-risky`·`low-usage-billing-soon: 1` 등)
  2. 우선순위 1 내부에서 `cancel-notice` 최우선 배치
  3. 결제 임박 일수(`daysUntilBilling`, 미상은 `Infinity`) 오름차순 — 같은 우선순위에서는 결제일을 아는 구독이 결제일 미상 구독보다 항상 앞섭니다.
  4. 걸린 금액 내림차순 — 결제일을 아는 구독끼리는 `amountAtStake` 내림차순, 둘 다 결제일을 모르는 연간 구독(`daysUntilBilling === null`)끼리는 `amountAtStake: null` 계약을 유지한 채 별도 `undatedStake` 내림차순으로 정렬합니다.
  5. 액션 종류 세분화(`KIND_ORDER`) 오름차순
- **0원 부담 구독 방어**:
  - 실부담금 0원(`hasMyShare === false`) 구독은 금전 손실 기반 해지 권유(`billing-soon-risky`, `low-usage-billing-soon`, `risky`) 대상에서 제외하되 체크인·해지 확인 등 비금전 액션은 유지합니다.
  - `stakeKRW <= 0`일 때 `amountAtStake`와 `stakeKRW`를 `null`로 두어 `billing-soon`, `trial-ending` 등에서 `"₩0이 곧 빠져나갑니다"`, `"₩0부터 결제가 시작됩니다"` 문구가 생성되지 않도록 방어합니다.

- 비기본 목표에서 getBreakEvenInfo의 danger 경계는 50% 고정이 아니라 redBelow 기반(최대 100%)이다.

---

## 3. 후속 과제 (Follow-up Candidates)

- **`GOOD_AT` 불변 타입 전환**: 현재 `GOOD_AT`는 동적 변경 일관성 테스트(`GOOD_AT.uses = 5`)를 위해 변경 가능한 객체(`Record<..., number>`)로 선언되어 있습니다. 추후 `Readonly`로 잠그고 테스트에서는 `vi.spyOn` 또는 테스트 전용 헬퍼를 사용하는 방향을 검토합니다.
- **`storagePlan.ts`의 `HEADROOM(0.8)` 위치 정리**: 하위 요금제 추천 여유율 상수(`HEADROOM = 0.8`)를 `VERDICT_THRESHOLDS`로 통합할지, 요금제 용량 계산 전용 상수로 분리 유지할지 결정합니다.
- **`metricRiskLevel` 인자 구조 개선**: 현재 7개의 위치 인자를 받으므로, 추후 시그니처 변경 시 선택 인자(`storageFit`, `freeTier`, `apiValueRatio`)를 옵션 객체로 묶는 리팩토링을 고려합니다.
