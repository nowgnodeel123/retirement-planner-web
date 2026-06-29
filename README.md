# 🏦 Retirement Planner Web

> 한국 직장인을 위한 은퇴 소득 시뮬레이터 — 프론트엔드

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

<br>

## 📌 프로젝트 소개

국민연금, 퇴직연금(DC형), IRP를 통합하여 **은퇴 후 예상 소득과 부족분을 5분 안에 계산**해주는 시뮬레이터 프론트엔드입니다.

**"나는 몇 살에 은퇴할 수 있는가"** 라는 질문에 직접적인 답을 제공합니다.

👉 백엔드 레포: [retirement-planner](https://github.com/nowgnodeel123/retirement-planner)

<br>

## 🎯 핵심 기능

| 기능           | 설명                                        |
| -------------- | ------------------------------------------- |
| 은퇴 나이 계산 | 입력값 기반 예상 은퇴 가능 나이 실시간 계산 |
| 소득 분석      | 국민연금 / 퇴직연금 / IRP 항목별 월 수령액  |
| 부족분 분석    | 목표 생활비 대비 부족분 및 IRP 증액 가이드  |
| 결과 공유      | 카카오톡 공유용 메시지 클립보드 복사        |

<br>

## 🛠 기술 스택

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel** 배포

<br>

## 🏗 시스템 아키텍처

```
┌─────────────────────┐         ┌──────────────────────────────┐
│   Next.js           │  HTTPS  │   Spring Boot API             │
│   (Vercel)          │────────▶│   POST /api/v1/simulation     │
│                     │         │        /calculate              │
└─────────────────────┘         └──────────────────────────────┘
```

<br>

## 📁 프로젝트 구조

```
app/
├── page.tsx          # 메인 화면 (입력 폼 + 결과)
├── layout.tsx        # 루트 레이아웃
└── globals.css       # 글로벌 스타일
```

<br>

## 🚀 로컬 실행 방법

### 사전 요구사항

- Node.js 20+
- [retirement-planner 백엔드](https://github.com/nowgnodeel123/retirement-planner) 실행 중

### 1. 레포지토리 클론

```bash
git clone https://github.com/nowgnodeel123/retirement-planner-web.git
cd retirement-planner-web
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인합니다.

<br>

## 📱 화면 구성

### 입력 화면

- 현재 나이 / 목표 은퇴 나이
- 현재 월 소득
- 국민연금 납입 기간
- 월 IRP 납입액
- 목표 은퇴 생활비

### 결과 화면

- 예상 은퇴 가능 나이 (강조)
- 항목별 월 수령액 (국민연금 / 퇴직연금 / IRP)
- 목표 대비 부족분
- 맞춤 조언 메시지
- 친구에게 공유하기

<br>

## 🗓 개발 로드맵

- [x] 입력 폼 UI
- [x] Spring Boot API 연동
- [x] 결과 화면 UI
- [x] 결과 공유 기능
- [ ] Vercel 배포
- [ ] 모바일 최적화
- [ ] 다크모드
- [ ] 시나리오 비교 기능

<br>

## 📄 라이선스

This project is licensed under the MIT License.

<br>

## 👤 개발자

**이동원 (Dongwon Lee)**

- GitHub: [@nowgnodeel123](https://github.com/nowgnodeel123)

---

> ⚠️ 면책 조항: 본 서비스의 계산 결과는 단순 예측치이며 실제 수령액과 다를 수 있습니다.
