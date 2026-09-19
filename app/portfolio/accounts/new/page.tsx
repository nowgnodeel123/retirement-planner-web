// app/portfolio/accounts/new/page.tsx — 계좌 등록 화면 (D-028, D-030)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from "@/app/components/wizard/Ui";
import { InstitutionTypeSelector } from "@/app/components/portfolio/InstitutionTypeSelector";
import {
  AccountDetailType,
  AccountResponse,
  detailTypeDescription,
  detailTypeLabel,
  InstitutionType,
} from "@/app/components/portfolio/types";

const DETAIL_TYPES: AccountDetailType[] = [
  "NORMAL",
  "ISA",
  "IRP",
  "PENSION_SAVINGS",
];

export default function NewAccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [institutionType, setInstitutionType] =
    useState<InstitutionType>("SECURITIES");
  const [detailType, setDetailType] = useState<AccountDetailType>("NORMAL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 거래소는 백엔드가 detailType을 무조건 NORMAL로 강제한다(Account.java) — UI도 동일하게 숨김
  const showDetailType = institutionType !== "EXCHANGE";

  async function handleSubmit() {
    if (!name.trim()) {
      setError("계좌 이름을 입력해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.post<AccountResponse>("/api/accounts", {
        name: name.trim(),
        institutionType,
        detailType: showDetailType ? detailType : null,
      });
      router.push(`/portfolio/accounts/${created.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "계좌 등록에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[420px] mx-auto px-5 pt-6">
      <h1 className="fs-metric font-bold mb-6" style={{ color: "var(--text-strong)" }}>
        계좌 등록
      </h1>

      <div
        className="rounded-3xl p-6 border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "0 2px 24px rgba(15,23,42,0.06)",
        }}
      >
        <label className="fs-title font-medium" style={{ color: "var(--text-sub)" }}>
          기관 유형
        </label>
        <div className="mt-2 mb-5">
          <InstitutionTypeSelector
            value={institutionType}
            onChange={setInstitutionType}
          />
        </div>

        <Field label="계좌 이름" unit="">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 미래에셋 주식계좌"
            aria-label="계좌 이름"
            className={inputClass}
            maxLength={50}
          />
        </Field>

        {showDetailType && (
          <div className="mt-4">
            <label className="fs-title font-medium" style={{ color: "var(--text-sub)" }}>
              상세 유형
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {DETAIL_TYPES.map((type) => {
                const active = detailType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDetailType(type)}
                    className={`rounded-xl border py-2 fs-body font-medium transition-all ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-4 ring-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-faint)]"
                    }`}
                    style={{ color: active ? "var(--accent)" : "var(--text-sub)" }}
                  >
                    {detailTypeLabel[type]}
                  </button>
                );
              })}
            </div>
            {/* 고른 유형이 뭔지 바로 아래에 한 줄로 밝힌다.
                ISA·IRP는 풀어쓰지 않으면 뜻을 모르는 약어라, 네 개를 나란히 놓고
                고르라고만 하면 제도를 모르는 사용자는 무엇을 골라야 할지 알 수 없다.
                잘못 고르면 세금·수익 집계까지 달라진다(D-233/D-234). */}
            <p
              className="fs-body mt-2 leading-relaxed"
              style={{ color: "var(--text-sub)" }}
            >
              {detailTypeDescription[detailType]}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <SecondaryButton onClick={() => router.back()} className="flex-[1]">
            취소
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            loading={submitting}
            className="flex-[2]"
          >
            등록
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
