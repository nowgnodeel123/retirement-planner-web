// app/privacy/page.tsx
// 개인정보처리방침 초안 — S-042 세션 신규. 표준 항목(수집/이용/보관/제3자제공/위탁/파기/권리/책임자)만 담은 초안이며,
// 실제 서비스 공개 전 반드시 법무 검토를 거쳐야 한다(STATE.md 다음 행동 ②).
import Link from "next/link";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h2
        className="fs-title font-bold mb-2"
        style={{ color: "var(--text-strong)" }}
      >
        {title}
      </h2>
      <div
        className="fs-body leading-relaxed space-y-1.5"
        style={{ color: "var(--text-sub)" }}
      >
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main
      className="flex-1 max-w-xl mx-auto w-full px-5 pt-8 pb-16"
      style={{ color: "var(--text)" }}
    >
      <Link
        href="/"
        className="fs-body mb-4 inline-block"
        style={{ color: "var(--text-faint)" }}
      >
        ← 돌아가기
      </Link>

      <h1
        className="text-xl font-bold mb-2"
        style={{ color: "var(--text-strong)" }}
      >
        개인정보처리방침
      </h1>
      <p className="fs-body mb-5" style={{ color: "var(--text-faint)" }}>
        시행일: 2026년 8월 14일
      </p>

      <div
        className="rounded-xl px-3 py-2.5 mb-7 text-[12px]"
        style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
      >
        이 문서는 초안입니다. 실제 서비스로 공개하기 전 반드시 법무 전문가의
        검토를 받아 최종본으로 교체해야 합니다.
      </div>

      <Section title="1. 수집하는 개인정보 항목">
        <p>
          <strong style={{ color: "var(--text)" }}>계정 정보</strong> — 이메일,
          비밀번호(암호화 저장) 또는 카카오 로그인 시 카카오가 제공하는 이메일·닉네임
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>프로필 정보</strong> — 닉네임,
          이름, 생년월일, 성별
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>본인확인 정보</strong> —
          휴대전화번호
        </p>
        <p>
          <strong style={{ color: "var(--text)" }}>서비스 이용 정보</strong> —
          이용자가 직접 입력한 계좌·자산·매매내역·배당내역·입금내역
        </p>
      </Section>

      <Section title="2. 개인정보 수집·이용 목적">
        <p>회원 가입 의사 확인, 본인 확인, 중복 가입 방지</p>
        <p>자산 현황 관리 및 은퇴 준비도 계산 등 서비스 제공</p>
        <p>계정 분실·도용 시 본인 확인 및 복구(아이디 찾기·비밀번호 재설정)</p>
      </Section>

      <Section title="3. 보유 및 이용 기간">
        <p>
          회원 탈퇴 시 지체 없이 파기합니다. 관계 법령에 따라 보존이 필요한
          경우에는 해당 법령에서 정한 기간 동안 별도 보관 후 파기합니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p>
          이용자의 개인정보는 원칙적으로 외부에 제공하지 않습니다. 법령에 근거가
          있거나 이용자가 사전에 동의한 경우에 한해 예외로 합니다.
        </p>
      </Section>

      <Section title="5. 처리 위탁 및 외부 연동">
        <p>
          카카오 로그인 시 카카오(카카오 계정)를 통해 이메일·닉네임을 제공받습니다.
        </p>
        <p>
          시세·환율 조회를 위해 외부 시세 제공처(국내주식: 한국거래소 시세,
          해외주식: Finnhub, 암호화폐: Upbit, 환율: 한국수출입은행)를 호출하지만,
          이 조회에는 이용자를 식별할 수 있는 개인정보가 전송되지 않습니다(종목·통화
          코드만 전달).
        </p>
        <p>
          휴대전화 인증은 현재 자체 시스템에서 인증번호를 생성·검증하는 방식이며,
          외부 SMS 발송업체와 연동되어 있지 않습니다. 실제 SMS 발송 연동 시 위탁
          업체와 위탁 범위를 이 문서에 별도로 고지합니다.
        </p>
      </Section>

      <Section title="6. 개인정보의 파기 절차 및 방법">
        <p>
          전자적 파일 형태로 저장된 개인정보는 복구할 수 없는 방법으로 즉시
          삭제합니다.
        </p>
      </Section>

      <Section title="7. 이용자의 권리">
        <p>
          이용자는 언제든지 자신의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴를
          통해 개인정보 수집·이용 동의를 철회할 수 있습니다. 마이페이지 또는
          아래 문의처를 통해 요청할 수 있습니다.
        </p>
      </Section>

      <Section title="8. 개인정보 보호책임자">
        <p>담당자: 네스트 개발팀</p>
        <p>이메일: nowgnodeel123@gmail.com</p>
      </Section>
    </main>
  );
}
