export interface McbiColor {
  name: string;
  hex: string;
}

// MBCI Signature 300 (PVDF Low Gloss) — 15 standard colors
export const MCBI_COLORS: McbiColor[] = [
  // Row 1
  { name: "Snow White", hex: "#F0EFEA" },
  { name: "Bone White", hex: "#D9D3C7" },
  { name: "Harbor Blue", hex: "#4B6A8A" },
  { name: "Almond", hex: "#C8B99A" },
  { name: "Brownstone", hex: "#6B5B4E" },
  // Row 2
  { name: "Medium Bronze", hex: "#5B4A3A" },
  { name: "Slate Gray", hex: "#70767C" },
  { name: "Storm Gray", hex: "#6D6E70" },
  { name: "Classic Green", hex: "#3A5F4C" },
  { name: "Brite Red", hex: "#CC2233" },
  // Row 3
  { name: "Pacific Blue", hex: "#2C5F8A" },
  { name: "Midnight Bronze", hex: "#3A2E24" },
  { name: "Tundra", hex: "#6B6460" },
  { name: "Colonial Red", hex: "#8B2F3E" },
  { name: "Midnight Black", hex: "#2C2C2E" },
];

export type BuildingRegion = "roof" | "walls" | "trim";

export interface ColorSelection {
  roof: string;
  walls: string;
  trim: string;
}

export const DEFAULT_COLORS: ColorSelection = {
  roof: "#70767C",     // Slate Gray
  walls: "#D9D3C7",    // Bone White
  trim: "#2C2C2E",     // Midnight Black
};
