export interface McbiColor {
  name: string;
  hex: string;
}

// MBCI Signature® 300 Standard Colors (Kynar 500® / Hylar 5000® PVDF).
//
// The official MBCI Architectural Color Chart historically listed 18
// colors here; River Teal, Sea Mist, and Scarlet Red have been
// discontinued, leaving 15 in the current line.
//
// MBCI doesn't publish official hex values for any of its panel
// finishes — the canonical answer is "look at a physical color chip"
// because the perceived color depends on gloss, substrate, and
// lighting. These hex values are MyPerfectColor's calibrated paint
// matches (https://www.myperfectcolor.com/MBCI-Paint-Color-Matches/),
// which is the closest thing to a sourced answer and is accurate
// enough for an on-screen visualizer. A real customer should still
// order a physical chip from their distributor before committing.
export const MCBI_COLORS: McbiColor[] = [
  // Whites + tans
  { name: "Snow White", hex: "#D2D6D8" },
  { name: "Almond", hex: "#D5CCB8" },
  { name: "Brownstone", hex: "#AB9986" },
  // Bronzes
  { name: "Medium Bronze", hex: "#645B53" },
  { name: "Midnight Bronze", hex: "#4A4645" },
  // Grays
  { name: "Tundra", hex: "#9E9D9D" },
  { name: "Slate Gray", hex: "#7C7A77" },
  // Blues
  { name: "Pacific Blue", hex: "#4C6573" },
  { name: "Harbor Blue", hex: "#29556A" },
  // Greens
  { name: "Natural Patina", hex: "#92A992" },
  { name: "Spruce", hex: "#758D87" },
  { name: "Everglade", hex: "#5E7470" },
  { name: "Classic Green", hex: "#3C544A" },
  { name: "Hunter Green", hex: "#444E49" },
  // Red
  { name: "Colonial Red", hex: "#724540" },
];

export type BuildingRegion = "roof" | "walls" | "trim";

export interface ColorSelection {
  roof: string;
  walls: string;
  trim: string;
}

export const DEFAULT_COLORS: ColorSelection = {
  roof: "#7C7A77", // Slate Gray
  walls: "#D2D6D8", // Snow White
  trim: "#4A4645", // Midnight Bronze
};
