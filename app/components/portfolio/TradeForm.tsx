// app/components/portfolio/TradeForm.tsx
// D-051/D-147/D-153: 매수/매도 폼의 quantity/unitPrice/fx/tradeDate 4필드가 자산 상세 화면
// (매수·매도)과 자산 등록 화면(최초 매수) 세 군데에서 거의 동일하게 복제되고 있던 것을 통합.
// TradeAmountFields = 4필드만(자산 등록 화면처럼 카테고리·종목검색 등 다른 UI와 한 카드를 공유할 때).
// TradeForm = TradeAmountFields를 카드+에러배너+제출버튼으로 감싼 완결형(자산 상세 화면의
// 매수/매도처럼 그 자체로 카드 하나를 이루는 경우).
import {
  ErrorBanner,
  Field,
  PrimaryButton,
  NumberInput,
} from "@/app/components/wizard/Ui";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function TradeAmountFields({
  quantityLabel,
  quantity,
  onQuantityChange,
  quantityUnit,
  priceLabel,
  unitPrice,
  onUnitPriceChange,
  isForeign,
  fxLabel,
  fx,
  onFxChange,
  tradeDate,
  onTradeDateChange,
}: {
  quantityLabel: string;
  quantity: number | "";
  onQuantityChange: (v: number | "") => void;
  quantityUnit: string;
  priceLabel: string;
  unitPrice: number | "";
  onUnitPriceChange: (v: number | "") => void;
  isForeign: boolean;
  fxLabel: string;
  fx: number | "";
  onFxChange: (v: number | "") => void;
  tradeDate: string;
  onTradeDateChange: (v: string) => void;
}) {
  return (
    <>
      <Field label={quantityLabel} unit={quantityUnit}>
        <NumberInput
          value={quantity}
          onChange={onQuantityChange}
          allowDecimal
          placeholder="0"
          maxDigits={12}
        />
      </Field>
      <Field label={priceLabel} unit={isForeign ? "USD" : "원"}>
        <NumberInput
          value={unitPrice}
          onChange={onUnitPriceChange}
          allowDecimal
          placeholder="0"
        />
      </Field>
      {isForeign && (
        <Field label={fxLabel} unit="원">
          <NumberInput
            value={fx}
            onChange={onFxChange}
            allowDecimal
            placeholder="1,350.00"
          />
        </Field>
      )}
      <div className="mb-1">
        <label
          className="text-sm font-medium"
          style={{ color: "var(--text-sub)" }}
        >
          거래일
        </label>
        <input
          type="date"
          value={tradeDate}
          max={todayString()}
          onChange={(e) => onTradeDateChange(e.target.value)}
          className="w-full rounded-xl border px-3.5 py-3 text-base mt-1.5"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text-strong)",
          }}
        />
      </div>
    </>
  );
}

export function TradeForm(
  props: Parameters<typeof TradeAmountFields>[0] & {
    formError: string | null;
    submitting: boolean;
    submitLabel: string;
    onSubmit: () => void;
  },
) {
  const { formError, submitting, submitLabel, onSubmit, ...fieldProps } = props;
  return (
    <div className="mb-6 card px-4 py-4">
      <TradeAmountFields {...fieldProps} />

      {formError && (
        <div className="mt-4">
          <ErrorBanner message={formError} />
        </div>
      )}

      <div className="mt-5">
        <PrimaryButton onClick={onSubmit} loading={submitting} className="w-full">
          {submitLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}
