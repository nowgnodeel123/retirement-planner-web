// lib/cache.ts — 화면 간 이동에서 같은 조회를 반복하지 않기 위한 메모리 캐시.
//
// WHY: 포트폴리오 ↔ 계좌 상세를 오갈 때마다 총자산·자산목록을 처음부터 다시 받았다.
// 화면 전환 때마다 서버가 DB와 외부 시세를 다시 때리므로, 사용자가 늘면 그대로 비용이 된다.
//
// 설계 원칙 — **무효화 실수가 원천적으로 불가능하게 만든다.**
// 이 앱은 돈을 다루므로 "자산을 추가했는데 총자산이 옛 값"이 느린 것보다 나쁘다.
// 그래서 어떤 변경(POST/PATCH/DELETE)이든 캐시를 **통째로** 비운다. 매수 하나가
// 자산목록·총자산·수익·세금·시뮬레이터 프리필을 전부 바꾸기 때문에, 어느 키를 지울지
// 고르는 순간 빠뜨릴 여지가 생긴다. 변경은 조회보다 훨씬 드물어 비용도 사실상 없다.
//
// TTL은 서버의 시세 캐시(60초)보다 짧게 잡는다. 30초 안에 다시 물어도 서버는 어차피
// 같은 시세를 돌려주므로, 이 캐시가 서버 대비 새로 만들어내는 낡음은 없다.

type Entry = { data: unknown; at: number };

const TTL_MS = 30_000;
// 종목 검색처럼 질의마다 키가 달라지는 조회가 캐시를 무한정 키우지 않도록 상한을 둔다.
const MAX_ENTRIES = 50;

const cache = new Map<string, Entry>();

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (Date.now() - entry.at > TTL_MS) {
    cache.delete(key);
    return undefined;
  }

  // 최근 사용을 뒤로 보내 오래된 것부터 밀려나게 한다(간이 LRU).
  cache.delete(key);
  cache.set(key, entry);
  return entry.data as T;
}

export function setCached(key: string, data: unknown) {
  cache.delete(key);
  cache.set(key, { data, at: Date.now() });

  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * 변경이 일어났거나 로그인 상태가 바뀌면 전부 버린다.
 * 로그아웃 시 비우는 건 성능이 아니라 프라이버시 문제다 — 같은 브라우저에서 다른 계정으로
 * 로그인했을 때 앞 사람의 잔액이 잠깐이라도 보이면 안 된다.
 */
export function clearCache() {
  cache.clear();
}

// ── 진행 중 요청 합치기 ─────────────────────────────────────────────
// 캐시는 "응답이 도착한 뒤"에만 듣는다. 같은 조회가 동시에 두 번 출발하면 둘 다 네트워크로
// 나가고, 캐시는 아무것도 막지 못한다. 실제로 개발 모드(StrictMode 이펙트 2회 실행)에서
// 모든 조회가 정확히 2번씩 나가는 것이 측정으로 확인됐다.
// 같은 키의 요청이 이미 떠 있으면 그 Promise를 함께 기다리게 해서 한 번으로 합친다.
const inFlight = new Map<string, Promise<unknown>>();

export function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = run().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
