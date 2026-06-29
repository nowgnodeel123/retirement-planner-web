"use client";

import { useState } from "react";

interface SimulationResult {
  summary: {
    totalMonthlyIncome: number;
    targetMonthlyExpense: number;
    monthlyShortfall: number;
    estimatedRetirementAge: number;
    message: string;
    shareMessage: string;
  };
  breakdown: {
    nationalPension: number;
    retirementPension: number;
    irp: number;
  };
  meta: {
    yearsUntilRetirement: number;
    totalPensionYears: number;
  };
}

export default function Home() {
  const [form, setForm] = useState({
    currentAge: 28,
    retirementAge: 60,
    monthlyIncome: 300,
    pensionYearsPaid: 6,
    monthlyIrpContribution: 30,
    targetMonthlyExpense: 300,
    irpReturnRate: 0.05,
    pensionReturnRate: 0.04,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/simulation/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("서버 연결 실패. Spring Boot가 실행 중인지 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏦 은퇴 플래너
          </h1>
          <p className="text-gray-500">나는 몇 살에 은퇴할 수 있을까?</p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-4">
          {[
            { label: "현재 나이", name: "currentAge", unit: "세" },
            { label: "목표 은퇴 나이", name: "retirementAge", unit: "세" },
            { label: "현재 월 소득", name: "monthlyIncome", unit: "만원" },
            {
              label: "국민연금 납입 기간",
              name: "pensionYearsPaid",
              unit: "년",
            },
            {
              label: "월 IRP 납입액",
              name: "monthlyIrpContribution",
              unit: "만원",
            },
            {
              label: "목표 은퇴 생활비",
              name: "targetMonthlyExpense",
              unit: "만원/월",
            },
          ].map(({ label, name, unit }) => (
            <div key={name} className="flex items-center justify-between">
              <label className="text-sm text-gray-600 w-40">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  className="w-24 text-right border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400 w-12">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 계산 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-colors disabled:opacity-50"
        >
          {loading ? "계산 중..." : "은퇴 나이 계산하기"}
        </button>

        {/* 결과 */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* 핵심 결과 */}
            <div className="bg-blue-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm opacity-80 mb-1">예상 은퇴 가능 나이</p>
              <p className="text-6xl font-bold mb-1">
                {result.summary.estimatedRetirementAge}
                <span className="text-2xl">세</span>
              </p>
              <p className="text-sm opacity-80">
                {result.meta.yearsUntilRetirement}년 후
              </p>
            </div>

            {/* 소득 분석 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
              <h2 className="font-semibold text-gray-800 mb-4">
                월 예상 은퇴 소득
              </h2>
              {[
                { label: "국민연금", value: result.breakdown.nationalPension },
                {
                  label: "퇴직연금",
                  value: result.breakdown.retirementPension,
                },
                { label: "IRP", value: result.breakdown.irp },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{value}만원</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>합계</span>
                <span>{result.summary.totalMonthlyIncome}만원</span>
              </div>
              <div
                className={`flex justify-between text-sm font-medium ${result.summary.monthlyShortfall >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                <span>목표 대비</span>
                <span>
                  {result.summary.monthlyShortfall >= 0 ? "+" : ""}
                  {result.summary.monthlyShortfall}만원
                </span>
              </div>
            </div>

            {/* 메시지 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                {result.summary.message}
              </p>
            </div>

            {/* 공유 버튼 */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.summary.shareMessage);
                alert("클립보드에 복사됐습니다!");
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-4 rounded-2xl transition-colors"
            >
              친구에게 공유하기 🔗
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
