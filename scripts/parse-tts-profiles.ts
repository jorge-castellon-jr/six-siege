import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  parseProfileCard,
  writeProfileCrops,
  type CombatDiceTier,
} from "./parse-tts-profile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const CARDS = path.join(REPO_ROOT, "tmp", "tts-cards");
const CROP_DIR = path.join(REPO_ROOT, "tmp", "parse-debug", "crops");
const OPS_PATH = path.join(REPO_ROOT, "src", "data", "operators.json");

type Operator = {
  id: string;
  statsVerified: boolean;
  stamina?: number;
  run?: number;
  destroy?: CombatDiceTier;
  ranges?: { id: string; dice: CombatDiceTier[] }[];
};

function folderFor(id: string) {
  return id === "nokk" ? "n-kk" : id;
}

function compact(dice: CombatDiceTier[] | undefined) {
  return (dice ?? []).map((d) => d[0]).join("");
}

const ops = JSON.parse(readFileSync(OPS_PATH, "utf8")) as Operator[];
const mode = process.argv[2] ?? "unverified";
const targets =
  mode === "all"
    ? ops
    : mode === "verified"
      ? ops.filter((op) => op.statsVerified)
      : ops.filter((op) => !op.statsVerified);

mkdirSync(CROP_DIR, { recursive: true });

let mismatches = 0;
const results: Record<string, unknown>[] = [];

for (const op of targets) {
  const imagePath = path.join(CARDS, folderFor(op.id), "profile.png");
  const parsed = await parseProfileCard(imagePath);
  await writeProfileCrops(imagePath, CROP_DIR, op.id);

  const got = parsed.ranges.map(compact).join(" | ");
  let expected = "";
  let ok = true;
  if (op.statsVerified && op.ranges) {
    expected = op.ranges.map((band) => compact(band.dice)).join(" | ");
    const diceOk = got === expected;
    const destroyOk = parsed.destroy === op.destroy;
    ok = diceOk && destroyOk;
    if (!ok) mismatches += 1;
    console.log(
      `${ok ? "OK " : "BAD"} ${op.id.padEnd(14)} dice ${got.padEnd(22)} destroy ${parsed.destroy}  expected ${expected} / ${op.destroy}`,
    );
  } else {
    console.log(
      `NEW ${op.id.padEnd(14)} dice ${got.padEnd(22)} destroy ${parsed.destroy}`,
    );
  }

  results.push({
    id: op.id,
    ranges: parsed.ranges,
    destroy: parsed.destroy,
    ok,
  });
}

writeFileSync(
  path.join(REPO_ROOT, "tmp", "parse-debug", "results.json"),
  JSON.stringify(results, null, 2),
);
console.log(`\n${targets.length} cards, ${mismatches} mismatches vs verified JSON`);
if (mismatches > 0) process.exit(1);
