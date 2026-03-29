/**
 * Generate LOS golden JSON files (main walls only, see src/losGolden/mainWallsBaseline.ts).
 *
 * Config: goldens/los/build-targets.json
 *   - mapIds missing, null, or [] → build every map in src/data/defaultMaps.ts
 *   - mapIds non-empty → only those map ids (others' JSON files are left untouched)
 *
 * CLI overrides config for this run only:
 *   yarn build:los-goldens -- --maps bank,consulate
 *   yarn build:los-goldens -- bank consulate
 *
 * Always review git diff on goldens/los/*.json before committing.
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_MAPS } from "../src/data/defaultMaps";
import { buildGoldenPayload } from "../src/losGolden/mainWallsBaseline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const GOLDENS_DIR = path.join(REPO_ROOT, "goldens", "los");

interface BuildTargets {
  mapIds?: string[] | null;
}

function readBuildTargets(): BuildTargets {
  const p = path.join(GOLDENS_DIR, "build-targets.json");
  try {
    return JSON.parse(readFileSync(p, "utf8")) as BuildTargets;
  } catch {
    return {};
  }
}

/** Non-null = use these ids only (from CLI). Null = use build-targets / all maps. */
function parseCliMapIds(): string[] | null {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--maps");
  if (i >= 0 && argv[i + 1]) {
    return argv[i + 1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const positional = argv.filter((a) => a !== "--" && !a.startsWith("-"));
  return positional.length > 0 ? positional : null;
}

function selectMapsToBuild(): typeof DEFAULT_MAPS {
  const byId = new Map(DEFAULT_MAPS.map((m) => [m.id, m]));
  const cliIds = parseCliMapIds();
  let ids: string[];

  if (cliIds) {
    ids = cliIds;
  } else {
    const cfg = readBuildTargets();
    const configured = cfg.mapIds;
    if (configured != null && configured.length > 0) {
      ids = configured;
    } else {
      ids = DEFAULT_MAPS.map((m) => m.id);
    }
  }

  const out: typeof DEFAULT_MAPS = [];
  for (const id of ids) {
    const map = byId.get(id);
    if (!map) {
      console.error(
        `Unknown map id "${id}". Valid ids: ${DEFAULT_MAPS.map((m) => m.id).join(", ")}`,
      );
      process.exit(1);
    }
    out.push(map);
  }
  return out;
}

function main(): void {
  mkdirSync(GOLDENS_DIR, { recursive: true });
  const maps = selectMapsToBuild();
  for (const map of maps) {
    const payload = buildGoldenPayload(map);
    const outPath = path.join(GOLDENS_DIR, `${map.id}.json`);
    writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Wrote ${outPath}`);
  }
}

main();
