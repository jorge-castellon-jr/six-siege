import type { CombatDiceTier } from "./combatDice";
import operatorsJson from "./operators.json";
import inventoryJson from "./tacticalInventory.json";

export type OperatorSource =
  | "core"
  | "year1"
  | "year2"
  | "year3"
  | "year4"
  | "year5"
  | "year6plus";

export type OperatorTeam = "Attacker" | "Defender";

export type GadgetKind = "setup" | "action" | "reaction" | "passive";

export type RangeBandId = "short" | "medium" | "long";

export interface RangeBand {
  id: RangeBandId;
  spaces: string;
  dice: CombatDiceTier[];
}

export interface Operator {
  id: string;
  name: string;
  team: OperatorTeam;
  source: OperatorSource;
  gadgetName: string;
  gadgetKind: GadgetKind;
  gadget: string[];
  stamina?: number;
  run?: number;
  destroy?: CombatDiceTier;
  weaponName?: string;
  ranges?: RangeBand[];
  notes?: string[];
  statsVerified: boolean;
}

export interface InventoryGadget {
  id: string;
  name: string;
  team: OperatorTeam | "Both";
  summary: string;
}

export const OPERATOR_SOURCE_LABELS: Record<OperatorSource, string> = {
  core: "Core",
  year1: "Year 1",
  year2: "Year 2",
  year3: "Year 3",
  year4: "Year 4",
  year5: "Year 5",
  year6plus: "Year 6+",
};

export const RANGE_BAND_LABELS: Record<RangeBandId, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
};

export const GADGET_KIND_LABELS: Record<GadgetKind, string> = {
  setup: "Setup",
  action: "Action",
  reaction: "Reaction",
  passive: "Passive",
};

export const OPERATORS: Operator[] = operatorsJson as Operator[];

export const TACTICAL_INVENTORY: InventoryGadget[] =
  inventoryJson as InventoryGadget[];

export function inventoryForTeam(team: OperatorTeam): InventoryGadget[] {
  return TACTICAL_INVENTORY.filter(
    (gadget) => gadget.team === team || gadget.team === "Both",
  );
}

/** Extractor folder for an operator id (Nøkk slug does not match `nokk`). */
export function ttsCardFolder(operatorId: string): string {
  if (operatorId === "nokk") {
    return "n-kk";
  }
  return operatorId;
}

export function ttsCardUrl(
  operatorId: string,
  role: "profile" | "portrait",
): string {
  const file = role === "profile" ? "profile.png" : "gadget.png";
  return `/tts-cards/${ttsCardFolder(operatorId)}/${file}`;
}
