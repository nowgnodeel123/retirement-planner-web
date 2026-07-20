// CategoryBadge.tsx — 자산 카테고리 색상 dot + 라벨. M9 대시보드 도넛차트와 같은 팔레트.
import { categoryColor, categoryLabel, TradableAssetCategory } from "./types";

export function CategoryBadge({
  category,
}: {
  category: TradableAssetCategory;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-medium"
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
