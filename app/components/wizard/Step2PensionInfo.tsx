// Step2PensionInfo.tsx
// 다크모드: neutral-*/blue-*/white 하드코딩을 디자인 토큰으로 전환
import { PrefilledField, RetirementFormState } from "./types";
import {
  Field,
  Hint,
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
  onNext: () => void;
  onBack: () => void;
  /** D-218: 포트폴리오에서 자동으로 채워진 필드 */
  prefilled: PrefilledField[];
}

export default function Step2PensionInfo({
  form,
  onChange,
  onNext,
  onBack,
  prefilled,
}: Props) {
  return (
    <WizardCard>
      <ProgressBar step={1} total={3} />

      <SectionCard>
        <p
          className="fs-metric font-semibold mb-1"
          style={{ color: "var(--text-strong)" }}
        >
          연금 정보를 입력해주세요
        </p>
        <p className="fs-title mb-5" style={{ color: "var(--text-faint)" }}>
          55세부터 받을 수 있는 연금 자산들이에요.
        </p>

        <Field label="국민연금 납입 기간" unit="년">
          <NumberInput
            value={form.pensionYearsPaid}
            onChange={(v) => onChange("pensionYearsPaid", v)}
            maxDigits={2}
            ariaLabel="국민연금 납입 기간"
            placeholder="9"
          />
        </Field>

        {/* 퇴직연금 */}
        <div
          className="border-t pt-4 mb-4"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="fs-title font-semibold mb-2"
            style={{ color: "var(--text)" }}
          >
            퇴직연금
          </p>
          <div
            className="flex gap-2 mb-3"
            role="radiogroup"
            aria-label="퇴직연금 유형"
          >
            <PensionTypeButton
              selected={form.retirementPensionType === "DB"}
              onClick={() => onChange("retirementPensionType", "DB")}
              label="DB형"
              description="회사가 지급 보장"
            />
            <PensionTypeButton
              selected={form.retirementPensionType === "DC"}
              onClick={() => onChange("retirementPensionType", "DC")}
              label="DC형"
              description="내가 직접 운용"
            />
          </div>

          {form.retirementPensionType === "DB" ? (
            <>
              <Field label="지금까지의 근속연수" unit="년">
                <NumberInput
                  value={form.yearsOfService}
                  onChange={(v) => onChange("yearsOfService", v)}
                  maxDigits={2}
                  ariaLabel="지금까지의 근속연수"
                  placeholder="7"
                />
              </Field>
              <div className="-mt-3">
                <Hint>
                  은퇴 시점 월급 × (지금까지 + 앞으로의) 근속연수로 계산돼요.
                </Hint>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <SmallField label="현재 잔액" unit="만원">
                  <NumberInput
                    value={form.dcCurrentBalance}
                    onChange={(v) => onChange("dcCurrentBalance", v)}
                    small
                    ariaLabel="DC 현재 잔액"
                    placeholder="0"
                  />
                </SmallField>
                <SmallField label="기대 수익률" unit="%">
                  <NumberInput
                    value={form.dcReturnRate}
                    onChange={(v) => onChange("dcReturnRate", v)}
                    allowDecimal
                    maxDigits={2}
                    small
                    ariaLabel="DC 기대 수익률"
                    placeholder="4"
                  />
                </SmallField>
              </div>
              <Hint>
                월 납입액은 회사가 매년 연봉의 1/12를 자동으로 적립해요.
              </Hint>
            </>
          )}
        </div>

        {/* IRP */}
        <PensionProductFields
          title="IRP"
          contributionKey="irpMonthlyContribution"
          rateKey="irpReturnRate"
          balanceKey="irpCurrentBalance"
          hint="월 25만원까지 채우면 세액공제를 최대로 받아요."
          contributionPlaceholder="25"
          ratePlaceholder="6"
          form={form}
          onChange={onChange}
          prefilled={prefilled}
        />

        {/* 연금저축 */}
        <PensionProductFields
          title="연금저축"
          contributionKey="pensionSavingsMonthlyContribution"
          rateKey="pensionSavingsReturnRate"
          balanceKey="pensionSavingsCurrentBalance"
          hint="월 50만원까지 채우면 세액공제를 최대로 받아요."
          contributionPlaceholder="50"
          ratePlaceholder="8"
          form={form}
          onChange={onChange}
          prefilled={prefilled}
          noBorderBottom
        />
      </SectionCard>

      <div className="flex gap-2">
        <SecondaryButton onClick={onBack} className="w-[35%]">
          이전
        </SecondaryButton>
        <PrimaryButton onClick={onNext} className="w-[65%]">
          다음
        </PrimaryButton>
      </div>
    </WizardCard>
  );
}

