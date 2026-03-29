export type CombatDiceTier = "yellow" | "orange" | "red";

export const COMBAT_DICE_FACES: Record<
  CombatDiceTier,
  readonly [number, number, number, number, number, number]
> = {
  yellow: [2, 2, 1, 1, 0, 0],
  orange: [2, 2, 1, 1, 3, 0],
  red: [2, 2, 1, 1, 3, 3],
};

export const COMBAT_DICE_META: Record<
  CombatDiceTier,
  { label: string; color: string }
> = {
  yellow: { label: "Yellow", color: "#f5c518" },
  orange: { label: "Orange", color: "#ff7b00" },
  red: { label: "Red", color: "#e53935" },
};

export function rollCombatDie(tier: CombatDiceTier): number {
  const faceIndex = Math.floor(Math.random() * 6);
  return COMBAT_DICE_FACES[tier][faceIndex];
}
