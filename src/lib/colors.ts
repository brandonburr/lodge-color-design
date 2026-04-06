export interface McbiColor {
  name: string;
  hex: string;
  category: "white" | "neutral" | "red" | "green" | "blue" | "metallic";
}

// MBCI Signature 300 (PVDF Low Gloss) colors only
export const MCBI_COLORS: McbiColor[] = [
  // Whites & Lights
  { name: "Snow White", hex: "#F0EFEA", category: "white" },
  { name: "Bone White", hex: "#D9D3C7", category: "white" },
  { name: "Regal White", hex: "#E3DDD1", category: "white" },
  { name: "Almond", hex: "#C8B99A", category: "white" },

  // Neutrals & Darks
  { name: "Buckskin", hex: "#9C8B70", category: "neutral" },
  { name: "Brownstone", hex: "#6B5B4E", category: "neutral" },
  { name: "Tundra", hex: "#6B6460", category: "neutral" },
  { name: "Slate Gray", hex: "#70767C", category: "neutral" },
  { name: "Coal Black", hex: "#2A2A2A", category: "neutral" },

  // Reds
  { name: "Brite Red", hex: "#CC2233", category: "red" },
  { name: "Colonial Red", hex: "#8B2F3E", category: "red" },
  { name: "Burgundy", hex: "#5C1A2A", category: "red" },
  { name: "Terra Cotta", hex: "#A0522D", category: "red" },

  // Greens
  { name: "Classic Green", hex: "#3A5F4C", category: "green" },
  { name: "Everglade", hex: "#2E5548", category: "green" },
  { name: "Hunter Green", hex: "#2E5339", category: "green" },
  { name: "Spruce", hex: "#3D5C4E", category: "green" },
  { name: "Ivy Green", hex: "#3A5940", category: "green" },
  { name: "Natural Patina", hex: "#5F8575", category: "green" },

  // Blues
  { name: "Harbor Blue", hex: "#4B6A8A", category: "blue" },
  { name: "Pacific Blue", hex: "#2C5F8A", category: "blue" },
  { name: "Gallery Blue", hex: "#5B7F95", category: "blue" },

  // Metallics
  { name: "Medium Bronze", hex: "#5B4A3A", category: "metallic" },
  { name: "Midnight Bronze", hex: "#3A2E24", category: "metallic" },
  { name: "Copper Metallic", hex: "#8C5E3C", category: "metallic" },
  { name: "Silver Metallic", hex: "#A8A9AD", category: "metallic" },
];

export type BuildingRegion = "roof" | "walls" | "trim";

export interface ColorSelection {
  roof: string;
  walls: string;
  trim: string;
}

export interface SavedCombination {
  id: string;
  name: string;
  colors: ColorSelection;
  createdAt: number;
}

export const DEFAULT_COLORS: ColorSelection = {
  roof: "#70767C",     // Slate Gray
  walls: "#D9D3C7",    // Bone White
  trim: "#2A2A2A",     // Coal Black
};
