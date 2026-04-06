"use client";

import { MCBI_COLORS, BuildingRegion } from "@/lib/colors";

interface ColorPickerProps {
  region: BuildingRegion;
  selectedHex: string;
  onSelect: (hex: string) => void;
}

const REGION_LABELS: Record<BuildingRegion, string> = {
  roof: "Roof",
  walls: "Walls",
  trim: "Trim & Accents",
};

const REGION_ICONS: Record<BuildingRegion, string> = {
  roof: "^",
  walls: "[]",
  trim: "|",
};

export default function ColorPicker({ region, selectedHex, onSelect }: ColorPickerProps) {
  const selectedColor = MCBI_COLORS.find((c) => c.hex === selectedHex);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          {REGION_LABELS[region]}
        </h3>
        {selectedColor && (
          <span className="text-xs text-gray-500">{selectedColor.name}</span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-5">
        {MCBI_COLORS.map((color) => (
          <button
            key={`${region}-${color.hex}`}
            onClick={() => onSelect(color.hex)}
            title={color.name}
            className={`aspect-square rounded-md border-2 transition-all hover:scale-110 hover:shadow-md ${
              selectedHex === color.hex
                ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                : "border-gray-200 hover:border-gray-400"
            }`}
            style={{ backgroundColor: color.hex }}
          >
            <span className="sr-only">{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
