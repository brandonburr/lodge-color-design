import { ColorSelection } from "./colors";

// ── Cached lodge image data ─────────────────────────────────────
//
// Loading and classifying the lodge image is moderately expensive (a few
// hundred ms for the per-pixel classify pass). The Gallery page renders
// many lodge previews at once, so we hoist the heavy work into a module-
// level cache: the first call kicks off the load and classify, all
// subsequent calls (from any BuildingImage instance, on any page) wait
// for the same promise and share the result. The recolor pass is per-
// instance and runs every time the user changes a color.

export interface LodgeImageData {
  /** Working resolution. We render at the trim mask's native size. */
  width: number;
  height: number;
  /** Base-image pixels at the working resolution (upscaled if needed). */
  baseImageData: ImageData;
  /** Region id per pixel (0=NONE, 1=ROOF, 2=WALLS, 3=TRIM). */
  mask: Uint8Array;
  /** Original luminance per pixel (HSL L, 0–100). */
  lum: Float32Array;
  /** Average luminance per region. avgLum[1..3] are valid. */
  avgLum: Float32Array;
}

let cached: LodgeImageData | null = null;
let pending: Promise<LodgeImageData> | null = null;

/**
 * Load and classify the lodge image. Cached after first call. All
 * concurrent callers share the same in-flight promise.
 */
export function loadLodgeImageData(basePath: string): Promise<LodgeImageData> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = doLoad(basePath)
    .then((data) => {
      cached = data;
      pending = null;
      return data;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });
  return pending;
}

// ── Region IDs ──────────────────────────────────────────────────
export const NONE = 0;
export const ROOF = 1;
export const WALLS = 2;
export const TRIM = 3;

// ── Region polygon traced from the original 1890×1398 base image ─
// Coordinates are in original-base pixel space; doLoad scales them to
// the working resolution (which is the trim mask's native size).
const ROOF_POLY: [number, number][] = [
  [241, 431],
  [561, 254],
  [1622, 211],
  [1423, 510],
];

// ── Color math utilities ────────────────────────────────────────
export function rgbToHsl(
  r: number,
  g: number,
  b: number,
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

export function hslToRgb(
  h: number,
  s: number,
  l: number,
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

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [128, 128, 128];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

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

// ── Image loading ───────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load image: ${src}`));
    img.src = src;
  });
}

