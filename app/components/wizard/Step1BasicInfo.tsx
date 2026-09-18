// Step1BasicInfo.tsx
import { PrefilledField, RetirementFormState } from "./types";
import {
  Field,
  Hint,
  InfoBanner,
  PrefillBadge,
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
  /** D-218: 포트폴리오/프로필에서 자동으로 채워진 필드 */
  prefilled: PrefilledField[];
  /** 지난번 시뮬레이션 입력을 되불러왔는지 — 안내 한 줄을 띄운다. */
  restoredFromSaved: boolean;
}

export default function Step1BasicInfo({
  form,
  onChange,
  onNext,
  prefilled,
  restoredFromSaved,
}: Props) {
  return (
    <WizardCard>
      <ProgressBar step={0} total={3} />

      <SectionCard>
        <p
          className="fs-metric font-semibold mb-1"
          style={{ color: "var(--text-strong)" }}
        >
          기본 정보를 입력해주세요
        </p>
        <p className="fs-title mb-5" style={{ color: "var(--text-faint)" }}>
          몇 살에 은퇴할 수 있는지 계산의 출발점이 돼요.
        </p>

        {/* 값이 이미 채워져 있는 이유를 밝힌다 — 안 밝히면 "내가 입력한 적 없는 숫자"가
            떠 있는 것으로 읽혀서, 맞는 값인지 확인하지 않고 그냥 넘어가게 된다. */}
        {restoredFromSaved && (
          <div className="mb-5">
            <InfoBanner>
              지난번에 입력한 내용을 불러왔어요. 바뀐 게 있으면 고쳐주세요.
            </InfoBanner>
          </div>
        )}

        <Field
          label="만 나이"
          unit="세"
          badge={prefilled.includes("currentAge") ? <PrefillBadge /> : null}
        >
          <NumberInput
            value={form.currentAge}
            onChange={(v) => onChange("currentAge", v)}
            ariaLabel="만 나이"
            placeholder="34"
          />
        </Field>

        <Field
          label="연봉 (세전)"
          unit="만원"
          badge={prefilled.includes("annualIncome") ? <PrefillBadge /> : null}
        >
          <NumberInput
            value={form.annualIncome}
            onChange={(v) => onChange("annualIncome", v)}
            ariaLabel="연봉 세전"
            placeholder="4000"
            maxDigits={6}
          />
        </Field>
        <div className="-mt-3 mb-4">
          {/* 출처를 밝히지 않으면 "평균 420"이 어디서 온 숫자인지 알 수 없다 —
              이 프로젝트에서 반복된 결함이 "화면이 계산 전제를 안 밝힌다"였다. */}
          <Hint>
            44세까지 연 5%, 이후 나이대별로 성장률이 달라져요.
            <br />
            참고: 상용근로자 평균 연봉은 약 5,000만원이에요(고용노동부, 2025 상반기).
          </Hint>
        </div>

        <Field
          label="목표 은퇴 생활비 (월)"
          unit="만원"
          badge={
            prefilled.includes("targetMonthlyExpense") ? <PrefillBadge /> : null
          }
        >
          <NumberInput
            value={form.targetMonthlyExpense}
            onChange={(v) => onChange("targetMonthlyExpense", v)}
            ariaLabel="목표 은퇴 생활비"
            placeholder="300"
          />
        </Field>
        <div className="-mt-3">
          {/* 사용자가 가장 감이 안 잡는 칸이라 기준점이 특히 중요하다.
              개인/부부 둘 다 적어야 한다 — 198만 보여주면 부부 가구가 절반으로 잡는다. */}
          <Hint>
            오늘 기준 금액이에요. 물가 상승분은 자동으로 반영돼요.
            <br />
            참고: 적정 노후생활비는 개인 월 198만원 · 부부 298만원이에요(국민연금연구원, 2024).
          </Hint>
        </div>
      </SectionCard>

      <PrimaryButton
        onClick={onNext}
        disabled={
          !form.currentAge || !form.annualIncome || !form.targetMonthlyExpense
        }
        className="w-full"
      >
        다음
      </PrimaryButton>
    </WizardCard>
  );
}
