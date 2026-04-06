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

export default function ColorPicker({ region, selectedHex, onSelect }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
        {REGION_LABELS[region]}
      </h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-4">
        {MCBI_COLORS.map((color) => (
          <button
            key={`${region}-${color.hex}`}
            onClick={() => onSelect(color.hex)}
            title={color.name}
            className={`flex flex-col items-center gap-1 rounded-md border-2 p-1.5 transition-all hover:scale-105 hover:shadow-md ${
              selectedHex === color.hex
                ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <div
              className="w-full aspect-square rounded-sm"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-[10px] leading-tight text-gray-600 text-center w-full truncate">
              {color.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
