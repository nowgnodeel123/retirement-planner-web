import type { NextConfig } from "next";

// 실기기 QA(폰에서 맥의 LAN IP로 접속) 시 Next이 HMR 등 dev 리소스 요청을 cross-origin으로
// 보고 기본 차단한다. 막히면 dev 클라이언트가 연결을 복구하려고 페이지를 계속 다시 불러
// 무한 로딩처럼 보인다. LAN IP는 네트워크가 바뀌면 달라지므로 코드에 박지 않고 환경변수로 받는다.
//   DEV_ORIGINS=192.168.0.4 NEXT_PUBLIC_API_URL=http://192.168.0.4:8080 npm run dev -- -H 0.0.0.0
// dev 전용 설정이라 프로덕션 빌드에는 영향이 없다.
const devOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(devOrigins.length > 0 ? { allowedDevOrigins: devOrigins } : {}),
};

export default nextConfig;
