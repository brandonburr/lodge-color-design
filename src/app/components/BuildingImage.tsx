"use client";

import { useEffect, useRef, useState } from "react";
import { ColorSelection } from "@/lib/colors";

interface BuildingImageProps {
  colors: ColorSelection;
}

// Region polygons traced from the lodge base image (1890x1398 pixels).
// Tightly traced to follow actual building edges.

// Front roof slope (main visible surface, from front eave up to ridge)
const FRONT_ROOF_POLY: [number, number][] = [
  [245, 440],
  [350, 275],
  [830, 238],
  [1260, 238],
  [1260, 508],
];

// Side roof slope (visible past gable on right side)
const SIDE_ROOF_POLY: [number, number][] = [
  [1260, 240],
  [1620, 258],
  [1580, 290],
  [1260, 508],
];

// Front wall (below front eave, traced to building outline)
const FRONT_WALL_POLY: [number, number][] = [
  [245, 440],
  [1260, 508],
  [1260, 1170],
  [245, 985],
];

// Side wall (right face, below side eave)
const SIDE_WALL_POLY: [number, number][] = [
  [1260, 508],
  [1580, 290],
  [1580, 885],
  [1260, 1170],
];

function pointInPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

// --- Color math utilities ---

function rgbToHsl(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(h + 1 / 3) * 255),
    Math.round(hue2rgb(h) * 255),
    Math.round(hue2rgb(h - 1 / 3) * 255),
  ];
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [128, 128, 128];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

// Region IDs
const NONE = 0,
  ROOF = 1,
  WALLS = 2,
  TRIM = 3;

/**
 * Classify a pixel into a building region based on its color and position.
 * Navy-blue pixels → walls.  Light pixels in roof polygon → roof.
 * Light pixels in wall polygons → trim (doors/windows/frames).
 */
function classifyPixel(
  r: number,
  g: number,
  b: number,
  x: number,
  y: number
): number {
  const [h, s, l] = rgbToHsl(r, g, b);

  // Navy-blue wall panels — require s>15 to avoid roof standing-seam ridges
  if (h >= 190 && h <= 270 && s > 15 && l > 5 && l < 55) {
    if (x > 80 && x < 1800 && y > 50 && y < 1300) {
      return WALLS;
    }
  }

  // Roof: bright or moderately dark (standing-seam ridges) within roof polygons
  if (l > 50 && s < 40) {
    if (
      pointInPoly(x, y, FRONT_ROOF_POLY) ||
      pointInPoly(x, y, SIDE_ROOF_POLY)
    )
      return ROOF;
    if (
      pointInPoly(x, y, FRONT_WALL_POLY) ||
      pointInPoly(x, y, SIDE_WALL_POLY)
    )
      return TRIM;
  }

  // Catch dark standing-seam ridges on roof (low sat, moderate darkness)
  if (l >= 35 && l <= 60 && s < 15) {
    if (
      pointInPoly(x, y, FRONT_ROOF_POLY) ||
      pointInPoly(x, y, SIDE_ROOF_POLY)
    )
      return ROOF;
  }

  return NONE;
}

export default function BuildingImage({ colors }: BuildingImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseDataRef = useRef<ImageData | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const lumRef = useRef<Float32Array | null>(null);
  const avgLumRef = useRef<Float32Array | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load the base image and pre-compute the region mask + luminance map (once).
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height);
      baseDataRef.current = data;

      const total = img.width * img.height;
      const mask = new Uint8Array(total);
      const lum = new Float32Array(total);
      const px = data.data;

      // Per-region luminance accumulators
      const lumSum = new Float64Array(4);
      const lumCount = new Uint32Array(4);

      for (let i = 0; i < total; i++) {
        const off = i * 4;
        const region = classifyPixel(
          px[off],
          px[off + 1],
          px[off + 2],
          i % img.width,
          (i / img.width) | 0
        );
        mask[i] = region;
        if (region > 0) {
          const l = rgbToHsl(px[off], px[off + 1], px[off + 2])[2];
          lum[i] = l;
          lumSum[region] += l;
          lumCount[region]++;
        }
      }

      // Compute average luminance per region
      const avgLum = new Float32Array(4);
      for (let r = 1; r <= 3; r++) {
        avgLum[r] = lumCount[r] > 0 ? lumSum[r] / lumCount[r] : 50;
      }

      maskRef.current = mask;
      lumRef.current = lum;
      avgLumRef.current = avgLum;
      setLoaded(true);
    };
    img.src = "/lodge_base.jpg";
  }, []);

  // Re-colorize whenever the selected colors change.
  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    const base = baseDataRef.current;
    const mask = maskRef.current;
    const lumArr = lumRef.current;
    const avgLum = avgLumRef.current;
    if (!canvas || !base || !mask || !lumArr || !avgLum) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const out = new ImageData(
      new Uint8ClampedArray(base.data),
      base.width,
      base.height
    );
    const d = out.data;

    // Pre-compute HSL for each target color
    const roofHsl = rgbToHsl(...hexToRgb(colors.roof));
    const wallsHsl = rgbToHsl(...hexToRgb(colors.walls));
    const trimHsl = rgbToHsl(...hexToRgb(colors.trim));
    const targets = [null, roofHsl, wallsHsl, trimHsl];

    for (let i = 0; i < mask.length; i++) {
      const region = mask[i];
      if (region === 0) continue;

      const off = i * 4;
      const t = targets[region]!;
      // Relative luminance: preserve texture/shading while matching target brightness
      const relLum = avgLum[region] > 0 ? lumArr[i] / avgLum[region] : 1;
      const newL = Math.min(100, Math.max(0, t[2] * relLum));
      const [nr, ng, nb] = hslToRgb(t[0], t[1], newL);
      d[off] = nr;
      d[off + 1] = ng;
      d[off + 2] = nb;
    }

    ctx.putImageData(out, 0, 0);
  }, [colors, loaded]);

  return (
    <canvas
      ref={canvasRef}
      id="building-canvas"
      className="w-full h-auto max-w-2xl rounded-lg"
    />
  );
}
