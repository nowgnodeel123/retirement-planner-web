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
| 이메일 로그인/회원가입 | 하나의 화면(`/login`)에서 토글 전환 |
| 세션 유지 | localStorage에 토큰 저장, 새로고침 후에도 로그인 상태 유지 |
| 접근 가드 | 포트폴리오·은퇴시뮬레이터 화면 진입 전 로그인 여부 확인, 비로그인 시 `/login`으로 리다이렉트 |

### 은퇴 시뮬레이터 (로그인 필요)
| 기능                      | 설명                                                            |
| ------------------------- | --------------------------------------------------------------- |
| 3단계 입력 위저드         | 기본정보 → 연금정보 → 투자자산, 진행률 표시                     |
| 은퇴 가능 나이 계산       | 입력값 기반으로 백엔드가 역산한 결과를 표시                     |
| 연도별 소득 타임라인 차트 | 은퇴~90세까지 국민연금/연금/주식 구성을 영역 차트로 시각화      |
| 3구간 배지                | 은퇴 후 어느 시점부터 어떤 소득원이 열리는지 한눈에 표시        |
| 목표 미달 안내            | 75세까지도 목표를 못 채우면 경고 화면으로 안내 (축하 화면 아님) |
| 결과 공유                 | 클립보드로 공유 메시지 복사                                     |
| 입력 검증                 | 음수/문자/앞자리 0 차단, 천단위 콤마, 필드 간 모순 값 사전 차단 |

### 포트폴리오 — 계좌·자산·매매·배당 (로그인 필요)
| 기능 | 설명 |
|---|---|
| 계좌 목록/생성/편집 | 은행/증권사/거래소, 상세유형(일반/ISA/IRP/연금저축), 편집모드(연필 토글)로 수정·삭제 |
| 계좌 상세 3탭 | 자산 / 수익 / 세금 탭 구조 |
| 자산 추가 | 계좌 기관유형에 따라 카테고리 자동 필터(증권사=국내·해외주식, 거래소=코인, 은행=미지원) |
| 손익 표시 | 평가금액/손익금액/손익률(빨강=이득/파랑=손실), 국내주식 "전일 종가 기준" 라벨 |
| 해외주식 원화환산 | 평가금액에 원화 환산 병기(환율 기준일 라벨 포함), 손익률 자체는 USD 기준 유지 |
| 자산 상세 | 보유 요약, 매도 폼, 배당 등록 폼(국내·해외주식만 노출), 매매+배당 통합 히스토리 |
| 정렬/정리 | 앵커드 드롭다운 정렬(평가금액/수익률/이름 × 방향), 전량매도 자산은 접이식 섹션으로 분리 |
| 삭제 플로우 | 확인 모달 + 실행취소 토스트(4초) |

### 포트폴리오 대시보드 / 수익 / 세금
| 기능 | 설명 |
|---|---|
| 대시보드(`/portfolio`) | 총자산 → 이번 달 매매+배당 인사이트 배너 → 카테고리 비중 도넛(상위 5 + 기타) 순서로 배치 |
| 수익 탭 | 기간(일/주/월/년/전체)×카테고리 필터로 실현손익+배당 조회 |
| 세금 탭 | 연도 네비게이션, 양도소득세 추정 카드(해외주식만) + 배당소득세 판정 카드, 전문용어 ⓘ 인라인 툴팁, "세무 전문가 검증 필요" 디스클레이머 상시 노출 |

### 계정
| 기능 | 설명 |
|---|---|
| 프로필 메뉴 | 마이페이지(닉네임 수정), 로그아웃, 라이트/다크 테마 토글, 기능 제안하기(mailto) |

<br>

