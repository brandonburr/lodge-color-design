"use client";

import { useEffect, useRef, useState } from "react";
import { ColorSelection } from "@/lib/colors";
import {
  loadLodgeImageData,
  recolorTo,
  LODGE_ASPECT_RATIO,
  LodgeImageData,
} from "@/lib/lodgeImageCache";

interface BuildingImageProps {
  colors: ColorSelection;
  /**
   * Render width in CSS pixels for the canvas backing buffer. Defaults to
   * the source resolution (1890) for the Designer page. Gallery cards pass
   * a smaller value (e.g. 480) so each card renders much faster and uses
   * far less memory.
   */
  renderWidth?: number;
  /** Optional className passed through to the canvas element. */
  className?: string;
}

export default function BuildingImage({
  colors,
  renderWidth = 1890,
  className = "w-full h-auto max-w-2xl rounded-lg",
}: BuildingImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<LodgeImageData | null>(null);

  // Load (or pull from cache) the lodge image data.
  useEffect(() => {
    let cancelled = false;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    loadLodgeImageData(basePath)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        console.error("[BuildingImage] failed to load lodge data:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-render whenever colors or render size change.
  useEffect(() => {
    if (!data) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = renderWidth;
    canvas.height = Math.round(renderWidth * LODGE_ASPECT_RATIO);
    recolorTo(data, colors, canvas);
  }, [data, colors, renderWidth]);

  return <canvas ref={canvasRef} id="building-canvas" className={className} />;
}
