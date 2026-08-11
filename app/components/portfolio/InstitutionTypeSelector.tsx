// InstitutionTypeSelector.tsx — 계좌 등록 시 은행/증권사/거래소 세그먼트 선택
import { InstitutionType, institutionLabel } from "./types";

const ORDER: InstitutionType[] = ["BANK", "SECURITIES", "EXCHANGE"];

function InstitutionIcon({
  type,
  active,
}: {
  type: InstitutionType;
  active: boolean;
}) {
  const stroke = active ? "var(--accent)" : "var(--text-faint)";
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "BANK") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5 10.5V19M9.5 10.5V19M14.5 10.5V19M19 10.5V19" />
        <path d="M3.5 19h17" />
      </svg>
    );
  }
  if (type === "SECURITIES") {
    return (
      <svg {...common}>
        <path d="M4 19V9M9.5 19V5M15 19v-7M20 19V11" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M7 4v16M7 4h6.5a3.5 3.5 0 0 1 0 7H7m0 0h7a3.5 3.5 0 0 1 0 7H7" />
      <path d="M10 3v2.5M13 3v2.5M10 18.5V21M13 18.5V21" />
    </svg>
  );
}

export function InstitutionTypeSelector({
  value,
  onChange,
}: {
  value: InstitutionType;
  onChange: (v: InstitutionType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ORDER.map((type) => {
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3.5 transition-all ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-4 ring-[var(--accent)]/10"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-faint)]"
            }`}
          >
            <InstitutionIcon type={type} active={active} />
            <span
              className="text-[13px] font-medium"
              style={{ color: active ? "var(--accent)" : "var(--text-sub)" }}
            >
              {institutionLabel[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