## 🛠 기술 스택

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Recharts** — 연도별 소득 타임라인 차트, 카테고리 도넛차트
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
├── login/page.tsx                      # 카카오 버튼 + 이메일 로그인/회원가입 토글
├── auth/callback/page.tsx              # 카카오 OAuth 콜백 — accessToken 저장 후 /portfolio 이동
├── globals.css                         # 라이트/다크 CSS 변수 (--gain/--loss/--accent 등)
├── components/
│   ├── auth/
│   │   └── RequireAuth.tsx             # 로그인 필요 화면 공용 가드 (포트폴리오 + 시뮬레이터 공유)
│   ├── wizard/
│   │   ├── RetirementWizard.tsx        # 위저드 상태 관리 + API 호출
│   │   ├── Step1BasicInfo.tsx          # 나이 / 소득 / 목표 생활비
│   │   ├── Step2PensionInfo.tsx        # 국민연금 / 퇴직연금(DB·DC) / IRP / 연금저축
│   │   ├── Step3InvestmentAssets.tsx   # 주식 / ETF
│   │   ├── ResultScreen.tsx            # 결과 화면 (히어로 + 차트 + 요약)
│   │   ├── IncomeTimelineChart.tsx     # 연도별 소득 구성 차트
│   │   ├── Ui.tsx                      # 공용 입력/버튼 컴포넌트 (NumberInput, Field 등)
│   │   └── types.ts                    # 은퇴 시뮬레이터 DTO 타입 + 변환 함수
│   ├── nav/                            # BottomTabBar, ProfileMenu, ThemeInit
│   └── portfolio/
│       ├── types.ts                    # 계좌/자산/거래/배당/수익/세금 DTO 타입
│       ├── PortfolioSummary.tsx        # 총자산/손익 요약
│       ├── CategoryDonutChart.tsx      # 카테고리 비중 도넛(상위5+기타)
│       ├── MonthlyInsightBanner.tsx    # 이번 달 매매+배당 요약
│       ├── ProfitTab.tsx / TaxTab.tsx  # 계좌 상세 수익/세금 탭
│       ├── PeriodFilterModal.tsx / CategoryFilterChips.tsx
│       ├── SortModal.tsx               # 정렬 앵커드 드롭다운
│       └── ConfirmModal.tsx / Toast.tsx
└── portfolio/
    ├── layout.tsx                       # RequireAuth 적용
    ├── page.tsx                         # 포트폴리오 메인(대시보드)
    └── accounts/
        ├── new/page.tsx
        └── [accountId]/
            ├── page.tsx                 # 계좌 상세 — 자산/수익/세금 3탭
            └── assets/
                ├── new/page.tsx
                └── [assetId]/page.tsx   # 자산 상세: 매도 폼 + 배당 등록 + 통합 히스토리

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

카카오 버튼 + 이메일 로그인/회원가입 토글. 회원가입·로그인 실패 시 서버 에러 메시지(중복 이메일 409, 틀린 비밀번호 401)를 배너로 표시합니다.

### 은퇴 시뮬레이터 (`/`, 로그인 필요)

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

### 포트폴리오 (`/portfolio`, 로그인 필요)

**메인**: 총자산 요약 → 이번 달 매매+배당 인사이트 배너 → 카테고리 비중 도넛 → 계좌 목록(편집모드로 수정/삭제)

**계좌 상세 (`/portfolio/accounts/[accountId]`)** — 자산 / 수익 / 세금 3탭
- **자산 탭**: 보유자산 카드 목록, 정렬·정리한 자산(전량매도) 접이식 섹션
- **수익 탭**: 기간(일/주/월/년/전체)×카테고리 필터, 실현손익+배당 통합 리스트
- **세금 탭**: 연도 네비게이션, 양도소득세 추정 카드(해외주식만)·배당소득세 판정 카드, 전문용어 ⓘ 클릭 토글, 디스클레이머 배너 상시 노출

**자산 상세 (`/portfolio/accounts/[accountId]/assets/[assetId]`)**
- 보유 수량·평단 요약
- 매도 폼(수량/단가/[해외주식만 환율]/거래일)
- 배당 등록 폼(국내·해외주식만 노출, 해외는 환율 필수)
- 매매+배당 통합 히스토리(배당은 별도 배지)

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
| `--gain` / `--loss` | 손익 전용 색상(빨강=이득/파랑=손실) — **매수/매도 등 다른 의미에는 재사용하지 않음** |
| `--error` / `--error-soft` | 검증/서버 에러 배너 전용 |
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
