import { SharedState } from "./sharedState";

// ── JSONBin.io Configuration ──────────────────────────────────
// Uses an Access Key (not Master Key) for read+write on this bin.
// The Access Key must have read+write permissions for the bin below.
const JSONBIN_BIN_ID = "69d431aa856a682189069ad9";
const JSONBIN_ACCESS_KEY = "$2a$10$ed/GSEcQ9II7twI3mk1Rv.3nTE/uuPaa6gewc5SggdWgoMg2zJQOG";
const JSONBIN_API = "https://api.jsonbin.io/v3";

export function isJsonBinConfigured(): boolean {
  return JSONBIN_BIN_ID.length > 0 && JSONBIN_ACCESS_KEY.length > 0;
}

// ── Module-level cache ─────────────────────────────────────────
//
// The first call to fetchSharedState kicks off a network request and
// every concurrent / subsequent caller shares the same Promise. The
// resolved value is cached so repeat reads are free. This lets the
// layout preload the gallery on first page load — by the time the user
// clicks the Gallery tab, the data is already in memory.
//
// Writes invalidate the cache: prefetchSharedState() / fetchSharedState()
// will hit the network again on the next call after an update.
let cached: SharedState | null = null;
let pending: Promise<SharedState> | null = null;

async function doFetch(): Promise<SharedState> {
  if (!isJsonBinConfigured()) return { designs: [] };

  const res = await fetch(`${JSONBIN_API}/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Access-Key": JSONBIN_ACCESS_KEY },
  });
  if (!res.ok) throw new Error(`JSONBin read failed: ${res.status}`);
  const json = await res.json();
  return json.record as SharedState;
}

export function fetchSharedState(): Promise<SharedState> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = doFetch()
    .then((state) => {
      cached = state;
      pending = null;
      return state;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });
  return pending;
}

/**
 * Kick off the fetch in the background without awaiting it. Safe to
 * call from a layout client component on first mount; subsequent
 * fetchSharedState() calls will resolve immediately from the cache.
 */
export function prefetchSharedState(): void {
  if (cached || pending) return;
  fetchSharedState().catch(() => {});
}

/**
 * Synchronous accessor for the cached state. Returns null if no fetch
 * has resolved yet. Used by components that want to skip a loading
 * spinner when the data is already in memory.
 */
export function getCachedSharedState(): SharedState | null {
  return cached;
}

export async function updateSharedState(state: SharedState): Promise<void> {
  if (!isJsonBinConfigured()) return;

  const res = await fetch(`${JSONBIN_API}/b/${JSONBIN_BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Key": JSONBIN_ACCESS_KEY,
    },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`JSONBin write failed: ${res.status}`);

  // Update the cache so subsequent reads see the new state immediately
  // without re-fetching.
  cached = state;
  pending = null;
}
