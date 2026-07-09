// Step2PensionInfo.tsx
import { RetirementFormState } from "./types";
import {
  Field,
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
  onNext: () => void;
  onBack: () => void;
}

export default function Step2PensionInfo({
  form,
  onChange,
  onNext,
  onBack,
}: Props) {
  return (
    <WizardCard>
      <ProgressBar step={1} total={3} />

      <SectionCard>
        <p className="text-lg font-semibold text-neutral-800 mb-1">
          연금 정보를 입력해주세요
        </p>
        <p className="text-sm text-neutral-400 mb-5">
          55세부터 받을 수 있는 연금 자산들이에요.
        </p>

        <Field label="국민연금 납입 기간" unit="년">
          <NumberInput
            value={form.pensionYearsPaid}
            onChange={(v) => onChange("pensionYearsPaid", v)}
            placeholder="예) 6"
            maxDigits={2}
            ariaLabel="국민연금 납입 기간"
          />
        </Field>

        {/* 퇴직연금 */}
        <div className="border-t border-neutral-200/70 pt-4 mb-4">
          <p className="text-sm font-semibold text-neutral-700 mb-2.5">
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
                  placeholder="예) 3"
                  maxDigits={2}
                  ariaLabel="지금까지의 근속연수"
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
              <div className="grid grid-cols-2 gap-2.5 mb-1.5">
                <SmallField label="현재 잔액" unit="만원">
                  <NumberInput
                    value={form.dcCurrentBalance}
                    onChange={(v) => onChange("dcCurrentBalance", v)}
                    placeholder="예) 1,000"
                    small
                    ariaLabel="DC 현재 잔액"
                  />
                </SmallField>
                <SmallField label="기대 수익률" unit="%">
                  <NumberInput
                    value={form.dcReturnRate}
                    onChange={(v) => onChange("dcReturnRate", v)}
                    placeholder="예) 4"
                    allowDecimal
                    maxDigits={2}
                    small
                    ariaLabel="DC 기대 수익률"
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
          contributionPlaceholder="예) 25"
          form={form}
          onChange={onChange}
        />

        {/* 연금저축 */}
        <PensionProductFields
          title="연금저축"
          contributionKey="pensionSavingsMonthlyContribution"
          rateKey="pensionSavingsReturnRate"
          balanceKey="pensionSavingsCurrentBalance"
          hint="월 50만원까지 채우면 세액공제를 최대로 받아요."
          contributionPlaceholder="예) 50"
          form={form}
          onChange={onChange}
          noBorderBottom
        />
      </SectionCard>

      <div className="flex gap-2.5">
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
      className={`flex-1 rounded-xl py-2.5 border-2 transition-all duration-150 text-left px-3.5 ${
        selected
          ? "border-blue-500 bg-blue-50/60 shadow-[0_2px_8px_rgba(59,130,246,0.15)]"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      <span
        className={`block text-sm font-semibold ${
          selected ? "text-blue-600" : "text-neutral-600"
        }`}
      >
        {label}
      </span>
      <span className="block text-[11px] text-neutral-400 mt-0.5">
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
  form,
  onChange,
  noBorderBottom,
}: {
  title: string;
  contributionKey: keyof RetirementFormState;
  rateKey: keyof RetirementFormState;
  balanceKey: keyof RetirementFormState;
  hint: string;
  contributionPlaceholder: string;
  form: RetirementFormState;
  onChange: Props["onChange"];
  noBorderBottom?: boolean;
}) {
  return (
    <div
      className={`border-t border-neutral-200/70 pt-4 ${noBorderBottom ? "" : "mb-4"}`}
    >
      <p className="text-sm font-semibold text-neutral-700 mb-2.5">{title}</p>
      <div className="grid grid-cols-2 gap-2.5 mb-1.5">
        <SmallField label="월 납입액" unit="만원">
          <NumberInput
            value={form[contributionKey] as number | ""}
            onChange={(v) => onChange(contributionKey, v as never)}
            placeholder={contributionPlaceholder}
            small
            ariaLabel={`${title} 월 납입액`}
          />
        </SmallField>
        <SmallField label="기대 수익률" unit="%">
          <NumberInput
            value={form[rateKey] as number | ""}
            onChange={(v) => onChange(rateKey, v as never)}
            placeholder="예) 5"
            allowDecimal
            maxDigits={2}
            small
            ariaLabel={`${title} 기대 수익률`}
          />
        </SmallField>
      </div>
      <div className="mb-2.5">
        <Hint>{hint}</Hint>
      </div>
      <SmallField label="기존 잔액" unit="만원">
        <NumberInput
          value={form[balanceKey] as number | ""}
          onChange={(v) => onChange(balanceKey, v as never)}
          placeholder="예) 1,000"
          small
          ariaLabel={`${title} 기존 잔액`}
        />
      </SmallField>
    </div>
  );
}
