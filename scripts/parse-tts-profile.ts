import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");

export type CombatDiceTier = "yellow" | "orange" | "red";

type Blob = {
  tier: CombatDiceTier;
  x: number;
  y: number;
  n: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

function hsv(r: number, g: number, b: number) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === R) hue = 60 * (((G - B) / d) % 6);
    else if (max === G) hue = 60 * ((B - R) / d + 2);
    else hue = 60 * ((R - G) / d + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: max === 0 ? 0 : d / max, v: max };
}

export function classifyDieColor(
  r: number,
  g: number,
  b: number,
): CombatDiceTier | null {
  const { h, s, v } = hsv(r, g, b);
  if (s < 0.55 || v < 0.4) return null;
  if (h >= 42 && h <= 72) return "yellow";
  if (h >= 18 && h < 42) return "orange";
  if (h <= 18 || h >= 345) return "red";
  return null;
}

function median(arr: number[]) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[(sorted.length / 2) | 0];
}

function collectBlobs(
  data: Buffer,
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  minPixels: number,
): Blob[] {
  const labels = new Int8Array(w * h);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const kind = classifyDieColor(data[i], data[i + 1], data[i + 2]);
      labels[y * w + x] =
        kind === "yellow" ? 1 : kind === "orange" ? 2 : kind === "red" ? 3 : 0;
    }
  }

  const blobs: Blob[] = [];
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const start = y * w + x;
      if (seen[start] || labels[start] === 0) continue;
      const code = labels[start];
      seen[start] = 1;
      stack.push(start);
      const xs: number[] = [];
      const ys: number[] = [];
      while (stack.length) {
        const p = stack.pop()!;
        const px = p % w;
        const py = (p / w) | 0;
        xs.push(px);
        ys.push(py);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = px + dx;
            const ny = py + dy;
            if (nx < x0 || nx >= x1 || ny < y0 || ny >= y1) continue;
            const np = ny * w + nx;
            if (seen[np] || labels[np] !== code) continue;
            seen[np] = 1;
            stack.push(np);
          }
        }
      }
      if (xs.length < minPixels) continue;
      blobs.push({
        tier: code === 1 ? "yellow" : code === 2 ? "orange" : "red",
        x: median(xs),
        y: median(ys),
        n: xs.length,
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      });
    }
  }
  return blobs;
}

function groupByX(blobs: Blob[], gap: number): Blob[][] {
  const sorted = [...blobs].sort((a, b) => a.x - b.x);
  const groups: Blob[][] = [];
  let current: Blob[] = [];
  for (const blob of sorted) {
    if (current.length === 0) {
      current = [blob];
      continue;
    }
    const prev = current[current.length - 1];
    if (blob.x - prev.x > gap) {
      groups.push(current);
      current = [blob];
    } else {
      current.push(blob);
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

export async function parseProfileCard(imagePath: string) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  const weaponBlobs = collectBlobs(
    data,
    w,
    h,
    Math.floor(w * 0.38),
    Math.floor(h * 0.06),
    w,
    Math.floor(h * 0.2),
    400,
  ).filter((b) => {
    const bw = b.maxX - b.minX;
    const bh = b.maxY - b.minY;
    return (
      b.y >= h * 0.08 &&
      b.y <= h * 0.16 &&
      bw >= 24 &&
      bw <= 42 &&
      bh >= 24 &&
      bh <= 42 &&
      b.n >= 500 &&
      b.n <= 1400
    );
  });

  const groups = groupByX(weaponBlobs, 55);
  const ranges = groups.map((group) =>
    [...group].sort((a, b) => a.x - b.x).map((blob) => blob.tier),
  );

  const destroyBlobs = collectBlobs(
    data,
    w,
    h,
    Math.floor(w * 0.55),
    Math.floor(h * 0.78),
    Math.floor(w * 0.88),
    h,
    40,
  ).filter((b) => {
    const bw = b.maxX - b.minX;
    const bh = b.maxY - b.minY;
    return bw >= 12 && bw <= 48 && bh >= 12 && bh <= 48;
  });
  destroyBlobs.sort((a, b) => b.n - a.n);
  const destroy = destroyBlobs[0]?.tier ?? null;

  return {
    width: w,
    height: h,
    ranges,
    destroy,
    weaponBlobs: weaponBlobs.map((b) => ({
      tier: b.tier,
      x: b.x,
      y: b.y,
      n: b.n,
    })),
  };
}

async function cropRegion(
  imagePath: string,
  outPath: string,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  await sharp(imagePath)
    .extract({ left, top, width, height })
    .png()
    .toFile(outPath);
}

export async function writeProfileCrops(
  imagePath: string,
  destDir: string,
  stem: string,
) {
  mkdirSync(destDir, { recursive: true });
  const image = sharp(imagePath);
  const meta = await image.metadata();
  const w = meta.width ?? 1000;
  const h = meta.height ?? 751;
  await cropRegion(
    imagePath,
    path.join(destDir, `${stem}-weapons.png`),
    Math.floor(w * 0.4),
    0,
    w - Math.floor(w * 0.4),
    Math.floor(h * 0.22),
  );
  await cropRegion(
    imagePath,
    path.join(destDir, `${stem}-gadget.png`),
    Math.floor(w * 0.38),
    Math.floor(h * 0.18),
    w - Math.floor(w * 0.38),
    Math.floor(h * 0.62),
  );
  await cropRegion(
    imagePath,
    path.join(destDir, `${stem}-stats.png`),
    Math.floor(w * 0.52),
    Math.floor(h * 0.78),
    w - Math.floor(w * 0.52),
    h - Math.floor(h * 0.78),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("Usage: tsx scripts/parse-tts-profile.ts <profile.png>");
    process.exit(1);
  }
  const parsed = await parseProfileCard(imagePath);
  writeFileSync(
    path.join(REPO_ROOT, "tmp", "parse-debug", "last.json"),
    JSON.stringify(parsed, null, 2),
  );
  console.log(
    JSON.stringify(
      { ranges: parsed.ranges, destroy: parsed.destroy },
      null,
      2,
    ),
  );
}