async function doLoad(basePath: string): Promise<LodgeImageData> {
  const [baseImg, trimImg] = await Promise.all([
    loadImage(`${basePath}/lodge_base.jpg`),
    loadImage(`${basePath}/lodge_trim_mask.png`),
  ]);

  // Work at the trim mask's NATIVE resolution. The mask was painted by
  // the user pixel-by-pixel and we treat its red areas as ground truth:
  // wherever the user painted red is exactly where trim should be, no
  // more, no less. Working at the mask's native size eliminates the
  // entire downsampling-vs-thin-features mess.
  const w = trimImg.width;
  const h = trimImg.height;

  // Upscale the base image to the working resolution. Bilinear is fine
  // here — the upscaled base is only used for walls/roof classification
  // and for relative-luminance shading, both robust to a little smoothing.
  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = w;
  baseCanvas.height = h;
  const baseCtx = baseCanvas.getContext("2d", { willReadFrequently: true });
  if (!baseCtx) throw new Error("could not create base canvas context");
  baseCtx.imageSmoothingEnabled = true;
  baseCtx.imageSmoothingQuality = "high";
  baseCtx.drawImage(baseImg, 0, 0, w, h);
  const baseImageData = baseCtx.getImageData(0, 0, w, h);
  const basePx = baseImageData.data;

  // Read the trim mask at native resolution (no scaling).
  const trimCanvas = document.createElement("canvas");
  trimCanvas.width = w;
  trimCanvas.height = h;
  const trimCtx = trimCanvas.getContext("2d");
  if (!trimCtx) throw new Error("could not create trim canvas context");
  trimCtx.drawImage(trimImg, 0, 0);
  const trimPx = trimCtx.getImageData(0, 0, w, h).data;

  // Region polygon and walls bbox were traced in original 1890×1398 base
  // coordinates. Scale them to the working resolution.
  const scaleX = w / 1890;
  const scaleY = h / 1398;
  const ROOF_POLY_SCALED: [number, number][] = ROOF_POLY.map(([px, py]) => [
    px * scaleX,
    py * scaleY,
  ]);
  const wallBboxX0 = 80 * scaleX;
  const wallBboxX1 = 1800 * scaleX;
  const wallBboxY0 = 50 * scaleY;
  const wallBboxY1 = 1300 * scaleY;

  // Classify every pixel.
  const total = w * h;
  const mask = new Uint8Array(total);
  const lum = new Float32Array(total);
  const lumSum = new Float64Array(4);
  const lumCount = new Uint32Array(4);

  for (let i = 0; i < total; i++) {
    const off = i * 4;
    const x = i % w;
    const y = (i / w) | 0;

    let region: number = NONE;

    // Trim: where the user painted red in the mask. Simple threshold —
    // no downsampling, no hysteresis, no erosion. The mask is at its
    // native resolution and we use it directly.
    //
    // No "muntin guard" — we used to skip pixels that were red-dominant
    // in the base image, on the theory that they were pink window-muntin
    // lines from the underlying render that we shouldn't recolor. That
    // was wrong: muntin dividers ARE trim (they're the same physical
    // material as the window frame around them). With the guard in
    // place, recoloring trim to e.g. green leaves the muntin lines
    // pink/red and the windows look broken. The guard only ever
    // rejected ~1.5% of mask-red pixels anyway.
    const tR = trimPx[off];
    const tG = trimPx[off + 1];
    const tB = trimPx[off + 2];
    if (tR > 100 && tR - tG > 25 && tR - tB > 25) {
      region = TRIM;
    }

    if (region === NONE) {
      // Inside the roof polygon: always ROOF. The polygon was traced
      // tightly enough that this gives clean coverage and the relative-
      // luminance multiplier preserves the seam-ridge texture so it
      // still looks like metal panels.
      if (pointInPoly(x, y, ROOF_POLY_SCALED)) {
        region = ROOF;
      } else {
        // Walls: navy panels outside the roof polygon, inside the
        // wall bbox.
        const r = basePx[off];
        const g = basePx[off + 1];
        const b = basePx[off + 2];
        const [hh, ss, ll] = rgbToHsl(r, g, b);
        if (
          hh >= 190 &&
          hh <= 270 &&
          ss > 15 &&
          ll > 5 &&
          ll < 55 &&
          x > wallBboxX0 &&
          x < wallBboxX1 &&
          y > wallBboxY0 &&
          y < wallBboxY1
        ) {
          region = WALLS;
        }
      }
    }

    mask[i] = region;
    if (region > 0) {
      const lValue = rgbToHsl(
        basePx[off],
        basePx[off + 1],
        basePx[off + 2],
      )[2];
      lum[i] = lValue;
      lumSum[region] += lValue;
      lumCount[region]++;
    }
  }

  // Dilate the TRIM region by 2 pixels (4-connected, two passes). The user
  // painted the mask with thin lines (1–2 px wide at the mask's 2380×1760
  // resolution). The original 3D render has JPEG bleed extending another
  // ~2 px beyond every red trim feature, so the painted mask leaves a
  // pinkish/orange halo of pixels that fall through the classifier and
  // render with their original (washed-out) base colors. Browser bilinear
  // downsampling for display turns those halos into the noisy/jagged
  // window frames Brandon was seeing. Two dilation passes widen the trim
  // enough to absorb the bleed halo cleanly. Newly-dilated pixels keep
  // their actual base luminance so the relative-luminance shading still
  // preserves the edge detail.
  for (let pass = 0; pass < 2; pass++) {
    const next = new Uint8Array(mask);
    for (let y = 1; y < h - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const i = row + x;
        if (mask[i] === TRIM) continue;
        if (
          mask[i - 1] === TRIM ||
          mask[i + 1] === TRIM ||
          mask[i - w] === TRIM ||
          mask[i + w] === TRIM
        ) {
          next[i] = TRIM;
          const off = i * 4;
          lum[i] = rgbToHsl(basePx[off], basePx[off + 1], basePx[off + 2])[2];
        }
      }
    }
    mask.set(next);
  }

  // Recompute per-region luminance accumulators because dilation moved
  // some pixels into TRIM and out of NONE/WALLS/ROOF.
  lumSum.fill(0);
  lumCount.fill(0);
  for (let i = 0; i < total; i++) {
    const r = mask[i];
    if (r > 0) {
      lumSum[r] += lum[i];
      lumCount[r]++;
    }
  }

  const avgLum = new Float32Array(4);
  for (let r = 1; r <= 3; r++) {
    avgLum[r] = lumCount[r] > 0 ? lumSum[r] / lumCount[r] : 50;
  }

  console.log("[lodgeImageCache] loaded at native trim resolution:", {
    width: w,
    height: h,
    roof: lumCount[ROOF],
    walls: lumCount[WALLS],
    trim: lumCount[TRIM],
    none: total - lumCount[ROOF] - lumCount[WALLS] - lumCount[TRIM],
  });

  return { width: w, height: h, baseImageData, mask, lum, avgLum };
}

