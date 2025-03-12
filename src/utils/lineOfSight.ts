// src/utils/lineOfSight.ts
import { Position, Wall } from "../types";

/**
 * Check if two line segments intersect
 */
export function doLinesIntersect(
  line1Start: Position,
  line1End: Position,
  line2Start: Position,
  line2End: Position,
): boolean {
  // Calculate line directions
  const x1 = line1End.x - line1Start.x;
  const y1 = line1End.y - line1Start.y;
  const x2 = line2End.x - line2Start.x;
  const y2 = line2End.y - line2Start.y;

  // Calculate determinant
  const det = x1 * y2 - y1 * x2;

  // If determinant is zero, lines are parallel
  if (det === 0) return false;

  // Calculate relative positions
  const dx = line2Start.x - line1Start.x;
  const dy = line2Start.y - line1Start.y;

  // Calculate parameters
  const t = (dx * y2 - dy * x2) / det;
  const s = (dx * y1 - dy * x1) / det;

  // Check if intersection point lies on both line segments
  return t >= 0 && t <= 1 && s >= 0 && s <= 1;
}

/**
 * Get the center point of a grid cell
 */
export function getCellCenter(position: Position): Position {
  return {
    x: position.x + 0.5,
    y: position.y + 0.5,
  };
}

/**
 * Check if there's a clear line of sight between two positions
 */
export function hasLineOfSight(
  pos1: Position,
  pos2: Position,
  walls: Wall[],
): boolean {
  // Convert grid positions to cell centers for line of sight check
  const center1 = getCellCenter(pos1);
  const center2 = getCellCenter(pos2);

  // Check each wall to see if it blocks the line of sight
  for (const wall of walls) {
    if (doLinesIntersect(center1, center2, wall.start, wall.end)) {
      return false;
    }
  }

  // No walls block the line of sight
  return true;
}
