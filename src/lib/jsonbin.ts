import { SharedState } from "./sharedState";

// ── JSONBin.io Configuration ──────────────────────────────────
// 1. Sign up free at https://jsonbin.io
// 2. Copy your X-Master-Key from Settings → API Keys
// 3. Create a bin with initial content: { "designs": [] }
// 4. Paste the bin ID and master key below
const JSONBIN_BIN_ID = "69d431aa856a682189069ad9";
const JSONBIN_MASTER_KEY = "69d43234aaba882197cedc9b";
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