// ── Per-instance recolor ────────────────────────────────────────
//
// Renders the lodge with the requested colors into a destination canvas.
// The destination canvas can be smaller than the source — we sample the
// region mask via nearest-neighbor so gallery cards render at e.g.
// 480×355 instead of the full 2380×1760. Recoloring at the smaller size
// is much cheaper.
export function recolorTo(
  data: LodgeImageData,
  colors: ColorSelection,
  destCanvas: HTMLCanvasElement,
): void {
  const ctx = destCanvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) return;

  const dw = destCanvas.width;
  const dh = destCanvas.height;
  if (dw === 0 || dh === 0) return;

  const out = ctx.createImageData(dw, dh);
  const od = out.data;

  const sw = data.width;
  const sh = data.height;
  const baseData = data.baseImageData.data;
  const mask = data.mask;
  const lum = data.lum;
  const avgLum = data.avgLum;

  const roofHsl = rgbToHsl(...hexToRgb(colors.roof));
  const wallsHsl = rgbToHsl(...hexToRgb(colors.walls));
  const trimHsl = rgbToHsl(...hexToRgb(colors.trim));
  const targets: Array<[number, number, number] | null> = [
    null,
    roofHsl,
    wallsHsl,
    trimHsl,
  ];

  const sameSize = dw === sw && dh === sh;

  for (let dy = 0; dy < dh; dy++) {
    const sy = sameSize ? dy : Math.floor((dy * sh) / dh);
    for (let dx = 0; dx < dw; dx++) {
      const sx = sameSize ? dx : Math.floor((dx * sw) / dw);
      const sIdx = sy * sw + sx;
      const sOff = sIdx * 4;
      const dOff = (dy * dw + dx) * 4;

      const region = mask[sIdx];

      // Default: copy the base pixel through.
      let r = baseData[sOff];
      let g = baseData[sOff + 1];
      let b = baseData[sOff + 2];

      if (region > 0) {
        const t = targets[region]!;
        // Trim is painted aluminum/vinyl — flat color, no shading.
        // Roof and walls keep relative-luminance shading to preserve
        // metal-panel seam ridges and siding shadows.
        //
        // The dilation pass widens the trim to absorb JPEG bleed
        // halos. Some of those dilated pixels sit on dark navy walls
        // and some sit on bright window glass. With rel-lum shading
        // they would each get a different brightness — turning the
        // trim near dark areas almost black (Brandon's "black vertical
        // line on the right corner") and the trim near windows much
        // brighter than its neighbors (the "windows look so crappy"
        // speckling). Flat trim color eliminates both.
        let newL: number;
        if (region === TRIM) {
          newL = t[2];
        } else {
          const relLum = avgLum[region] > 0 ? lum[sIdx] / avgLum[region] : 1;
          newL = Math.min(100, Math.max(0, t[2] * relLum));
        }
        const out3 = hslToRgb(t[0], t[1], newL);
        r = out3[0];
        g = out3[1];
        b = out3[2];
      }

      od[dOff] = r;
      od[dOff + 1] = g;
      od[dOff + 2] = b;
      od[dOff + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
}

/** Aspect ratio of the source lodge image. Used to size cards before load. */
export const LODGE_ASPECT_RATIO = 1760 / 2380;
