# 🏦 네스트 (Nest) — Retirement Planner Web

> 은퇴 시점 역산 시뮬레이터 + 포트폴리오(자산관리) 프론트엔드

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

<br>

## 📌 프로젝트 소개

**"나는 몇 살에 은퇴할 수 있을까?"** — 간단한 입력만으로 은퇴 가능 나이를 계산하고, 은퇴 시점부터 소득이 어떻게 구성되는지 보여주는 은퇴 시뮬레이터와, 그 계산에 필요한 자산 데이터를 입력·조회하는 포트폴리오(계좌/자산/매매/배당/수익/세금) 화면으로 구성됩니다.

👉 백엔드 레포: [retirement-planner](https://github.com/nowgnodeel123/retirement-planner)

<br>

## 🎯 핵심 기능

- **로그인** — 카카오 소셜 로그인 + 이메일 로그인/회원가입, 휴대전화 인증, 아이디 찾기/비밀번호 재설정, 로그인 상태 유지
- **은퇴 시뮬레이터** — 단계별 입력 위저드(기본정보/연금정보/투자자산, ISA 반영), 은퇴 가능 나이 계산 결과, 건강보험 피부양자 경고, 몬테카를로 성공률, 연도별 소득 구성 차트, What-if 슬라이더로 실시간 재계산 미리보기
- **포트폴리오** — 계좌(은행/증권사/거래소) 관리, 국내·해외주식/암호화폐/ETF 종목 검색 자동완성, 매수/매도와 거래 정정·삭제, 현금·외화(원화/달러) 잔액 입력, 배당 등록, 계좌·종목 좌측 스와이프로 이름 수정·삭제, 순서 편집 화면에서 원하는 순서로 정렬, 보유자산 대시보드(총자산·종목별 비중 도넛·자산 등급)
- **연금저축·IRP** — ETF만 검색·매수되도록 화면에서 제한(서버에서도 동일하게 강제)
- **수익/세금** — 계좌별 기간·카테고리 필터 실현손익 조회, 양도소득세·배당소득세 추정 표시
- **내 정보** — 프로필/개인정보 수정, 비밀번호 변경, 화면 테마(라이트/다크), 회원탈퇴

<br>

## 🛠 기술 스택

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Recharts** — 소득 타임라인 차트, 비중 도넛차트
- **Vercel** 배포

<br>

## 🏗 시스템 아키텍처

```
┌─────────────────────┐         ┌──────────────────────────────────────┐
│   Next.js            │  HTTPS  │   Spring Boot API                     │
│   (Vercel)            │────────▶│   인증 / 계좌·자산 / 시세·환율         │
│   위저드 + 포트폴리오  │         │   포트폴리오 대시보드 / 수익·세금       │
│                       │         │   은퇴 시뮬레이션(로그인 필요)         │
└─────────────────────┘         └──────────────────────────────────────┘
```

모든 API 호출은 공용 fetch 래퍼를 경유해 인증 헤더를 자동 주입하고, 에러 응답을 일관된 형태로 처리합니다. 로그인 여부는 각 화면 진입 전에 확인하며, 비로그인 시 로그인 화면으로 리다이렉트됩니다.

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

## 📄 라이선스

MIT License

<br>

## 👤 개발자

**이동원 (Dongwon Lee)** · [@nowgnodeel123](https://github.com/nowgnodeel123)

---

> ⚠️ 면책 조항: 본 서비스의 계산 결과는 단순 예측치이며 실제 수령액과 다를 수 있습니다.
