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
  fxHint,
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
  // 거래일 기준 매매기준율을 자동으로 채웠을 때 그 근거를 안내하는 문구(선택)
  fxHint?: string | null;
  tradeDate: string;
  onTradeDateChange: (v: string) => void;
}) {
  return (
    <>
      {/* Field의 <label>은 htmlFor로 묶여 있지 않아 접근성 이름이 되지 못한다.
          placeholder는 "0"이라 스크린리더가 칸 이름을 "0"으로 읽는다 — 라벨 문구를
          그대로 ariaLabel로 넘겨 눈에 보이는 이름과 읽히는 이름을 맞춘다. */}
      {/* 수량은 소수 6자리까지 받는다 — 코인은 0.001 BTC처럼 잘게 쪼개 사고,
          해외주식도 소수점 매수가 있다. NumberInput 기본값 2자리로는 이런 수량을
          아예 입력할 수 없었다(0.000001을 넣으면 0.00으로 잘려 "수량을 입력해주세요"가 떴다).
          6자리인 이유: DB가 NUMERIC(20,8), 백엔드 검증이 @DecimalMin("0.00000001")이라
          8자리까지 수용하지만, 정수부 12자리와 합치면 double 유효자릿수(약 15~17)를
          넘겨 값이 미세하게 바뀔 수 있다. 업비트 주문 수량 정밀도(8자리)보다 보수적이되
          실사용 수량을 담기에 충분한 지점으로 6자리를 잡았다. */}
      <Field label={quantityLabel} unit={quantityUnit}>
        <NumberInput
          value={quantity}
          onChange={onQuantityChange}
          allowDecimal
          placeholder="0"
          maxDigits={12}
          decimalPlaces={6}
          ariaLabel={quantityLabel}
        />
      </Field>
      {/* 단가에도 수량과 같은 자릿수를 준다 — NumberInput 기본값 7자리면 9,999,999원에서
          잘려서 비트코인(1억 안팎)처럼 단가가 큰 종목을 아예 입력할 수 없다. */}
      <Field label={priceLabel} unit={isForeign ? "USD" : "원"}>
        <NumberInput
          value={unitPrice}
          onChange={onUnitPriceChange}
          allowDecimal
          placeholder="0"
          maxDigits={12}
          ariaLabel={priceLabel}
        />
      </Field>
      {isForeign && (
        <Field label={fxLabel} unit="원">
          <NumberInput
            value={fx}
            onChange={onFxChange}
            allowDecimal
            placeholder="1,350.00"
            ariaLabel={fxLabel}
          />
        </Field>
      )}
      {isForeign && fxHint && (
        <p
          className="fs-body -mt-3 mb-4"
          style={{ color: "var(--text-faint)" }}
        >
          {fxHint}
        </p>
      )}
      <div className="mb-1">
        <label
          className="fs-title font-medium"
          style={{ color: "var(--text-sub)" }}
        >
          거래일
        </label>
        <input
          type="date"
          value={tradeDate}
          max={todayString()}
          onChange={(e) => onTradeDateChange(e.target.value)}
          aria-label="거래일"
          className="w-full rounded-xl border px-3 py-3 min-h-[44px] fs-input mt-2"
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
