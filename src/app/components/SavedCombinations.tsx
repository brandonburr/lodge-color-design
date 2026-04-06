"use client";

import { SavedCombination, ColorSelection } from "@/lib/colors";
import { deleteCombination } from "@/lib/storage";

interface SavedCombinationsProps {
  combinations: SavedCombination[];
  onLoad: (colors: ColorSelection) => void;
  onDelete: (id: string) => void;
}

export default function SavedCombinations({
  combinations,
  onLoad,
  onDelete,
}: SavedCombinationsProps) {
  if (combinations.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-4 text-center">
        No saved combinations yet. Use the save button above to store your favorites.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {combinations.map((combo) => (
        <div
          key={combo.id}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors"
        >
          {/* Color preview swatches */}
          <div className="flex gap-0.5 shrink-0">
            <div
              className="w-5 h-8 rounded-l-sm"
              style={{ backgroundColor: combo.colors.roof }}
              title="Roof"
            />
            <div
              className="w-5 h-8"
              style={{ backgroundColor: combo.colors.walls }}
              title="Walls"
            />
            <div
              className="w-5 h-8 rounded-r-sm"
              style={{ backgroundColor: combo.colors.trim }}
              title="Trim"
            />
          </div>

          {/* Name */}
          <span className="text-sm font-medium text-gray-700 truncate flex-1">
            {combo.name}
          </span>

          {/* Actions */}
          <button
            onClick={() => onLoad(combo.colors)}
            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            Load
          </button>
          <button
            onClick={() => {
              deleteCombination(combo.id);
              onDelete(combo.id);
            }}
            className="text-xs px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
