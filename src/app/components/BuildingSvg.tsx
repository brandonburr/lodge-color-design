"use client";

import { ColorSelection } from "@/lib/colors";

interface BuildingSvgProps {
  colors: ColorSelection;
  id?: string;
}

export default function BuildingSvg({ colors, id = "building" }: BuildingSvgProps) {
  const roofColor = colors.roof;
  const wallColor = colors.walls;
  const trimColor = colors.trim;

  return (
    <svg
      id={id}
      viewBox="0 0 800 500"
      className="w-full h-auto max-w-2xl"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground / Foundation */}
      <rect x="0" y="440" width="800" height="60" fill="#8B7355" opacity="0.3" />

      {/* === WALLS === */}
      {/* Main wall - left section */}
      <rect x="120" y="220" width="280" height="220" fill={wallColor} stroke={trimColor} strokeWidth="3" />
      {/* Main wall - right section */}
      <rect x="400" y="220" width="280" height="220" fill={wallColor} stroke={trimColor} strokeWidth="3" />

      {/* Standing seam wall panels (vertical lines) */}
      {[160, 200, 240, 280, 320, 360, 440, 480, 520, 560, 600, 640].map((x) => (
        <line key={`panel-${x}`} x1={x} y1="220" x2={x} y2="440" stroke={trimColor} strokeWidth="0.5" opacity="0.3" />
      ))}

      {/* === ROOF === */}
      {/* Main roof - gable shape */}
      <polygon
        points="100,220 400,80 700,220"
        fill={roofColor}
        stroke={trimColor}
        strokeWidth="3"
      />

      {/* Standing seam roof lines */}
      {Array.from({ length: 12 }, (_, i) => {
        const t = (i + 1) / 13;
        // Left slope
        const lx1 = 100 + (400 - 100) * t;
        const ly1 = 220 + (80 - 220) * t;
        const lx2 = 100 + (400 - 100) * t * 0.5;
        const ly2 = 220;
        // Right slope
        const rx1 = 400 + (700 - 400) * t;
        const ry1 = 80 + (220 - 80) * t;
        const rx2 = 400 + (700 - 400) * t * 0.5;
        const ry2 = 80 + (220 - 80) * (t * 0.5);
        return (
          <g key={`seam-${i}`}>
            {i < 6 && (
              <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={trimColor} strokeWidth="1" opacity="0.25" />
            )}
          </g>
        );
      })}

      {/* Roof ridge seam lines (standing seam pattern) */}
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i + 1) / 9;
        // Left half seams
        const leftStartX = 100 + (400 - 100) * 0.08;
        const leftEndX = 400;
        const x = leftStartX + (leftEndX - leftStartX) * t;
        const topY = 220 + (80 - 220) * ((x - 100) / (400 - 100));
        return (
          <line key={`roof-seam-l-${i}`} x1={x} y1={topY} x2={x} y2={220} stroke={trimColor} strokeWidth="1" opacity="0.2" />
        );
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i + 1) / 9;
        const rightStartX = 400;
        const rightEndX = 700 - (700 - 400) * 0.08;
        const x = rightStartX + (rightEndX - rightStartX) * t;
        const topY = 80 + (220 - 80) * ((x - 400) / (700 - 400));
        return (
          <line key={`roof-seam-r-${i}`} x1={x} y1={topY} x2={x} y2={220} stroke={trimColor} strokeWidth="1" opacity="0.2" />
        );
      })}

      {/* === TRIM === */}
      {/* Eave trim - bottom of roof */}
      <line x1="100" y1="220" x2="700" y2="220" stroke={trimColor} strokeWidth="5" />

      {/* Ridge cap */}
      <line x1="380" y1="84" x2="420" y2="84" stroke={trimColor} strokeWidth="6" />
      <polygon points="395,70 405,70 420,84 380,84" fill={trimColor} />

      {/* Gable trim - left slope */}
      <line x1="100" y1="220" x2="400" y2="80" stroke={trimColor} strokeWidth="4" />
      {/* Gable trim - right slope */}
      <line x1="400" y1="80" x2="700" y2="220" stroke={trimColor} strokeWidth="4" />

      {/* Corner trim */}
      <rect x="117" y="220" width="6" height="220" fill={trimColor} />
      <rect x="677" y="220" width="6" height="220" fill={trimColor} />
      <rect x="397" y="220" width="6" height="220" fill={trimColor} />

      {/* Base trim */}
      <rect x="117" y="432" width="566" height="8" fill={trimColor} />

      {/* === DETAILS === */}
      {/* Walk door */}
      <rect x="180" y="320" width="60" height="120" fill={trimColor} />
      <rect x="184" y="324" width="52" height="112" fill={wallColor} opacity="0.5" />
      <circle cx="228" cy="385" r="3" fill={trimColor} />

      {/* Windows */}
      {[290, 350].map((x) => (
        <g key={`window-${x}`}>
          <rect x={x} y="280" width="40" height="50" fill={trimColor} />
          <rect x={x + 3} y={283} width="34" height="44" fill="#B8D4E8" opacity="0.7" />
          <line x1={x + 20} y1={283} x2={x + 20} y2={327} stroke={trimColor} strokeWidth="2" />
          <line x1={x + 3} y1={305} x2={x + 37} y2={305} stroke={trimColor} strokeWidth="2" />
        </g>
      ))}

      {/* Overhead / roll-up door */}
      <rect x="460" y="280" width="160" height="160" fill={trimColor} rx="2" />
      <rect x="464" y="284" width="152" height="152" fill={wallColor} opacity="0.4" />
      {/* Door panel lines */}
      {[320, 360, 400].map((y) => (
        <line key={`door-line-${y}`} x1="464" y1={y} x2="616" y2={y} stroke={trimColor} strokeWidth="1" opacity="0.5" />
      ))}

      {/* Gutter */}
      <rect x="96" y="218" width="8" height="222" fill={trimColor} opacity="0.6" rx="2" />
      <rect x="696" y="218" width="8" height="222" fill={trimColor} opacity="0.6" rx="2" />

      {/* Downspouts */}
      <rect x="98" y="410" width="4" height="30" fill={trimColor} opacity="0.5" />
      <rect x="698" y="410" width="4" height="30" fill={trimColor} opacity="0.5" />
    </svg>
  );
}
