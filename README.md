# 🏦 네스트 (Nest) — Retirement Planner Web

> 은퇴 시점 역산 시뮬레이터 + 포트폴리오(자산관리) 프론트엔드

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

<br>

## 📌 프로젝트 소개

**"나는 몇 살에 은퇴할 수 있을까?"** — 3단계 입력만으로 은퇴 가능 나이를 계산하고, 은퇴 시점부터 90세까지 소득이 어떻게 구성되는지 그래프로 보여주는 은퇴 시뮬레이터와, 그 계산에 필요한 자산 데이터를 입력·조회하는 포트폴리오(계좌/자산/매매/배당/수익/세금) 화면으로 구성됩니다.

👉 백엔드 레포: [retirement-planner](https://github.com/nowgnodeel123/retirement-planner)

<br>

## 🎯 핵심 기능

### 로그인
| 기능 | 설명 |
|---|---|
| 카카오 소셜 로그인 | `/oauth2/authorization/kakao` → 콜백(`/auth/callback`)에서 `accessToken` 저장 |
| 이메일 로그인/회원가입 | 하나의 화면(`/login`)에서 토글 전환, 모드 전환 시 폼 전체 초기화 |
| 회원가입 8필드 | 계정정보/프로필/본인확인 3섹션(이메일·비밀번호·이름·생년월일·성별 토글·휴대전화 인증) — 비밀번호 표시/숨김 토글 포함, 이용약관·개인정보처리방침 동의 체크박스 필수(문서는 각각 `/terms`·`/privacy` 초안 링크, D-142/D-144) |
| 휴대전화 인증 UI | 발송→개발용 인증번호 표시(목업, R-017)→확인, 5분 만료 카운트다운 |
| 아이디 찾기 / 비밀번호 재설정 | `/login`에서 모드 전환, 휴대전화 인증 후 처리 |
| 로그인 편의 | 마지막 로그인 이메일 기억(localStorage), Caps Lock 경고, `<form>` 제출로 Enter 키 지원 |
| 세션 유지 | localStorage에 토큰 저장, 새로고침 후에도 로그인 상태 유지 |
| 접근 가드 | 포트폴리오·은퇴시뮬레이터 화면 진입 전 로그인 여부 확인, 비로그인 시 `/login`으로 리다이렉트 |

### 은퇴 시뮬레이터 (로그인 필요)
| 기능                      | 설명                                                            |
| ------------------------- | --------------------------------------------------------------- |
| 3단계 입력 위저드         | 기본정보 → 연금정보 → 투자자산, 진행률 표시                     |
| 은퇴 가능 나이 계산       | 입력값 기반으로 백엔드가 역산한 결과를 히어로 카드로 표시       |
| 연도별 소득 구성 차트     | 국민연금/퇴직연금/IRP+연금저축/주식·ETF 4계열 스택, **오늘 가치(실질)로 환산**해 물가상승 착시 제거(D-129) |
| 은퇴 나이 기준선          | 차트에 은퇴 시작 나이를 ReferenceLine+라벨로 표시(D-130) — 5년 단위 눈금만으로는 안 보이던 문제 해결 |
| 목표 미달 안내            | 75세까지도 목표를 못 채우면 경고 화면으로 안내 (축하 화면 아님) |
| 결과 공유                 | feasible이면 "결과 공유하기"가 Primary 액션(클립보드 복사), infeasible이면 "다시 계산하기"가 Primary(D-130) |
| 입력 검증                 | 음수/문자/앞자리 0 차단, 천단위 콤마, 필드 간 모순 값 사전 차단 |
| What-if 슬라이더          | 결과 화면에서 매달 주식/ETF 투자액을 슬라이더로 늘려보면 은퇴 나이가 실시간으로 얼마나 당겨지는지 미리보기 — 기존 계산 API를 디바운스 재호출, 결과 저장 없이 완전 무상태 유지(`WhatIfSlider.tsx`, D-157, ★핵심) |
| 제출 연출                 | 제출 시 "데이터 확인 → 국민연금/퇴직연금 계산 → 물가상승률 반영 → 시뮬레이션 실행" 4단계 분석 화면(`AnalyzingScreen.tsx`, 최소 2.2초 노출) 후 결과 화면 블록이 순차 등장, 헤드라인 나이 숫자는 count-up 애니메이션(D-158) |

> 결과 화면은 여러 차례 반복 단순화를 거쳐 **히어로(은퇴 가능 나이) + 소득 구성 차트 + 액션 버튼** 3블록으로 정리됐습니다(D-124~D-131, ★핵심 다수). "은퇴 후 소득 구간" 막대, 세금 상세 카드(양도세/연금소득세/건보료), 절세 팁 섹션은 모두 액션 불가능한 중복 정보로 판단해 제거했습니다 — 자세한 판단 과정은 워크스페이스 `STATE.md` Decision Log 참고. 이후 사용자가 GPT/Gemini 피드백을 계기로 재검토를 요청했을 때, 절세 팁류 액션카드나 소득구간 중복표시처럼 이미 되돌린 것과 겹치는 제안은 재도입하지 않고 What-if 슬라이더(D-157)·제출 연출(D-158)처럼 처음 시도하는 것만 선별 채택했습니다.

### 포트폴리오 — 계좌·자산·매매·배당 (로그인 필요)
| 기능 | 설명 |
|---|---|
| 계좌 목록/생성/편집 | 은행/증권사/거래소, 상세유형(일반/ISA/IRP/연금저축), 편집모드(연필 토글)로 수정·삭제, **이름 수정 모달 신규**(`RenameAccountModal`) |
| 계좌 상세 3탭 | 자산 / 수익 / 세금 탭 구조. 은행 계좌는 수익·세금 탭 자체가 개념이 없어 렌더링하지 않음 |
| 자산 추가 | 계좌 기관유형에 따라 카테고리 자동 필터(증권사=국내·해외주식, 거래소=코인, 은행=미지원). **국내·해외주식 모두 종목 검색 자동완성 지원**(`DomesticStockSearch`/`ForeignStockSearch`, D-139) — 코인만 수동입력 |
| 손익 표시 | 평가금액/손익금액/손익률(빨강=이득/파랑=손실), 국내주식 "전일 종가 기준" 라벨 |
| 매수/매도 배지 색상 | 매매 히스토리에서 매수=빨강/매도=파랑(D-138) — 손익 색상 토큰(`--gain`/`--loss`)을 그대로 재사용 |
| 해외주식 원화환산 | 평가금액에 원화 환산 병기(환율 기준일 라벨 포함), 손익률 자체는 USD 기준 유지. 매수 폼의 환율 입력은 최근 매매기준율 자동 조회 |
| 자산 상세 | 보유 요약, **매수 폼 신규**(기존 보유 자산에 재고 추가 가능해짐), 매도 폼, 배당 등록 폼(국내·해외주식만 노출), 매매+배당 통합 히스토리 |
| 정렬/정리 | 앵커드 드롭다운 정렬(평가금액/수익률/이름 × 방향), 전량매도 자산은 접이식 섹션으로 분리 |
| 삭제 플로우 | 확인 모달 + 실행취소 토스트(4초) |

### 포트폴리오 대시보드 / 수익 / 세금
| 기능 | 설명 |
|---|---|
| 대시보드(`/portfolio`) | 총자산 → 이번 달 매매+배당 인사이트 배너 → **종목별 비중 도넛**(D-136, 계좌를 넘나들며 심볼로 합산 — 카테고리 비중에서 재설계) 순서로 배치. 계좌 카드에 계좌별 평가금액·손익률 표시 |
| 수익 탭 | 기간(일/주/월/년/전체)×카테고리 필터로 실현손익+배당 조회 |
| 세금 탭 | 연도 네비게이션, 양도소득세 추정 카드(해외주식만) + 배당소득세 판정 카드("연간 배당 합계(세전 환산)" 라벨 + ⓘ 설명, 국내주식은 15.4% 역환산 반영 D-146), 전문용어 ⓘ 인라인 툴팁, "세무 전문가 검증 필요" 디스클레이머 상시 노출 |

### 계정
| 기능 | 설명 |
|---|---|
| 프로필 메뉴 | 마이페이지(닉네임 수정), 로그아웃, 라이트/다크 테마 토글, 기능 제안하기(mailto), 개인정보처리방침·이용약관 접근 경로(D-142/D-144) |

<br>

## 🛠 기술 스택

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Recharts** — 연도별 소득 타임라인 차트, 종목별 비중 도넛차트
- **Vercel** 배포

<br>

## 🏗 시스템 아키텍처

```
┌─────────────────────┐         ┌──────────────────────────────────────┐
│   Next.js            │  HTTPS  │   Spring Boot API                     │
│   (Vercel)            │────────▶│   /api/auth/**, /oauth2/**            │
│   위저드 + 포트폴리오  │         │   /api/accounts, /api/assets/**       │
│                       │         │   /api/assets/{id}/dividends          │
│                       │         │   /api/accounts/{id}/profit, /tax     │
│                       │         │   /api/portfolio/summary, /insights   │
│                       │         │   /api/domestic-stocks/search         │
│                       │         │   /api/foreign-stocks/search          │
│                       │         │   /api/auth/find-email, /reset-password│
│                       │         │   /api/v1/simulation/calculate (인증)│
└─────────────────────┘         └──────────────────────────────────────┘
```

모든 API 호출은 `lib/api.ts` 공용 fetch 래퍼를 경유해 `Authorization: Bearer {accessToken}` 헤더를 자동 주입하고, 에러 응답 형식({message} 또는 {error, fields})을 모두 흡수해 일관된 `ApiError`로 던집니다.

<br>

## 📁 프로젝트 구조

```
app/
├── page.tsx                            # 은퇴 시뮬레이터 (RequireAuth로 보호)
├── layout.tsx
├── login/page.tsx                      # 카카오 버튼 + 이메일 로그인/회원가입/아이디찾기/비번재설정 토글, 로컬 컴포넌트(KakaoIcon/SectionLabel/GenderToggle)
├── auth/callback/page.tsx              # 카카오 OAuth 콜백 — accessToken 저장 후 /portfolio 이동
├── privacy/page.tsx                    # 개인정보처리방침 초안 (PIPA 표준 8항목, 법무 검토 전 디스클레이머 상시 노출, D-142)
├── terms/page.tsx                      # 이용약관 초안 (privacy와 동일 패턴, D-144)
├── globals.css                         # 라이트/다크 CSS 변수 (--gain/--loss/--gain-soft/--loss-soft/--accent/--warning/--warning-soft 등)
├── components/
│   ├── auth/
│   │   └── RequireAuth.tsx             # 로그인 필요 화면 공용 가드 (포트폴리오 + 시뮬레이터 공유)
│   ├── wizard/
│   │   ├── RetirementWizard.tsx        # 위저드 상태 관리 + API 호출, 제출 payload를 submittedPayload로 보관(D-157)
│   │   ├── Step1BasicInfo.tsx          # 나이 / 소득 / 목표 생활비
│   │   ├── Step2PensionInfo.tsx        # 국민연금 / 퇴직연금(DB·DC) / IRP / 연금저축
│   │   ├── Step3InvestmentAssets.tsx   # 주식 / ETF
│   │   ├── AnalyzingScreen.tsx         # 제출 시 4단계 분석 연출 화면, 최소 2.2초 노출(D-158)
│   │   ├── ResultScreen.tsx            # 결과 화면 (히어로 + 차트 + What-if 슬라이더 + 액션 버튼, D-124~D-131 반복 단순화 + D-157/D-158), count-up 훅 포함
│   │   ├── WhatIfSlider.tsx            # 월 투자액 슬라이더 → 디바운스 재계산 → 은퇴 나이 미리보기, 완전 무상태(D-157, ★핵심)
│   │   ├── IncomeTimelineChart.tsx     # 연도별 소득 구성 차트
│   │   ├── Ui.tsx                      # 공용 입력/버튼 컴포넌트 (NumberInput, Field 등)
│   │   └── types.ts                    # 은퇴 시뮬레이터 DTO 타입 + 변환 함수
│   ├── nav/                            # BottomTabBar, ProfileMenu, ThemeInit
│   └── portfolio/
│       ├── types.ts                    # 계좌/자산/거래/배당/수익/세금 DTO 타입
│       ├── format.ts                   # 금액 포맷 등 공용 유틸
│       ├── PortfolioSummary.tsx        # 총자산/손익 요약
│       ├── HoldingsDonutChart.tsx      # 종목별 비중 도넛(D-136, CategoryDonutChart 대체)
│       ├── MonthlyInsightBanner.tsx    # 이번 달 매매+배당 요약
│       ├── ProfitTab.tsx / TaxTab.tsx  # 계좌 상세 수익/세금 탭
│       ├── PeriodFilterModal.tsx / CategoryFilterChips.tsx
│       ├── SortModal.tsx               # 정렬 앵커드 드롭다운
│       ├── RenameAccountModal.tsx      # 계좌 이름 수정 모달
│       ├── InstitutionTypeSelector.tsx # 계좌 생성 시 기관유형 선택
│       ├── TradeForm.tsx               # TradeAmountFields(필드만)/TradeForm(카드+제출 포함) — 자산상세 매수·매도, 자산등록 최초매수 3곳이 공유(D-051 최종 종결, D-147/D-155)
│       └── ConfirmModal.tsx / Toast.tsx
└── portfolio/
    ├── layout.tsx                       # RequireAuth 적용
    ├── page.tsx                         # 포트폴리오 메인(대시보드)
    └── accounts/
        ├── new/page.tsx
        └── [accountId]/
            ├── page.tsx                 # 계좌 상세 — 자산/수익/세금 3탭(은행은 수익·세금 탭 미렌더링)
            └── assets/
                ├── new/page.tsx         # 자산 추가 — DomesticStockSearch/ForeignStockSearch 로컬 컴포넌트로 종목 자동완성, TradeAmountFields 재사용
                └── [assetId]/page.tsx   # 자산 상세: TradeForm(매수/매도 공용) + 배당 등록 + 통합 히스토리(매수=빨강/매도=파랑)

lib/
├── api.ts     # 공용 fetch 래퍼 (인증 헤더 주입, 에러 파싱 단일화)
├── auth.ts    # 토큰 저장/조회 (localStorage, useSyncExternalStore)
└── theme.ts   # 라이트/다크 테마 상태
```

<br>

## 🚀 로컬 실행 방법

### 사전 요구사항

- Node.js 20+
- [retirement-planner 백엔드](https://github.com/nowgnodeel123/retirement-planner) 실행 중

### 1. 클론 & 설치

```bash
git clone https://github.com/nowgnodeel123/retirement-planner-web.git
cd retirement-planner-web
npm install
```

### 2. 환경 변수

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인합니다. 카카오 로그인·이메일 회원가입 후 포트폴리오/은퇴시뮬레이터 화면에 진입할 수 있습니다.

<br>

## 📱 화면 구성

### 로그인 (`/login`)

카카오 버튼 + 이메일 로그인/회원가입/아이디찾기/비밀번호재설정 토글. 회원가입은 계정정보(이메일/비밀번호)·프로필(이름/생년월일/성별)·본인확인(휴대전화 인증) 3섹션 구조이며, 아이디 찾기·비밀번호 재설정도 휴대전화 인증을 거칩니다. 모드 전환 시 폼 전체가 초기화되고, 실패 시 서버 에러 메시지(중복 이메일 409, 틀린 비밀번호 401)를 배너로 표시합니다.

### 은퇴 시뮬레이터 (`/`, 로그인 필요)

**Step 1 — 기본 정보**: 현재 나이, 현재 월 소득, 목표 은퇴 생활비 (오늘 물가 기준 입력)
**Step 2 — 연금 정보**: 국민연금 납입 기간, 퇴직연금 유형(DB/DC)별 입력, IRP, 연금저축
**Step 3 — 투자 자산**: 주식/ETF 월 납입액·기대수익률·현재 잔액

**제출 → 결과** — 제출 시 `AnalyzingScreen`(데이터 확인→국민연금/퇴직연금 계산→물가상승률 반영→시뮬레이션 실행 4단계, 최소 2.2초)을 거쳐 결과 화면 블록이 순차 등장(D-158)

**결과 화면** — 히어로(count-up 애니메이션) + 차트 + What-if 슬라이더 + 액션 버튼 4블록(D-124~D-131 반복 단순화 + D-157/D-158 신규 추가)
- 히어로: 예상 은퇴 가능 나이 (달성 시 파란 톤, 75세까지 미달성 시 주황 경고 톤), 숫자는 count-up으로 등장
- 연도별 소득 구성 영역 차트(국민연금/퇴직연금/IRP+연금저축/주식·ETF 4계열, 오늘 가치 기준) + 목표 생활비 점선 + 은퇴 나이 기준선
- What-if 슬라이더: 매달 주식/ETF 투자액을 늘려보면 은퇴 나이가 몇 살로 당겨지는지 실시간 미리보기(기존 계산 API 재사용, 결과 저장 없음, D-157)
- feasible: "결과 공유하기"(Primary)+"다시 계산하기"(Secondary) / infeasible: "다시 계산하기"만 Primary

### 포트폴리오 (`/portfolio`, 로그인 필요)

**메인**: 총자산 요약 → 이번 달 매매+배당 인사이트 배너 → 종목별 비중 도넛(D-136) → 계좌 목록(계좌별 평가금액·손익률 표시, 편집모드로 이름수정/삭제)

**계좌 상세 (`/portfolio/accounts/[accountId]`)** — 자산 / 수익 / 세금 3탭
- **자산 탭**: 보유자산 카드 목록, 정렬·정리한 자산(전량매도) 접이식 섹션
- **수익 탭**: 기간(일/주/월/년/전체)×카테고리 필터, 실현손익+배당 통합 리스트
- **세금 탭**: 연도 네비게이션, 양도소득세 추정 카드(해외주식만)·배당소득세 판정 카드, 전문용어 ⓘ 클릭 토글, 디스클레이머 배너 상시 노출

**자산 상세 (`/portfolio/accounts/[accountId]/assets/[assetId]`)**
- 보유 수량·평단 요약
- 매수 폼(재고 추가, 매도 폼과 동일 패턴) / 매도 폼(수량/단가/[해외주식만 환율]/거래일)
- 배당 등록 폼(국내·해외주식만 노출, 해외는 환율 필수)
- 매매+배당 통합 히스토리 — 매수=빨강/매도=파랑 배지(D-138), 배당은 별도 배지

**프로필 메뉴**: 마이페이지(닉네임 수정) / 로그아웃 / 라이트·다크 테마 토글 / 기능 제안하기(mailto)

<br>

## 🧩 입력 검증 원칙

숫자 입력창은 전부 `NumberInput` 공용 컴포넌트를 통해 다음을 보장합니다.

- 음수·문자·특수문자 입력 자체가 불가능 (타이핑 즉시 필터링)
- `01` → `1`처럼 앞자리 0 자동 제거
- 정수 입력 시 천 단위 콤마 실시간 표시
- 비현실적 자릿수 초과 입력 차단
- 백엔드로 보내기 전, 필드 간 모순(예: 나이 대비 과도한 납입기간, 매도 수량 > 보유 수량, 미래 거래일)을 화면 단에서 먼저 안내 — 백엔드도 동일 규칙을 이중으로 검증

<br>

## 🎨 디자인 토큰

`globals.css`에 라이트/다크 모드별 CSS 변수를 정의하고, 인라인 스타일(`style={{ color: "var(--...)" }}`)로 참조합니다.

| 변수 | 용도 |
|---|---|
| `--text-strong` / `--text` / `--text-sub` / `--text-faint` | 텍스트 명도 단계 |
| `--surface` / `--bg` / `--border` | 배경/카드/구분선 |
| `--accent` / `--accent-soft` | 강조색(링크, 버튼) |
| `--gain` / `--loss` / `--gain-soft` / `--loss-soft` | 손익 색상(빨강=이득/파랑=손실). 매매 히스토리의 매수/매도 배지도 같은 토큰을 재사용(D-138) — 국내 증권앱 관례상 매수호가=빨강/매도호가=파랑이 손익 색상과 우연히 일치함을 확인하고 승인 |
| `--error` / `--error-soft` | 검증/서버 에러 배너 전용 |
| `--warning` / `--warning-soft` | 경고(호박색) — 계좌 상세 "시세 조회 실패" 문구 등, `--error`와 동일 패턴(D-143) |
| `--category-*` | 자산 카테고리별 뱃지·도넛 색상(순수 빨강·파랑 제외 — 손익 색상과 혼동 방지) |

<br>

## 🗓 개발 로드맵

MVP 개발 페이즈 M1~M13이 모두 완료되었습니다.

- [x] **M1** — 카카오 OAuth2 + 이메일 로그인 백엔드 연동 준비, JWT 인증
- [x] **M2** — 데이터 모델(계좌/자산/거래/배당/입금) 대응 타입
- [x] **M3** — 포트폴리오 하단 탭바, 계좌 CRUD, 자산 추가(매수)
- [x] **M4** — 계좌 상세 손익 표시(평가금액/손익금액/손익률), 국내주식 D+1 라벨, 프로필 메뉴·테마 토글
- [x] **M5** — 해외주식 원화 이중표시(환율 기준일 포함)
- [x] **M6** — 자산 상세 화면(매도 폼 + 매매 히스토리)
- [x] **M7** — 정렬 UI(앵커드 드롭다운) + 정리한 자산(전량매도) 접이식 분리
- [x] **M8** — 배당 등록 폼 + 매매·배당 통합 히스토리
- [x] **M9** — 포트폴리오 대시보드(총자산 요약, 카테고리 도넛, 월간 인사이트 배너)
- [x] **M10** — 계좌 상세 자산/수익/세금 3탭 구조, 수익 탭(기간×카테고리 필터)
- [x] **M11** — 세금 탭(양도소득세 추정 + 배당소득세 판정, 전문용어 인라인 툴팁)
- [x] **M12** — 실제 로그인 화면 연동(`DevTokenGate`/`devAuth.ts` 제거, 카카오+이메일 로그인, `RequireAuth`)
- [x] **M13** — 은퇴시뮬레이터에 `RequireAuth` 적용(로그인 필요), API 호출을 공용 `lib/api.ts`로 통일, README 최종화

M13 이후 마일스톤 외 추가 개선(백로그 소진, QA 페이즈 착수 전):
- [x] 로그인 화면 리뉴얼 + 회원가입 8필드 확장(휴대전화 인증), 아이디 찾기/비밀번호 재설정
- [x] 은퇴 시뮬레이터 결과 화면 반복 단순화 — 히어로+소득 구성 차트+액션 버튼 3블록으로 정리(D-124~D-131)
- [x] 포트폴리오 20개 항목 리뷰 — 다크모드 잔여 이슈, 계좌 이름 수정, 종목별 비중 대시보드 재설계, 국내·해외주식 종목 자동완성
- [x] 매수/매도 배지 색상을 손익 색상 토큰으로 통일
- [x] 개인정보처리방침(`/privacy`)·이용약관(`/terms`) 초안 페이지, 회원가입 동의 체크박스 연결(D-142/D-144)
- [x] 계좌 상세 "시세 조회 실패" 문구 다크모드 대응(`--warning` 토큰, D-143)
- [x] 매수/매도 폼 완전 재사용 통합 — `TradeForm`을 공용 컴포넌트로 승격(D-051 최종 종결, D-147/D-155)
- [x] What-if 슬라이더 — 결과 화면에서 월 투자액을 조정해 은퇴 나이 실시간 미리보기(D-157, ★핵심)
- [x] 제출 연출(`AnalyzingScreen`) + 헤드라인 count-up 애니메이션(D-158)
- [ ] Vercel 배포 (환경변수 및 카카오 운영 redirect URI 등록 필요)
- [ ] 입력값 새로고침 시 보존 (sessionStorage)
- [ ] JWT 만료/무효 시 자동 로그아웃(401 전역 처리) — 현재는 토큰 존재 여부만으로 게이트 통과
- [ ] CI (GitHub Actions — `next build` on Linux runner)

<br>

## 📄 라이선스

MIT License

<br>

## 👤 개발자

**이동원 (Dongwon Lee)** · [@nowgnodeel123](https://github.com/nowgnodeel123)

---

> ⚠️ 면책 조항: 본 서비스의 계산 결과는 단순 예측치이며 실제 수령액과 다를 수 있습니다.
