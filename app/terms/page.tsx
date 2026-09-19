// app/terms/page.tsx
// 이용약관 초안 — S-044 세션 신규. 개인정보처리방침(app/privacy/page.tsx)과 동일한 초안 패턴.
// 실제 서비스 공개 전 반드시 법무 검토를 거쳐야 한다(STATE.md 다음 행동 참조).
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
        className="fs-body leading-relaxed space-y-2"
        style={{ color: "var(--text-sub)" }}
      >
        {children}
      </div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <main
      className="flex-1 max-w-xl mx-auto w-full px-5 pt-8 pb-16"
      style={{ color: "var(--text)" }}
    >
      <Link
        href="/"
        // 글자만 있어 높이가 18~21px이었다(WCAG 2.5.8 AA 24×24 미달).
        // 음수 마진으로 여백만 바깥으로 밀어 보이는 위치는 그대로 두고 넓힌다.
        className="fs-body mb-4 inline-flex items-center px-3 min-h-[44px] -mx-3 rounded-[var(--r-chip)] tappable"
        style={{ color: "var(--text-faint)" }}
      >
        ← 돌아가기
      </Link>

      <h1
        className="fs-metric font-bold mb-2"
        style={{ color: "var(--text-strong)" }}
      >
        이용약관
      </h1>
      <p className="fs-body mb-5" style={{ color: "var(--text-faint)" }}>
        시행일: 2026년 8월 14일
      </p>

      <div
        className="rounded-xl px-3 py-2 mb-7 fs-body"
        style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
      >
        이 문서는 초안입니다. 실제 서비스로 공개하기 전 반드시 법무 전문가의
        검토를 받아 최종본으로 교체해야 합니다.
      </div>

      <Section title="제1조 (목적)">
        <p>
          이 약관은 네스트(이하 &quot;서비스&quot;)가 제공하는 자산 관리 및
          은퇴 준비도 계산 서비스의 이용 조건과 절차, 이용자와 서비스 제공자의
          권리·의무를 정하는 것을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (회원가입)">
        <p>
          이용자는 이메일 또는 카카오 계정으로 회원가입을 신청할 수 있으며,
          서비스는 이 약관 및 개인정보처리방침에 대한 동의를 회원가입의
          조건으로 합니다.
        </p>
      </Section>

      <Section title="제3조 (서비스의 내용)">
        <p>
          서비스는 이용자가 직접 입력한 자산·거래 정보를 바탕으로 자산 현황을
          정리하고, 은퇴 시점의 자산 준비도를 추정해 보여줍니다.
        </p>
        <p>
          서비스가 제공하는 시세·환율·세금 추정·은퇴 시뮬레이션 결과는 모두
          입력값과 공개된 데이터를 바탕으로 한 참고용 계산 결과이며, 실제
          투자 결과나 세액을 보장하지 않습니다.
        </p>
      </Section>

      <Section title="제4조 (면책조항)">
        <p>
          서비스는 투자 자문업 또는 세무 대리업으로 등록되어 있지 않으며,
          서비스가 제공하는 정보는 투자 권유나 세무 상담을 대신하지 않습니다.
          이용자는 서비스 정보를 참고 자료로만 활용해야 하며, 실제 투자·세무
          판단 전 반드시 전문가와 상담해야 합니다.
        </p>
        <p>
          서비스는 이용자가 입력한 정보의 정확성에 대해 책임지지 않으며, 외부
          시세·환율 제공처의 장애로 인한 정보 지연·오류에 대해서도 책임을
          지지 않습니다.
        </p>
      </Section>

      <Section title="제5조 (이용자의 의무)">
        <p>
          이용자는 정확한 정보로 회원가입해야 하며, 계정 정보를 제3자에게
          공유하거나 서비스를 부정한 목적으로 이용해서는 안 됩니다.
        </p>
      </Section>

      <Section title="제6조 (서비스 이용의 제한 및 중단)">
        <p>
          이용자가 이 약관을 위반한 경우 서비스는 사전 통지 후 이용을 제한할
          수 있습니다. 서비스는 시스템 점검, 장애 등의 사유로 서비스 제공을
          일시 중단할 수 있습니다.
        </p>
      </Section>

      <Section title="제7조 (약관의 변경)">
        <p>
          서비스는 필요한 경우 이 약관을 변경할 수 있으며, 변경 시 서비스
          내 공지를 통해 사전 고지합니다.
        </p>
      </Section>

      <Section title="제8조 (문의)">
        <p>이메일: nowgnodeel123@gmail.com</p>
      </Section>
    </main>
  );
}
