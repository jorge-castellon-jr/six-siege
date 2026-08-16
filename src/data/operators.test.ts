import { describe, expect, test } from "vitest";
import {
  OPERATORS,
  TACTICAL_INVENTORY,
  inventoryForTeam,
  ttsCardFolder,
  ttsCardUrl,
} from "./operators";
import type { CombatDiceTier } from "./combatDice";
import type { GadgetKind, OperatorSource, RangeBandId } from "./operators";

const TTS_OPERATOR_IDS = [
  "ash",
  "sledge",
  "thatcher",
  "thermite",
  "twitch",
  "montagne",
  "glaz",
  "fuze",
  "blitz",
  "iq",
  "smoke",
  "mute",
  "castle",
  "pulse",
  "doc",
  "rook",
  "kapkan",
  "tachanka",
  "jager",
  "bandit",
  "buck",
  "frost",
  "blackbeard",
  "valkyrie",
  "capitao",
  "caveira",
  "hibana",
  "echo",
  "jackal",
  "mira",
  "ying",
  "lesion",
  "ela",
  "zofia",
  "dokkaebi",
  "vigil",
  "lion",
  "finka",
  "maestro",
  "alibi",
  "maverick",
  "clash",
  "nomad",
  "kaid",
  "gridlock",
  "nokk",
  "amaru",
  "kali",
  "iana",
  "oryx",
  "ace",
  "melusi",
  "zero",
  "aruni",
  "flores",
  "thunderbird",
] as const;

const REQUIRED_FIELDS = [
  "id",
  "name",
  "team",
  "source",
  "gadgetName",
  "gadgetKind",
  "gadget",
  "statsVerified",
] as const;

const SOURCES: OperatorSource[] = [
  "core",
  "year1",
  "year2",
  "year3",
  "year4",
  "year5",
  "year6plus",
];

const GADGET_KINDS: GadgetKind[] = [
  "setup",
  "action",
  "reaction",
  "passive",
];

const RANGE_IDS: RangeBandId[] = ["short", "medium", "long"];

function isCombatDiceTier(value: unknown): value is CombatDiceTier {
  return value === "yellow" || value === "orange" || value === "red";
}

describe("operator roster", () => {
  test("includes the 56 Corebox TTS operators and no extras", () => {
    expect(OPERATORS).toHaveLength(56);
    expect(new Set(OPERATORS.map((op) => op.id)).size).toBe(56);
    expect(OPERATORS.map((op) => op.id).sort()).toEqual(
      [...TTS_OPERATOR_IDS].sort(),
    );
  });

  test("normalizes TTS nicknames (Kaplan, Tachanca, Jager, Capitao, Nokk)", () => {
    const byId = Object.fromEntries(OPERATORS.map((op) => [op.id, op]));
    expect(byId.kapkan.name).toBe("Kapkan");
    expect(byId.tachanka.name).toBe("Tachanka");
    expect(byId.jager.name).toBe("Jäger");
    expect(byId.capitao.name).toBe("Capitão");
    expect(byId.nokk.name).toBe("Nøkk");
    expect(OPERATORS.some((op) => op.name === "Kaplan")).toBe(false);
    expect(OPERATORS.some((op) => op.name === "Tachanca")).toBe(false);
  });

  test("core box has 10 attackers and 10 defenders", () => {
    const core = OPERATORS.filter((op) => op.source === "core");
    expect(core).toHaveLength(20);
    expect(core.filter((op) => op.team === "Attacker")).toHaveLength(10);
    expect(core.filter((op) => op.team === "Defender")).toHaveLength(10);
  });

  test("every operator has required fields", () => {
    for (const op of OPERATORS) {
      for (const field of REQUIRED_FIELDS) {
        expect(op[field], `${op.id} missing ${field}`).toBeDefined();
      }
      expect(op.id.length).toBeGreaterThan(0);
      expect(op.name.length).toBeGreaterThan(0);
      expect(op.gadgetName.length).toBeGreaterThan(0);
      expect(["Attacker", "Defender"]).toContain(op.team);
      expect(SOURCES).toContain(op.source);
      expect(GADGET_KINDS).toContain(op.gadgetKind);
      expect(Array.isArray(op.gadget)).toBe(true);
      expect(typeof op.statsVerified).toBe("boolean");
    }
  });

  test("does not invent complete ranges for unverified operators", () => {
    for (const op of OPERATORS) {
      if (op.statsVerified) continue;
      expect(op.ranges, `${op.id} should not have transcribed ranges`).toBeUndefined();
      expect(op.stamina, `${op.id} should not guess stamina`).toBeUndefined();
      expect(op.run, `${op.id} should not guess run`).toBeUndefined();
      expect(op.destroy, `${op.id} should not guess destroy`).toBeUndefined();
      expect(op.gadget, `${op.id} should not guess gadget rules`).toEqual([]);
    }
  });

  test("verified operators have stamina, destroy, and three range bands", () => {
    const verified = OPERATORS.filter((op) => op.statsVerified);
    expect(verified.length).toBeGreaterThan(0);

    for (const op of verified) {
      expect(op.stamina, `${op.id} stamina`).toEqual(expect.any(Number));
      expect(isCombatDiceTier(op.destroy), `${op.id} destroy`).toBe(true);
      expect(op.ranges, `${op.id} ranges`).toHaveLength(3);
      expect(op.ranges?.map((band) => band.id)).toEqual(RANGE_IDS);
      for (const band of op.ranges ?? []) {
        expect(band.spaces.length).toBeGreaterThan(0);
        expect(band.dice.length).toBeGreaterThan(0);
        expect(band.dice.every(isCombatDiceTier)).toBe(true);
      }
    }
  });

  test("excludes operators not in this Corebox JSON", () => {
    const ids = new Set(OPERATORS.map((op) => op.id));
    for (const missing of ["mozzie", "warden", "goyo", "wamai", "osa", "thorn"]) {
      expect(ids.has(missing)).toBe(false);
    }
  });
});

describe("tactical inventory", () => {
  test("splits attacker and defender loadouts", () => {
    expect(TACTICAL_INVENTORY.length).toBeGreaterThan(0);
    const attackers = inventoryForTeam("Attacker");
    const defenders = inventoryForTeam("Defender");
    expect(attackers.some((item) => item.id === "drone")).toBe(true);
    expect(defenders.some((item) => item.id === "nitro-cell")).toBe(true);
    expect(attackers.every((item) => item.team !== "Defender")).toBe(true);
    expect(defenders.every((item) => item.team !== "Attacker")).toBe(true);
  });
});

describe("tts card urls", () => {
  test("maps Nøkk onto the extractor folder slug", () => {
    expect(ttsCardFolder("nokk")).toBe("n-kk");
    expect(ttsCardUrl("ash", "profile")).toBe("/tts-cards/ash/profile.png");
    expect(ttsCardUrl("nokk", "portrait")).toBe("/tts-cards/n-kk/gadget.png");
  });
});
