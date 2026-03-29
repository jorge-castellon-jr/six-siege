/**
 * Golden keys use col=x, row=y grid indices: `${x1},${y1}|${x2},${y2}` with (x1,y1) < (x2,y2) lexicographically.
 */
import type { MapData, Position } from "../types";
import {
  DEFAULT_LINE_THICKNESS,
  hasLineOfSight,
} from "../utils/lineOfSight";

export type LosGoldenPreset = "main-walls-only";

export interface LosGoldenFile {
  mapId: string;
  mapVersion: number;
  preset: LosGoldenPreset;
  gridSize: { width: number; height: number };
  lineThickness: number;
  pairs: Record<string, boolean>;
}

function isCanonicalPair(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean {
  if (x1 === x2 && y1 === y2) return false;
  return x1 < x2 || (x1 === x2 && y1 < y2);
}

export function pairKey(x1: number, y1: number, x2: number, y2: number): string {
  return `${x1},${y1}|${x2},${y2}`;
}

/** Golden-format key for two cells (unordered). Same cell returns `x,y|x,y`. */
export function canonicalPairKey(a: Position, b: Position): string {
  if (a.x === b.x && a.y === b.y) return pairKey(a.x, a.y, b.x, b.y);
  if (a.x < b.x || (a.x === b.x && a.y < b.y))
    return pairKey(a.x, a.y, b.x, b.y);
  return pairKey(b.x, b.y, a.x, a.y);
}

/** Decode a golden pair key into a short human label (col = x, row = y). */
export function pairKeyToLabel(key: string): string {
  const parts = key.split("|");
  if (parts.length !== 2) return key;
  const [a, b] = parts;
  const [x1, y1] = a.split(",").map(Number);
  const [x2, y2] = b.split(",").map(Number);
  if ([x1, y1, x2, y2].some((n) => Number.isNaN(n))) return key;
  return `(col ${x1}, row ${y1}) ↔ (col ${x2}, row ${y2})`;
}

export function computePairs(map: MapData): Record<string, boolean> {
  const { width, height } = map.gridSize;
  const pairs: Record<string, boolean> = {};

  for (let x1 = 0; x1 < width; x1++) {
    for (let y1 = 0; y1 < height; y1++) {
      for (let x2 = 0; x2 < width; x2++) {
        for (let y2 = 0; y2 < height; y2++) {
          if (!isCanonicalPair(x1, y1, x2, y2)) continue;
          const key = pairKey(x1, y1, x2, y2);
          pairs[key] = hasLineOfSight(
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            map.walls,
            DEFAULT_LINE_THICKNESS,
          );
        }
      }
    }
  }

  return pairs;
}

/** Build golden payload with lexicographically sorted `pairs` keys for stable diffs. */
export function buildGoldenPayload(map: MapData): LosGoldenFile {
  const raw = computePairs(map);
  const sortedPairs: Record<string, boolean> = {};
  for (const k of Object.keys(raw).sort()) {
    sortedPairs[k] = raw[k];
  }
  return {
    mapId: map.id,
    mapVersion: map.version,
    preset: "main-walls-only",
    gridSize: { ...map.gridSize },
    lineThickness: DEFAULT_LINE_THICKNESS,
    pairs: sortedPairs,
  };
}
