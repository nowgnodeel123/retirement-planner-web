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
  const stroke = active ? "#3B82F6" : "#A3A3A3";
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
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5 12 8l3.5 6.5" />
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
            className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3.5 transition-all
              ${
                active
                  ? "border-blue-400 bg-blue-50/60 ring-4 ring-blue-500/10"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
          >
            <InstitutionIcon type={type} active={active} />
            <span
              className={`text-[13px] font-medium ${
                active ? "text-blue-600" : "text-neutral-500"
              }`}
            >
              {institutionLabel[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
