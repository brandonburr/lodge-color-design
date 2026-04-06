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

export async function fetchSharedState(): Promise<SharedState> {
  if (!isJsonBinConfigured()) return { designs: [] };

  const res = await fetch(`${JSONBIN_API}/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Access-Key": JSONBIN_ACCESS_KEY },
  });
  if (!res.ok) throw new Error(`JSONBin read failed: ${res.status}`);
  const json = await res.json();
  return json.record as SharedState;
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
}
