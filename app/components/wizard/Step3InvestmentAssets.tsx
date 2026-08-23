// Step3InvestmentAssets.tsx
import { RetirementFormState } from "./types";
import {
  ErrorBanner,
  Hint,
  NumberInput,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  SectionCard,
  SmallField,
  WizardCard,
} from "./Ui";

interface Props {
  form: RetirementFormState;
  onChange: <K extends keyof RetirementFormState>(
    key: K,
    value: RetirementFormState[K],
  ) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
}

export default function Step3InvestmentAssets({
  form,
  onChange,
  onSubmit,
  onBack,
  submitting,
  error,
}: Props) {
  return (
    <WizardCard>
      <ProgressBar step={2} total={3} />

      <SectionCard>
        <p
          className="text-lg font-semibold mb-1"
          style={{ color: "var(--text-strong)" }}
        >
          투자 자산을 입력해주세요
        </p>
        <p className="text-sm mb-5" style={{ color: "var(--text-faint)" }}>
          나이 제한 없이 언제든 꺼내 쓸 수 있는 자산이에요. 조기은퇴의
          핵심이에요.
        </p>

        <p
          className="text-sm font-semibold mb-2.5"
          style={{ color: "var(--text)" }}
        >
          주식 / ETF
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-1.5">
          <SmallField label="월 납입액" unit="만원">
            <NumberInput
              value={form.stockEtfMonthlyContribution}
              onChange={(v) => onChange("stockEtfMonthlyContribution", v)}
              placeholder="예) 50"
              small
              ariaLabel="주식 ETF 월 납입액"
            />
          </SmallField>
          <SmallField label="기대 수익률" unit="%">
            <NumberInput
              value={form.stockEtfReturnRate}
              onChange={(v) => onChange("stockEtfReturnRate", v)}
              placeholder="예) 7"
              allowDecimal
              maxDigits={2}
              small
              ariaLabel="주식 ETF 기대 수익률"
            />
          </SmallField>
        </div>
        <div className="mb-3.5">
          <Hint>모르겠다면 연 7% 정도가 무난해요.</Hint>
        </div>

        <SmallField label="현재 잔액" unit="만원">
          <NumberInput
            value={form.stockEtfCurrentBalance}
            onChange={(v) => onChange("stockEtfCurrentBalance", v)}
            placeholder="예) 3,000"
            small
            ariaLabel="주식 ETF 현재 잔액"
          />
        </SmallField>

        <div
          className="border-t pt-4 mt-4"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-sm font-semibold mb-2.5"
            style={{ color: "var(--text)" }}
          >
            이 투자, ISA 계좌인가요?
          </p>
          <div
            className="flex gap-2 mb-2"
            role="radiogroup"
            aria-label="ISA 계좌 유형"
          >
            <IsaTypeButton
              selected={form.isaType === "NONE"}
              onClick={() => onChange("isaType", "NONE")}
              label="아니요"
            />
            <IsaTypeButton
              selected={form.isaType === "GENERAL"}
              onClick={() => onChange("isaType", "GENERAL")}
              label="일반형"
            />
            <IsaTypeButton
              selected={form.isaType === "SEOMIN"}
              onClick={() => onChange("isaType", "SEOMIN")}
              label="서민형·농어민형"
            />
          </div>
          <Hint>
            은퇴 시점에 그동안의 이익 중 일반형은 200만원, 서민형·농어민형은
            400만원까지 세금이 없고, 초과분도 9.9%만 떼요(일반 양도소득세
            22%보다 낮아요).
          </Hint>
        </div>
      </SectionCard>

      {/* WHY: 검증/서버 에러를 버튼 바로 위, 현재 화면에 즉시 표시한다.
          화면 이동이나 스크롤 없이 무엇이 문제인지 바로 보인다. */}
      {error && <ErrorBanner message={error} />}

      <div className="flex gap-2.5">
        <SecondaryButton onClick={onBack} className="w-[35%]">
          이전
        </SecondaryButton>
        <PrimaryButton
          onClick={onSubmit}
          disabled={submitting}
          loading={submitting}
          className="w-[65%]"
        >
          결과 보기
        </PrimaryButton>
      </div>
    </WizardCard>
  );
}

function IsaTypeButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="flex-1 rounded-xl py-2.5 border-2 transition-all duration-150 text-center px-2"
      style={
        selected
          ? {
              borderColor: "var(--accent)",
              background: "var(--accent-soft)",
              boxShadow: "0 2px 8px rgba(49,130,246,0.15)",
            }
          : { borderColor: "var(--border)", background: "var(--surface)" }
      }
    >
      <span
        className="block text-xs font-semibold"
        style={{ color: selected ? "var(--accent)" : "var(--text)" }}
      >
        {label}
      </span>
    </button>
  );
}
