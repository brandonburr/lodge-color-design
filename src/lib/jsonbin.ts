import { SharedState } from "./sharedState";

// ── JSONBin.io Configuration ──────────────────────────────────
// 1. Sign up free at https://jsonbin.io
// 2. Copy your X-Master-Key from Settings → API Keys
// 3. Create a bin with initial content: { "designs": [] }
// 4. Paste the bin ID and master key below
const JSONBIN_BIN_ID = "";      // e.g. "665a1b2c3d4e5f6a7b8c9d0e"
const JSONBIN_MASTER_KEY = "";  // e.g. "$2a$10$..."
const JSONBIN_API = "https://api.jsonbin.io/v3";

export function isJsonBinConfigured(): boolean {
  return JSONBIN_BIN_ID.length > 0 && JSONBIN_MASTER_KEY.length > 0;
}

export async function fetchSharedState(): Promise<SharedState> {
  if (!isJsonBinConfigured()) return { designs: [] };

  const res = await fetch(`${JSONBIN_API}/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Master-Key": JSONBIN_MASTER_KEY },
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
      "X-Master-Key": JSONBIN_MASTER_KEY,
    },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`JSONBin write failed: ${res.status}`);
}
