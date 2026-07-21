// Step1BasicInfo.tsx
import { RetirementFormState } from "./types";
import {
  Field,
  Hint,
  NumberInput,
  PrimaryButton,
  ProgressBar,
  SectionCard,
  WizardCard,
} from "./Ui";

interface Props {
  form: RetirementFormState;
  onChange: <K extends keyof RetirementFormState>(
    key: K,
    value: RetirementFormState[K],
  ) => void;
  onNext: () => void;
}

export default function Step1BasicInfo({ form, onChange, onNext }: Props) {
  return (
    <WizardCard>
      <ProgressBar step={0} total={3} />

      <SectionCard>
        <p
          className="text-lg font-semibold mb-1"
          style={{ color: "var(--text-strong)" }}
        >
          기본 정보를 입력해주세요
        </p>
        <p className="text-sm mb-5" style={{ color: "var(--text-faint)" }}>
          몇 살에 은퇴할 수 있는지 계산의 출발점이 돼요.
        </p>

        <Field label="현재 나이" unit="세">
          <NumberInput
            value={form.currentAge}
            onChange={(v) => onChange("currentAge", v)}
            placeholder="예) 34"
            ariaLabel="현재 나이"
          />
        </Field>

        <Field label="현재 월 소득 (세전)" unit="만원">
          <NumberInput
            value={form.monthlyIncome}
            onChange={(v) => onChange("monthlyIncome", v)}
            placeholder="예) 350"
            ariaLabel="현재 월 소득"
          />
        </Field>
        <div className="-mt-3 mb-4">
          <Hint>44세까지 연 5%, 이후 나이대별로 성장률이 달라져요.</Hint>
        </div>

        <Field label="목표 은퇴 생활비 (월)" unit="만원">
          <NumberInput
            value={form.targetMonthlyExpense}
            onChange={(v) => onChange("targetMonthlyExpense", v)}
            placeholder="예) 300"
            ariaLabel="목표 은퇴 생활비"
          />
        </Field>
        <div className="-mt-3">
          <Hint>오늘 기준 금액이에요. 물가 상승분은 자동으로 반영돼요.</Hint>
        </div>
      </SectionCard>

      <PrimaryButton
        onClick={onNext}
        disabled={
          !form.currentAge || !form.monthlyIncome || !form.targetMonthlyExpense
        }
        className="w-full"
      >
        다음
      </PrimaryButton>
    </WizardCard>
  );
}
