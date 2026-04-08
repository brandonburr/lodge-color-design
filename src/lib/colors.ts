export interface McbiColor {
  name: string;
  hex: string;
}

// MBCI Signature® 300 Standard Colors — 24-gauge PVDF Low Gloss.
//
// Hex values were sampled directly from the official MBCI Signature 300
// color chart Brandon provided (5×3 grid of color chips). MBCI doesn't
// publish hex anywhere on their site — the chart itself is the source
// of truth.
//
// Order matches the chart layout (left-to-right, top-to-bottom).
export const MCBI_COLORS: McbiColor[] = [
  // Row 1: whites + light tones
  { name: "Snow White", hex: "#ECEEF0" },
  { name: "Bone White", hex: "#DEDDD6" },
  { name: "Harbor Blue", hex: "#1C4C61" },
  { name: "Almond", hex: "#D1C8B4" },
  { name: "Brownstone", hex: "#A4927F" },
  // Row 2: bronzes, grays, classic accents
  { name: "Medium Bronze", hex: "#554B40" },
  { name: "Slate Gray", hex: "#777572" },
  { name: "Storm Gray", hex: "#515356" },
  { name: "Classic Green", hex: "#314A3C" },
  { name: "Brite Red", hex: "#AC202A" },
  // Row 3: deep blues, dark neutrals, traditional reds
  { name: "Pacific Blue", hex: "#395A6B" },
  { name: "Midnight Bronze", hex: "#403B39" },
  { name: "Tundra", hex: "#989796" },
  { name: "Colonial Red", hex: "#6C3B33" },
  { name: "Midnight Black", hex: "#1F2122" },
];

export type BuildingRegion = "roof" | "walls" | "trim";

export interface ColorSelection {
  roof: string;
  walls: string;
  trim: string;
}

export const DEFAULT_COLORS: ColorSelection = {
  roof: "#777572", // Slate Gray
  walls: "#ECEEF0", // Snow White
  trim: "#403B39", // Midnight Bronze
};
