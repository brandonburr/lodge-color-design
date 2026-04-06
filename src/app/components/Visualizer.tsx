"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ColorSelection,
  BuildingRegion,
  DEFAULT_COLORS,
  SavedCombination,
  MCBI_COLORS,
} from "@/lib/colors";
import { getSavedCombinations, saveCombination } from "@/lib/storage";
import BuildingImage from "./BuildingImage";
import ColorPicker from "./ColorPicker";
import SavedCombinations from "./SavedCombinations";

export default function Visualizer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [colors, setColors] = useState<ColorSelection>(() => {
    const roof = searchParams.get("roof") || DEFAULT_COLORS.roof;
    const walls = searchParams.get("walls") || DEFAULT_COLORS.walls;
    const trim = searchParams.get("trim") || DEFAULT_COLORS.trim;
    return { roof, walls, trim };
  });

  const [saved, setSaved] = useState<SavedCombination[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeRegion, setActiveRegion] = useState<BuildingRegion>("roof");
  const buildingRef = useRef<HTMLDivElement>(null);

  // Load saved combinations from localStorage
  useEffect(() => {
    setSaved(getSavedCombinations());
  }, []);

  // Update URL when colors change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("roof", colors.roof);
    params.set("walls", colors.walls);
    params.set("trim", colors.trim);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [colors, router, pathname]);

  const handleColorSelect = useCallback(
    (hex: string) => {
      setColors((prev) => ({ ...prev, [activeRegion]: hex }));
    },
    [activeRegion]
  );

  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    const newCombo = saveCombination(saveName.trim(), colors);
    setSaved((prev) => [...prev, newCombo]);
    setSaveName("");
    setShowSaveInput(false);
  }, [saveName, colors]);

  const handleLoad = useCallback((loadedColors: ColorSelection) => {
    setColors(loadedColors);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSaved((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleCopyLink = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("roof", colors.roof);
    params.set("walls", colors.walls);
    params.set("trim", colors.trim);
    const url = `${window.location.origin}${pathname}?${params.toString()}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [colors, pathname]);

  const handleExportImage = useCallback(async () => {
    const srcCanvas = document.getElementById("building-canvas") as HTMLCanvasElement | null;
    if (!srcCanvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = srcCanvas.width;
    exportCanvas.height = srcCanvas.height + 60;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(srcCanvas, 0, 0);

    // Color legend
    ctx.fillStyle = "#333";
    ctx.font = "24px sans-serif";
    const roofName = MCBI_COLORS.find((c) => c.hex === colors.roof)?.name || colors.roof;
    const wallsName = MCBI_COLORS.find((c) => c.hex === colors.walls)?.name || colors.walls;
    const trimName = MCBI_COLORS.find((c) => c.hex === colors.trim)?.name || colors.trim;
    ctx.fillText(
      `Roof: ${roofName}  |  Walls: ${wallsName}  |  Trim: ${trimName}`,
      40,
      srcCanvas.height + 40
    );

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mcbi-building-colors.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }, [colors]);

  const handleReset = useCallback(() => {
    setColors(DEFAULT_COLORS);
  }, []);

  const regionLabel = (r: BuildingRegion) => {
    const labels: Record<BuildingRegion, string> = {
      roof: "Roof",
      walls: "Walls",
      trim: "Trim",
    };
    return labels[r];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6">
      {/* Building Preview */}
      <div className="flex-1 min-w-0">
        <div
          ref={buildingRef}
          className="bg-gradient-to-b from-sky-100 to-sky-50 rounded-xl p-4 sm:p-8 flex items-center justify-center shadow-inner"
        >
          <BuildingImage colors={colors} />
        </div>

        {/* Color summary bar */}
        <div className="flex items-center gap-3 mt-4 p-3 bg-white rounded-lg border border-gray-200">
          {(["roof", "walls", "trim"] as BuildingRegion[]).map((region) => {
            const colorName = MCBI_COLORS.find((c) => c.hex === colors[region])?.name || colors[region];
            return (
              <div key={region} className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-6 h-6 rounded border border-gray-300 shrink-0"
                  style={{ backgroundColor: colors[region] }}
                />
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 uppercase">{regionLabel(region)}</div>
                  <div className="text-sm font-medium text-gray-700 truncate">{colorName}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {copied ? "Copied!" : "Copy Share Link"}
          </button>
          <button
            onClick={handleExportImage}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Download Image
          </button>
          <button
            onClick={() => setShowSaveInput(!showSaveInput)}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Save Combination
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Save input */}
        {showSaveInput && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Name this combination..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Color Picker Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Region tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(["roof", "walls", "trim"] as BuildingRegion[]).map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeRegion === region
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {regionLabel(region)}
            </button>
          ))}
        </div>

        {/* Active color picker */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <ColorPicker
            region={activeRegion}
            selectedHex={colors[activeRegion]}
            onSelect={handleColorSelect}
          />
        </div>

        {/* Saved combinations */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-3">
            Saved Combinations
          </h3>
          <SavedCombinations
            combinations={saved}
            onLoad={handleLoad}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