function PensionTypeButton({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="flex-1 rounded-[var(--r-control)] py-3 border-2 tappable text-left px-3"
      style={
        selected
          ? {
              borderColor: "var(--accent)",
              background: "var(--accent-soft)",
              boxShadow: "var(--shadow-accent)",
            }
          : { borderColor: "var(--border)", background: "var(--surface)" }
      }
    >
      <span
        className="block fs-title font-semibold"
        style={{ color: selected ? "var(--accent)" : "var(--text)" }}
      >
        {label}
      </span>
      {/* --text-faint가 아니라 --text-sub인 이유: 고른 쪽 버튼 배경이 --accent-soft라
          그 위에서 faint는 라이트 4.49 / 다크 3.46으로 AA(4.5)에 못 미친다(실측).
          RetirementAgeCard에서 같은 이유로 이미 한 단계 올려놨던 것과 같은 건이다.
          DB형/DC형은 뜻을 모르면 못 고르는 선택지라, 그 설명이 흐린 쪽이 더 문제다. */}
      <span
        className="block fs-caption mt-1"
        style={{ color: "var(--text-sub)" }}
      >
        {description}
      </span>
    </button>
  );
}

function PensionProductFields({
  title,
  contributionKey,
  rateKey,
  balanceKey,
  hint,
  contributionPlaceholder,
  ratePlaceholder,
  form,
  onChange,
  prefilled,
  noBorderBottom,
}: {
  title: string;
  // PrefilledField(숫자 필드)로 좁힌다 — balanceKey를 그대로 prefilled 조회에 쓰기 때문.
  contributionKey: PrefilledField;
  rateKey: PrefilledField;
  balanceKey: PrefilledField;
  hint: string;
  /** 세액공제 한도를 기준점으로 보여준다. 아래 hint에 적는 값과 반드시 같아야 한다 —
      입력칸과 안내가 다른 숫자를 말하면 어느 쪽이 맞는지 알 수 없다. */
  contributionPlaceholder: string;
  /** 빈 칸으로 두면 실제로 적용되는 기본 수익률. toRequestPayload의 defaultPercent와
      반드시 같아야 한다 — 예전에 빈 칸이 0%로 전송되면서 화면 안내와 정반대 값이
      계산에 들어가던 버그가 있었다(types.ts 주석 참고). 화면에 그 값을 드러내 둔다. */
  ratePlaceholder: string;
  form: RetirementFormState;
  onChange: Props["onChange"];
  prefilled: PrefilledField[];
  noBorderBottom?: boolean;
}) {
  return (
    <div
      className={`border-t pt-4 ${noBorderBottom ? "" : "mb-4"}`}
      style={{ borderColor: "var(--border)" }}
    >
      <p
        className="fs-title font-semibold mb-2"
        style={{ color: "var(--text)" }}
      >
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <SmallField label="월 납입액" unit="만원">
          <NumberInput
            value={form[contributionKey] as number | ""}
            onChange={(v) => onChange(contributionKey, v as never)}
            small
            ariaLabel={`${title} 월 납입액`}
            placeholder={contributionPlaceholder}
          />
        </SmallField>
        <SmallField label="기대 수익률" unit="%">
          <NumberInput
            value={form[rateKey] as number | ""}
            onChange={(v) => onChange(rateKey, v as never)}
            allowDecimal
            maxDigits={2}
            small
            ariaLabel={`${title} 기대 수익률`}
            placeholder={ratePlaceholder}
          />
        </SmallField>
      </div>
      <div className="mb-2">
        <Hint>{hint}</Hint>
      </div>
      <SmallField
        label="기존 잔액"
        unit="만원"
        badge={prefilled.includes(balanceKey) ? <PrefillBadge /> : null}
      >
        <NumberInput
          value={form[balanceKey] as number | ""}
          onChange={(v) => onChange(balanceKey, v as never)}
          small
          ariaLabel={`${title} 기존 잔액`}
          placeholder="0"
        />
      </SmallField>
    </div>
  );
}
