// useDealBasRate.ts — 특정 날짜의 원/달러 매매기준율을 자동 조회한다.
// 해외주식 매수/매도·배당 폼에서 사용자가 환율을 손으로 입력하지 않도록,
// 거래일(또는 지급일)을 기준으로 실제 고시 매매기준율을 백엔드에서 프록시 조회해 채운다.
// D-087 원칙 유지 — 백엔드는 요청 시점에 한국수출입은행 API를 조회만 하고 이력을 저장하지 않는다.
// 비영업일이면 백엔드가 직전 영업일로 역탐색하므로, 반환된 baseDate가 요청한 날짜와 다를 수 있다.
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface DateRateResponse {
  dealBasR: number;
  baseDate: string; // YYYY-MM-DD, 실제 고시 기준일(역탐색 시 요청일과 다름)
}

export function useDealBasRate(dateStr: string, enabled: boolean) {
  const [rate, setRate] = useState<number | null>(null);
  const [baseDate, setBaseDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !dateStr) {
      setRate(null);
      setBaseDate(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .get<DateRateResponse>(`/api/exchange-rates/USD?date=${dateStr}`)
        .then((r) => {
          if (cancelled) return;
          setRate(r.dealBasR);
          setBaseDate(r.baseDate);
        })
        .catch(() => {
          if (cancelled) return;
          // 조회 실패(아주 옛날 날짜 등) — 조용히 degrade, 사용자가 직접 입력
          setRate(null);
          setBaseDate(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dateStr, enabled]);

  return { rate, baseDate, loading };
}
