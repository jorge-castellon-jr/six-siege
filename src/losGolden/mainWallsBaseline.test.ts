import { readFileSync, existsSync } from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { DEFAULT_MAPS } from "../data/defaultMaps";
import {
  computePairs,
  pairKeyToLabel,
  type LosGoldenFile,
} from "./mainWallsBaseline";

const GOLDENS_DIR = path.join(process.cwd(), "goldens", "los");
const MAX_MISMATCH_LINES = 50;

function loadGolden(mapId: string): LosGoldenFile {
  const p = path.join(GOLDENS_DIR, `${mapId}.json`);
  if (!existsSync(p)) {
    throw new Error(
      `Missing golden file for map "${mapId}". Expected: ${p}\nRun: yarn build:los-goldens`,
    );
  }
  return JSON.parse(readFileSync(p, "utf8")) as LosGoldenFile;
}

describe("main walls LOS goldens", () => {
  test.each(DEFAULT_MAPS)("$id — $name", (map) => {
    const golden = loadGolden(map.id);

    expect(golden.mapId).toBe(map.id);
    expect(golden.gridSize).toEqual(map.gridSize);
    expect(golden.preset).toBe("main-walls-only");

    const actual = computePairs(map);
    const goldenKeys = Object.keys(golden.pairs).sort();
    const actualKeys = Object.keys(actual).sort();

    const onlyInActual = actualKeys.filter((k) => !(k in golden.pairs));
    const onlyInGolden = goldenKeys.filter((k) => !(k in actual));
    if (onlyInActual.length > 0 || onlyInGolden.length > 0) {
      const msg = [
        `Map ${map.id} (${map.name}): golden key set does not match computed pairs.`,
        onlyInActual.length
          ? `Only in actual (${onlyInActual.length}): ${onlyInActual.slice(0, 20).join("; ")}${onlyInActual.length > 20 ? " …" : ""}`
          : "",
        onlyInGolden.length
          ? `Only in golden (${onlyInGolden.length}): ${onlyInGolden.slice(0, 20).join("; ")}${onlyInGolden.length > 20 ? " …" : ""}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      expect.fail(msg);
    }

    const mismatches: { key: string; expected: boolean; actual: boolean }[] =
      [];
    for (const key of goldenKeys) {
      const exp = golden.pairs[key];
      const act = actual[key];
      if (exp !== act) {
        mismatches.push({ key, expected: exp, actual: act as boolean });
      }
    }

    if (mismatches.length === 0) return;

    const lines: string[] = [
      `Map ${map.id} (${map.name}): ${mismatches.length} pair(s) differ from golden.`,
    ];
    const shown = mismatches.slice(0, MAX_MISMATCH_LINES);
    for (const m of shown) {
      lines.push(
        `  ${pairKeyToLabel(m.key)}: golden ${m.expected}, actual ${m.actual}`,
      );
    }
    if (mismatches.length > MAX_MISMATCH_LINES) {
      lines.push(
        `  … and ${mismatches.length - MAX_MISMATCH_LINES} more mismatches.`,
      );
    }

    expect.fail(lines.join("\n"));
  });
});
