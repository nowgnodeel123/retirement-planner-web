import type { NextConfig } from "next";

// 실기기 QA(폰에서 맥의 LAN IP로 접속) 시 Next이 HMR 등 dev 리소스 요청을 cross-origin으로
// 보고 기본 차단한다(403 Unauthorized). 막히면 dev 클라이언트가 연결을 복구하려고 페이지를
// 계속 다시 불러 "무한 로딩"으로 나타난다.
//
// LAN IP를 코드에 박거나 환경변수로 매번 넘기게 하면, 네트워크가 바뀌거나 명령에서 빠뜨렸을 때
// 같은 무한 로딩이 재발한다(실제로 두 번 겪었다). 그래서 사설 IP 대역 자체를 허용한다 —
// Next의 매칭은 점 단위 세그먼트 비교라 `*` 하나가 한 세그먼트에 대응한다.
// 이건 dev 서버 내부 엔드포인트 전용 허용목록이고 프로덕션 빌드에는 존재하지 않는다.
const PRIVATE_LAN = [
  "192.168.*.*",
  "10.*.*.*",
  // 172.16.0.0 ~ 172.31.255.255 — 범위를 와일드카드로 못 쓰므로 16개를 펼친다.
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
];

// 사설 IP가 아닌 호스트(예: ngrok 도메인)가 필요할 때만 추가로 넘긴다.
const extraOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: [...PRIVATE_LAN, ...extraOrigins],
};

export default nextConfig;
