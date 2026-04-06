export interface McbiColor {
  name: string;
  hex: string;
  category: "white" | "neutral" | "red" | "green" | "blue" | "metallic";
}

export const MCBI_COLORS: McbiColor[] = [
  // Whites & Lights
  { name: "Polar White", hex: "#E8E6DF", category: "white" },
  { name: "Bone White", hex: "#D9D3C7", category: "white" },
  { name: "Light Stone", hex: "#C4B9A4", category: "white" },
  { name: "Tan", hex: "#B5A282", category: "white" },
  { name: "Sandstone", hex: "#A89778", category: "white" },

  // Neutrals & Darks
  { name: "Burnished Slate", hex: "#6B6862", category: "neutral" },
  { name: "Charcoal", hex: "#464646", category: "neutral" },
  { name: "Matte Black", hex: "#2C2C2C", category: "neutral" },
  { name: "Black", hex: "#1A1A1A", category: "neutral" },
  { name: "Ash Gray", hex: "#8A8D8F", category: "neutral" },

  // Reds
  { name: "Crimson Red", hex: "#9B1B30", category: "red" },
  { name: "Rustic Red", hex: "#7A3B2E", category: "red" },
  { name: "Burgundy", hex: "#5C1A2A", category: "red" },
  { name: "Colonial Red", hex: "#8B2F3E", category: "red" },
  { name: "Terra Cotta", hex: "#A0522D", category: "red" },

  // Greens
  { name: "Forest Green", hex: "#2D4A3E", category: "green" },
  { name: "Hunter Green", hex: "#2E5339", category: "green" },
  { name: "Patina Green", hex: "#5F8575", category: "green" },
  { name: "Fern Green", hex: "#4F7942", category: "green" },
  { name: "Evergreen", hex: "#1E4D3A", category: "green" },

  // Blues
  { name: "Hawaiian Blue", hex: "#1B5583", category: "blue" },
  { name: "Gallery Blue", hex: "#5B7F95", category: "blue" },
  { name: "Slate Blue", hex: "#4A5D6E", category: "blue" },
  { name: "Ocean Blue", hex: "#1F4E79", category: "blue" },
  { name: "Sky Blue", hex: "#6FA3BE", category: "blue" },

  // Metallics
  { name: "Copper Metallic", hex: "#8C5E3C", category: "metallic" },
  { name: "Dark Bronze", hex: "#4E3B2A", category: "metallic" },
  { name: "Zinc Gray", hex: "#7D7F7E", category: "metallic" },
  { name: "Galvalume", hex: "#A8A9AD", category: "metallic" },
  { name: "Aged Copper", hex: "#6B7D5C", category: "metallic" },
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
  roof: "#464646",     // Charcoal
  walls: "#E8E6DF",    // Polar White
  trim: "#1A1A1A",     // Black
};
