# 🏦 네스트 (Nest) — Retirement Planner Web

> 은퇴 시점 역산 시뮬레이터 + 포트폴리오(자산관리) 프론트엔드

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

<br>

## 📌 프로젝트 소개

**"나는 몇 살에 은퇴할 수 있을까?"** — 3단계 입력만으로 은퇴 가능 나이를 계산하고, 은퇴 시점부터 90세까지 소득이 어떻게 구성되는지 그래프로 보여주는 은퇴 시뮬레이터와, 그 계산에 필요한 자산 데이터를 입력·조회하는 포트폴리오(계좌/자산/매매/시세) 화면으로 구성됩니다.

👉 백엔드 레포: [retirement-planner](https://github.com/nowgnodeel123/retirement-planner)

<br>

## 🎯 핵심 기능

### 은퇴 시뮬레이터
| 기능                      | 설명                                                            |
| ------------------------- | --------------------------------------------------------------- |
| 3단계 입력 위저드         | 기본정보 → 연금정보 → 투자자산, 진행률 표시                     |
| 은퇴 가능 나이 계산       | 입력값 기반으로 백엔드가 역산한 결과를 표시                     |
| 연도별 소득 타임라인 차트 | 은퇴~90세까지 국민연금/연금/주식 구성을 영역 차트로 시각화      |
| 3구간 배지                | 은퇴 후 어느 시점부터 어떤 소득원이 열리는지 한눈에 표시        |
| 목표 미달 안내            | 75세까지도 목표를 못 채우면 경고 화면으로 안내 (축하 화면 아님) |
| 결과 공유                 | 클립보드로 공유 메시지 복사                                     |
| 입력 검증                 | 음수/문자/앞자리 0 차단, 천단위 콤마, 필드 간 모순 값 사전 차단 |

### 포트폴리오 — 계좌·자산
| 기능 | 설명 |
|---|---|
| 계좌 목록/생성/편집 | 은행/증권사/거래소, 상세유형(일반/ISA/IRP/연금저축), 편집모드(연필 토글)로 수정·삭제 |
| 계좌 상세 | 총 평가금액(원화 환산) + 손익 요약, 보유자산 카드 목록 |
| 자산 추가 | 계좌 기관유형에 따라 카테고리 자동 필터(증권사=국내·해외주식, 거래소=코인, 은행=미지원), 종목검색은 아직 수동입력(코드+이름) |
| 손익 표시 | 평가금액/손익금액/손익률(빨강=이득/파랑=손실), 국내주식 "전일 종가 기준" 라벨 |
| 해외주식 원화환산 | 평가금액에 원화 환산 병기(환율 기준일 라벨 포함) |
| 자산 상세 + 매도 | 보유 요약, 매도 폼(수량/단가/[해외주식만 환율]/거래일), 보유수량 초과 시 에러 표시 |
| 매매 히스토리 | 자산별 매수/매도 거래내역 최신순 조회 |
| 프로필 메뉴 | 마이페이지(닉네임 수정), 로그아웃, 라이트/다크 테마 토글 |
| 개발용 인증 우회 | `DevTokenGate` — 실제 로그인(M12) 연동 전까지 임시 토큰으로 API 테스트, M12에서 제거 예정 |

<br>

## 🛠 기술 스택

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Recharts** — 연도별 소득 타임라인 차트
- **Vercel** 배포

<br>

## 🏗 시스템 아키텍처

```
┌─────────────────────┐         ┌────────────────────────────────┐
│   Next.js             │  HTTPS  │   Spring Boot API                │
│   (Vercel)             │────────▶│   /api/v1/simulation/calculate    │
│   위저드 + 포트폴리오   │         │   /api/accounts, /api/assets/**   │
│                        │         │   /api/domestic-stocks/search     │
└─────────────────────┘         └────────────────────────────────┘
```

<br>

## 📁 프로젝트 구조

```
app/
├── page.tsx
├── layout.tsx
├── globals.css                        # 라이트/다크 CSS 변수 (--gain/--loss/--accent 등)
├── components/
│   ├── wizard/
│   │   ├── RetirementWizard.tsx       # 위저드 상태 관리 + API 호출
│   │   ├── Step1BasicInfo.tsx         # 나이 / 소득 / 목표 생활비
│   │   ├── Step2PensionInfo.tsx       # 국민연금 / 퇴직연금(DB·DC) / IRP / 연금저축
│   │   ├── Step3InvestmentAssets.tsx  # 주식 / ETF
│   │   ├── ResultScreen.tsx           # 결과 화면 (히어로 + 차트 + 요약)
│   │   ├── IncomeTimelineChart.tsx    # 연도별 소득 구성 차트
│   │   ├── Ui.tsx                     # 공용 입력/버튼 컴포넌트 (NumberInput, Field 등)
│   │   └── types.ts                   # 은퇴 시뮬레이터 DTO 타입 + 변환 함수
│   ├── nav/                            # 프로필 메뉴, 테마 토글 (M4)
│   └── portfolio/
│       ├── types.ts                    # 계좌/자산/거래 DTO 타입 + 라벨/색상 맵
│       └── CategoryBadge.tsx           # 자산 카테고리 색상 dot + 라벨
└── portfolio/
    ├── layout.tsx
    ├── page.tsx                         # 포트폴리오 메인 (계좌 목록, 편집모드)
    └── accounts/
        ├── new/page.tsx                 # 계좌 생성
        └── [accountId]/
            ├── page.tsx                 # 계좌 상세 (총 평가금액 + 보유자산 목록)
            └── assets/
                ├── new/page.tsx         # 자산 추가(=최초 매수 거래)
                └── [assetId]/page.tsx   # 자산 상세: 매도 폼 + 매매 히스토리 (M6)

lib/
├── api.ts        # 공용 fetch 래퍼 (인증 헤더, 에러 파싱)
├── devAuth.ts     # 개발용 토큰 저장/조회 (DevTokenGate)
└── theme.ts       # 라이트/다크 테마 상태 (M4)
```

<br>

## 🚀 로컬 실행 방법

### 사전 요구사항

- Node.js 20+
- [retirement-planner 백엔드](https://github.com/nowgnodeel123/retirement-planner) 실행 중 (포트폴리오 화면은 백엔드의 `DATA_GO_KR_API_KEY`/`FINNHUB_API_KEY`/`KOREAEXIM_API_KEY` 설정 필요)

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

`http://localhost:3000` 에서 확인합니다.

> ⚠️ 로그인이 아직 프론트에 연동되지 않아(M12 예정), 포트폴리오 화면은 `DevTokenGate`를 통해 개발용 토큰으로 접근합니다 — 실제 로그인 화면이 아니며, M12에서 전량 대체·삭제될 임시 장치입니다.

<br>

## 📱 화면 구성

### 은퇴 시뮬레이터

**Step 1 — 기본 정보**: 현재 나이, 현재 월 소득, 목표 은퇴 생활비 (오늘 물가 기준 입력)
**Step 2 — 연금 정보**: 국민연금 납입 기간, 퇴직연금 유형(DB/DC)별 입력, IRP, 연금저축
**Step 3 — 투자 자산**: 주식/ETF 월 납입액·기대수익률·현재 잔액

**결과 화면**
- 예상 은퇴 가능 나이 (달성 시 파란 톤, 75세까지 미달성 시 주황 경고 톤)
- 은퇴 후 3구간(주식만 → +연금 → +국민연금) 배지
- 연도별 소득 구성 영역 차트 + 목표 생활비 점선
- 월 예상 수입 요약 및 목표 대비 차이
- 세금·건강보험료
- 결과 공유하기 / 다시 계산하기(입력값 유지)

### 포트폴리오

**메인 (`/portfolio`)**: 계좌 목록, 편집모드(연필 아이콘)로 계좌명 수정/삭제

**계좌 상세 (`/portfolio/accounts/[accountId]`)**
- 총 평가금액(원화 환산 기준) + 총 손익(금액/률, 빨강=이득·파랑=손실)
- 보유자산 카드 목록 — 카드 클릭 시 자산 상세로 이동
- 시세 미조회 자산은 "시세 조회 실패" 표시로 화면 유지(에러로 막지 않음)

**자산 추가 (`/portfolio/accounts/[accountId]/assets/new`)**
- 계좌 기관유형에 따라 카테고리 자동 필터(증권사=국내·해외주식, 거래소=코인)
- 종목코드/종목명 수동 입력(자동완성은 추후 지원 예정), 수량·매수단가·[해외주식만 환율]·거래일 입력
- 거래일은 오늘 이후로 입력 불가

**자산 상세 (`/portfolio/accounts/[accountId]/assets/[assetId]`)** — M6 신규
- 보유 수량·평단 요약
- "매도" 버튼으로 매도 폼 오픈: 수량/단가/[해외주식만 환율]/거래일, 보유수량 초과 입력 시 에러 표시
- 매매 히스토리: 매수(파랑 배지)/매도(회색 배지) 구분, 날짜·수량×단가·금액 최신순 목록

**프로필 메뉴**: 우측 상단 아이콘 → 마이페이지(닉네임 수정) / 로그아웃 / 라이트·다크 테마 토글

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
| `--gain` / `--loss` | 손익 전용 색상(빨강=이득/파랑=손실) — **매수/매도 등 다른 의미에는 재사용하지 않음** |
| `--category-*` | 자산 카테고리별 뱃지 색상(국내주식/해외주식/코인/펀드/현금) |

> `app/components/wizard/Ui.tsx`(위저드 초기 컴포넌트)는 아직 Tailwind 고정 색상(`neutral-500`, `blue-500` 등)을 쓰고 있어 다크모드 전환 시 반영되지 않습니다. 포트폴리오 화면(M4 이후)은 전부 CSS 변수 기반으로 작성되어 있습니다 — Ui.tsx 다크모드 대응은 백로그 후보입니다.

<br>

## 🗓 개발 로드맵

- [x] 3단계 위저드 UI
- [x] Spring Boot API 연동 (은퇴 시뮬레이션)
- [x] 결과 화면 + 연도별 소득 타임라인 차트
- [x] 입력 검증 (음수/문자/모순값 차단)
- [x] 결과 공유 기능 (클립보드)
- [x] **M3** — 포트폴리오 하단 탭바, 계좌 CRUD, 자산 추가(매수), DevTokenGate
- [x] **M4** — 계좌 상세 손익 표시(평가금액/손익금액/손익률), 국내주식 D+1 라벨, 프로필 메뉴·테마 토글
- [x] **M5** — 해외주식 원화 이중표시(환율 기준일 포함)
- [ ] **M6** — 자산 상세 화면(매도 폼 + 매매 히스토리) — *코드 반영 완료, 실동작 검증 진행중*
- [ ] **M7~M9** — 자산목록 정리 / 배당추적 화면 / 포트폴리오 대시보드(도넛차트)
- [ ] **M10~M11** — 수익 탭 / 세금 탭
- [ ] **M12** — 실제 로그인 화면 연동 (DevTokenGate 제거)
- [ ] **M13** — 은퇴시뮬레이터-계정 연동 + README 최종화
- [ ] Vercel 배포
- [ ] 입력값 새로고침 시 보존 (sessionStorage)
- [ ] 세액공제 최적화 팁 화면 (현재 스텁)
- [ ] CI (GitHub Actions — `next build` on Linux runner)

<br>

## 📄 라이선스

MIT License

<br>

## 👤 개발자

**이동원 (Dongwon Lee)** · [@nowgnodeel123](https://github.com/nowgnodeel123)

---

> ⚠️ 면책 조항: 본 서비스의 계산 결과는 단순 예측치이며 실제 수령액과 다를 수 있습니다.
