"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ColorSelection,
  BuildingRegion,
  DEFAULT_COLORS,
  MCBI_COLORS,
} from "@/lib/colors";
import { getUsername, setUsername as persistUsername } from "@/lib/storage";
import { SharedDesign } from "@/lib/sharedState";
import { fetchSharedState, updateSharedState, isJsonBinConfigured } from "@/lib/jsonbin";
import BuildingImage from "./BuildingImage";
import ColorPicker from "./ColorPicker";
import UsernameModal from "./UsernameModal";

export default function Visualizer() {
  const searchParams = useSearchParams();

  const [colors, setColors] = useState<ColorSelection>(() => {
    const roof = searchParams.get("roof") || DEFAULT_COLORS.roof;
    const walls = searchParams.get("walls") || DEFAULT_COLORS.walls;
    const trim = searchParams.get("trim") || DEFAULT_COLORS.trim;
    return { roof, walls, trim };
  });

  // Username (required, persisted to localStorage). null = still loading
  // from localStorage on first client render. Empty string = loaded but not
  // set yet, so the modal needs to show. Non-empty = ready.
  const [username, setUsernameState] = useState<string | null>(null);
  const [savingToGallery, setSavingToGallery] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const configured = isJsonBinConfigured();

  // Load username from localStorage on mount. One-time read of client-only
  // state — cascading-render concern doesn't apply to a single setState on
  // mount.
  useEffect(() => {
    setUsernameState(getUsername());
  }, []);

  // Update URL when colors change (use history API directly to avoid
  // triggering the Next.js router, which re-suspends useSearchParams).
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("roof", colors.roof);
    params.set("walls", colors.walls);
    params.set("trim", colors.trim);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  }, [colors]);

  const regionHandlers = useMemo(
    () => ({
      roof: (hex: string) => setColors((prev) => ({ ...prev, roof: hex })),
      walls: (hex: string) => setColors((prev) => ({ ...prev, walls: hex })),
      trim: (hex: string) => setColors((prev) => ({ ...prev, trim: hex })),
    }),
    [],
  );

  // ── Username handlers ──────────────────────────────────────

  const handleSetUsername = useCallback((name: string) => {
    setUsernameState(name);
    persistUsername(name);
  }, []);

  const handleChangeName = useCallback(() => {
    setUsernameState("");
    persistUsername("");
  }, []);

  // ── Gallery save ───────────────────────────────────────────

  const handleSaveToGallery = useCallback(async () => {
    if (!username || !configured || savingToGallery) return;
    setSavingToGallery(true);
    try {
      const state = await fetchSharedState();
      const newDesign: SharedDesign = {
        id: crypto.randomUUID(),
        colors: { ...colors },
        createdBy: username,
        createdAt: Date.now(),
        thumbsUp: [],
        comments: [],
      };
      state.designs.push(newDesign);
      await updateSharedState(state);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      // silent fail – JSONBin may be unavailable
    } finally {
      setSavingToGallery(false);
    }
  }, [username, colors, configured, savingToGallery]);

  const regionLabel = (r: BuildingRegion) => {
    const labels: Record<BuildingRegion, string> = {
      roof: "Roof",
      walls: "Walls",
      trim: "Trim",
    };
    return labels[r];
  };

  // First-visit modal: blocks the UI until a name is set. Shown when the
  // username has been loaded from localStorage AND it is empty.
  const showUsernameModal = username === "";

  return (
    <>
      {showUsernameModal && <UsernameModal onSubmit={handleSetUsername} />}

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6">
        {/* Building Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-gradient-to-b from-sky-100 to-sky-50 rounded-xl p-4 sm:p-8 flex items-center justify-center shadow-inner">
            <BuildingImage colors={colors} />
          </div>

          {/* Color summary bar */}
          <div className="flex items-center gap-3 mt-4 p-3 bg-white rounded-lg border border-gray-200">
            {(["roof", "walls", "trim"] as BuildingRegion[]).map((region) => {
              const colorName =
                MCBI_COLORS.find((c) => c.hex === colors[region])?.name ||
                colors[region];
              return (
                <div
                  key={region}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div
                    className="w-6 h-6 rounded border border-gray-300 shrink-0"
                    style={{ backgroundColor: colors[region] }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-400 uppercase">
                      {regionLabel(region)}
                    </div>
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {colorName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save to gallery — the only action button */}
          {configured && (
            <div className="mt-3">
              <button
                onClick={handleSaveToGallery}
                disabled={!username || savingToGallery}
                className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingToGallery
                  ? "Saving…"
                  : justSaved
                    ? "Saved to Gallery ✓"
                    : "Save Design to Gallery"}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 shrink-0 space-y-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          {/* Current name */}
          {username && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-2">
                Your Name
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 flex-1">
                  {username}
                </span>
                <button
                  onClick={handleChangeName}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* All three color sections */}
          {(["roof", "walls", "trim"] as BuildingRegion[]).map((region) => (
            <div
              key={region}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <ColorPicker
                region={region}
                selectedHex={colors[region]}
                onSelect={regionHandlers[region]}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
