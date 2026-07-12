// DevTokenGate.tsx
// WHY: M12(로그인배선) 전까지 포트폴리오 화면을 실제 API로 테스트하려면 JWT가 있어야 한다.
// 카카오 로그인 성공 후 리다이렉트 주소창에 노출되는 accessToken을 붙여넣게 하는
// 임시 게이트. M12에서 실제 로그인 화면으로 대체되면 이 컴포넌트는 삭제한다.
"use client";

import { useState } from "react";
import { setToken, useDevToken } from "@/lib/devAuth";
import {
  inputClass,
  PrimaryButton,
  WizardCard,
} from "@/app/components/wizard/Ui";

export default function DevTokenGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useDevToken();
  const [input, setInput] = useState("");

  if (!token) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16">
        <WizardCard>
          <p className="text-[15px] font-semibold text-neutral-800 mb-1.5">
            로그인이 필요해요
          </p>
          <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
            정식 로그인 화면은 준비 중이에요. 지금은 카카오 로그인 후 발급된
            토큰을 붙여넣어 확인해주세요.
          </p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="accessToken 값을 붙여넣으세요"
            rows={3}
            className={`${inputClass} resize-none text-xs font-mono`}
          />
          <div className="mt-3">
            <PrimaryButton
              onClick={() => {
                const trimmed = input.trim();
                if (!trimmed) return;
                setToken(trimmed);
              }}
              disabled={!input.trim()}
              className="w-full"
            >
              저장하고 계속하기
            </PrimaryButton>
          </div>
        </WizardCard>
      </div>
    );
  }

  return <>{children}</>;
}
