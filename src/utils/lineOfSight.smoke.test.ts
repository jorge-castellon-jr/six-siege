import { describe, expect, test } from "vitest";
import { hasLineOfSightWithSmoke } from "./lineOfSight";
import type { Position, Smoke } from "../types";

const emptyWalls: never[] = [];
const emptyBroken = { red: [], orange: [], windows: [] };

function cellSmoke(x: number, y: number, width = 1, height = 1): Smoke {
  return { position: { x, y }, pattern: { width, height } };
}

function los(pos1: Position, pos2: Position, smokes: Smoke[]): boolean {
  return hasLineOfSightWithSmoke(
    pos1,
    pos2,
    emptyWalls,
    emptyWalls,
    emptyWalls,
    emptyWalls,
    smokes,
    emptyBroken,
  );
}

describe("smoke line of sight", () => {
  test("[[A,S,x],[x,x,D]] is blocked — diagonal cuts the middle-top cell at two points", () => {
    expect(
      los({ x: 0, y: 0 }, { x: 2, y: 1 }, [cellSmoke(1, 0)]),
    ).toBe(false);
  });

  test("[[A,x,x],[x,S,D]] is blocked — diagonal cuts the middle-bottom cell at two points", () => {
    expect(
      los({ x: 0, y: 0 }, { x: 2, y: 1 }, [cellSmoke(1, 1)]),
    ).toBe(false);
  });

  test("[[A,x,x,x],[x,S,x,D]] is clear — line only nicks one corner of the smoke cell", () => {
    expect(
      los({ x: 0, y: 0 }, { x: 3, y: 1 }, [cellSmoke(1, 1)]),
    ).toBe(true);
  });

  test("straight horizontal line through 2x1 smoke filling the gap is blocked", () => {
    expect(
      los({ x: 5, y: 5 }, { x: 8, y: 5 }, [cellSmoke(6, 5, 2, 1)]),
    ).toBe(false);
  });

  test("smoke only in an operator's own cell does not block", () => {
    expect(
      los({ x: 0, y: 0 }, { x: 3, y: 0 }, [cellSmoke(0, 0)]),
    ).toBe(true);
  });
});
