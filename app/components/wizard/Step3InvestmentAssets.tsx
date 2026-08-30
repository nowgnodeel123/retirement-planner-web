// Step3InvestmentAssets.tsx
import { PrefilledField, RetirementFormState } from "./types";
import {
  ErrorBanner,
  Hint,
  NoticeBanner,
  NumberInput,
  PrefillBadge,
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
  /** D-218: 포트폴리오에서 자동으로 채워진 필드 */
  prefilled: PrefilledField[];
  /** D-218: 프리필 금액이 실제보다 작을 수 있는 사유(시세 미조회·현금 제외). 없으면 null */
  prefillNotice: string | null;
}

export default function Step3InvestmentAssets({
  form,
  onChange,
  onSubmit,
  onBack,
  submitting,
  error,
  prefilled,
  prefillNotice,
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

        <SmallField
          label="현재 잔액"
          unit="만원"
          badge={
            prefilled.includes("stockEtfCurrentBalance") ? <PrefillBadge /> : null
          }
        >
          <NumberInput
            value={form.stockEtfCurrentBalance}
            onChange={(v) => onChange("stockEtfCurrentBalance", v)}
            placeholder="예) 3,000"
            small
            ariaLabel="주식 ETF 현재 잔액"
          />
        </SmallField>
      </SectionCard>

      {/* D-218: 프리필이 실제 자산보다 적게 잡혔을 수 있다는 안내.
          금액 입력 바로 아래·제출 버튼 위에 둬서 지금 바로 고칠 수 있게 한다. */}
      {prefillNotice && <NoticeBanner>{prefillNotice}</NoticeBanner>}

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
