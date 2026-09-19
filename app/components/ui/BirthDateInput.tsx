// BirthDateInput.tsx — 생년월일을 8자리 숫자로 받는 입력칸(예: 19990323).
//
// WHY <input type="date">에서 바꿨나: 모바일에서 달력 피커가 뜨면 1960~90년대까지
// 거슬러 올라가는 데만 수십 번을 넘겨야 하고, 데스크톱에서는 브라우저·OS마다
// 표시 형식(mm/dd/yyyy vs yyyy-mm-dd)이 달라 무엇을 먼저 넣는지가 화면마다 다르다.
// 생년월일은 사용자가 이미 외우고 있는 숫자라 그냥 치게 하는 쪽이 빠르다.
//
// 원래는 회원가입(app/login/page.tsx) 안에만 있었고 프로필 수정 화면은 계속
// type="date"를 쓰고 있었다 — 같은 값을 두 화면에서 다른 방식으로 받고 있었던 셈이라
// 여기로 빼서 한 벌로 맞췄다.
//
// 저장은 계속 ISO(YYYY-MM-DD)다 — 백엔드 LocalDate는 그대로 두고 화면 입력만 바꾼다.
"use client";

export function isValidBirth8(digits: string): boolean {
  if (!/^\d{8}$/.test(digits)) return false;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  // 2월 30일 같은 값을 걸러낸다 — Date가 조용히 3월로 넘겨버리므로 되돌려 비교한다.
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }
  return date <= new Date();
}

/** 8자리 → ISO. 유효하지 않으면 빈 문자열(제출 조건에서 걸린다). */
export function birth8ToIso(digits: string): string {
  if (!isValidBirth8(digits)) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/** ISO(YYYY-MM-DD) → 8자리. 서버에서 받은 값을 입력칸에 되돌릴 때 쓴다. */
export function isoToBirth8(iso: string | null | undefined): string {
  if (!iso) return "";
  const digits = iso.replace(/\D/g, "");
  return digits.length === 8 ? digits : "";
}

export function BirthDateInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
}) {
  // 8자리를 다 치기 전에는 경고를 띄우지 않는다 — 치는 도중에 빨간 글씨가 떠 있으면
  // 잘못 입력한 것처럼 읽힌다.
  const invalid = value.length === 8 && !isValidBirth8(value);

  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        placeholder="생년월일 8자리 (예: 19990323)"
        className={className}
        aria-label="생년월일 8자리"
        autoComplete="bday"
      />
      {invalid && (
        <p className="fs-body text-[var(--error)] mt-2 ml-1">
          생년월일을 다시 확인해주세요.
        </p>
      )}
    </div>
  );
}
