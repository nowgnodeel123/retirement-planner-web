# 🏦 Retirement Planner Web

> 한국 직장인을 위한 은퇴 시점 시뮬레이터 — 프론트엔드

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

<br>

## 📌 프로젝트 소개

**"나는 몇 살에 은퇴할 수 있을까?"** — 3단계 입력만으로 은퇴 가능 나이를 계산하고, 은퇴 시점부터 90세까지 소득이 어떻게 구성되는지 그래프로 보여주는 시뮬레이터 프론트엔드입니다.

👉 백엔드 레포: [retirement-planner](https://github.com/nowgnodeel123/retirement-planner)

<br>

## 🎯 핵심 기능

| 기능                      | 설명                                                            |
| ------------------------- | --------------------------------------------------------------- |
| 3단계 입력 위저드         | 기본정보 → 연금정보 → 투자자산, 진행률 표시                     |
| 은퇴 가능 나이 계산       | 입력값 기반으로 백엔드가 역산한 결과를 표시                     |
| 연도별 소득 타임라인 차트 | 은퇴~90세까지 국민연금/연금/주식 구성을 영역 차트로 시각화      |
| 3구간 배지                | 은퇴 후 어느 시점부터 어떤 소득원이 열리는지 한눈에 표시        |
| 목표 미달 안내            | 75세까지도 목표를 못 채우면 경고 화면으로 안내 (축하 화면 아님) |
| 결과 공유                 | 클립보드로 공유 메시지 복사                                     |
| 입력 검증                 | 음수/문자/앞자리 0 차단, 천단위 콤마, 필드 간 모순 값 사전 차단 |

<br>

## 🛠 기술 스택

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Recharts** — 연도별 소득 타임라인 차트
- **Vercel** 배포

<br>

## 🏗 시스템 아키텍처

```
┌─────────────────────┐         ┌──────────────────────────────┐
│   Next.js             │  HTTPS  │   Spring Boot API             │
│   (Vercel)             │────────▶│   POST /api/v1/simulation     │
│   3-Step Wizard        │         │        /calculate              │
└─────────────────────┘         └──────────────────────────────┘
```

<br>

## 📁 프로젝트 구조

```
app/
├── page.tsx
├── layout.tsx
├── globals.css
└── components/
    └── wizard/
        ├── RetirementWizard.tsx       # 위저드 상태 관리 + API 호출
        ├── Step1BasicInfo.tsx         # 나이 / 소득 / 목표 생활비
        ├── Step2PensionInfo.tsx       # 국민연금 / 퇴직연금(DB·DC) / IRP / 연금저축
        ├── Step3InvestmentAssets.tsx  # 주식 / ETF
        ├── ResultScreen.tsx           # 결과 화면 (히어로 + 차트 + 요약)
        ├── IncomeTimelineChart.tsx    # 연도별 소득 구성 차트
        ├── Ui.tsx                     # 공용 입력/버튼 컴포넌트 (NumberInput 등)
        └── types.ts                   # 백엔드 DTO와 매칭되는 타입 + 변환 함수
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

`http://localhost:3000` 에서 확인합니다.

<br>

## 📱 화면 구성

### Step 1 — 기본 정보

현재 나이, 현재 월 소득, 목표 은퇴 생활비 (오늘 물가 기준 입력)

### Step 2 — 연금 정보

국민연금 납입 기간, 퇴직연금 유형(DB/DC)별 입력, IRP, 연금저축

### Step 3 — 투자 자산

주식/ETF 월 납입액·기대수익률·현재 잔액

### 결과 화면

- 예상 은퇴 가능 나이 (달성 시 파란 톤, 75세까지 미달성 시 주황 경고 톤)
- 은퇴 후 3구간(주식만 → +연금 → +국민연금) 배지
- 연도별 소득 구성 영역 차트 + 목표 생활비 점선
- 월 예상 수입 요약 및 목표 대비 차이
- 세금·건강보험료
- 결과 공유하기 / 다시 계산하기(입력값 유지)

<br>

## 🧩 입력 검증 원칙

숫자 입력창은 전부 `NumberInput` 공용 컴포넌트를 통해 다음을 보장합니다.

- 음수·문자·특수문자 입력 자체가 불가능 (타이핑 즉시 필터링)
- `01` → `1`처럼 앞자리 0 자동 제거
- 정수 입력 시 천 단위 콤마 실시간 표시
- 비현실적 자릿수 초과 입력 차단
- 백엔드로 보내기 전, 필드 간 모순(예: 나이 대비 과도한 납입기간)을 위저드 단계에서 먼저 안내

<br>

## 🗓 개발 로드맵

- [x] 3단계 위저드 UI
- [x] Spring Boot API 연동
- [x] 결과 화면 + 연도별 소득 타임라인 차트
- [x] 입력 검증 (음수/문자/모순값 차단)
- [x] 결과 공유 기능 (클립보드)
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
