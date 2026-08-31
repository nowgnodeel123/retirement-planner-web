// CategoryBadge.tsx — 자산 카테고리 색상 dot + 라벨. M9 대시보드 도넛차트와 같은 팔레트.
import { AssetCategory, categoryColor, categoryLabel } from "./types";

export function CategoryBadge({
  category,
}: {
  category: AssetCategory;
}) {
  return (
    // 좁은 자리(종목 검색 결과처럼 긴 이름 옆)에서도 "국내주 / 식"으로 쪼개지지 않도록
    // 줄바꿈을 막고 축소 대상에서 뺀다. 라벨이 짧아 폭을 양보할 이유가 없다.
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap flex-shrink-0"
      style={{ color: "var(--text-sub)" }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: categoryColor[category] }}
      />
      {categoryLabel[category]}
    </span>
  );
}
