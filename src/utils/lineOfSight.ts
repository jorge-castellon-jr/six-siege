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
 * Get the normalized direction vector
 */
function getNormalizedDirection(start: Position, end: Position): Position {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return { x: 0, y: 0 };

  return {
    x: dx / length,
    y: dy / length,
  };
}

/**
 * Get the perpendicular vector
 */
function getPerpendicularVector(direction: Position): Position {
  return {
    x: -direction.y,
    y: direction.x,
  };
}

/**
 * Convert a wall to its four corner points
 */
function getWallCorners(wall: Wall): [Position, Position, Position, Position] {
  // Get the direction vector of the wall
  const direction = getNormalizedDirection(wall.start, wall.end);

  // Get perpendicular vector for thickness and offset
  const perpendicular = getPerpendicularVector(direction);

  // Apply extensions to start and end
  const extendedStart = {
    x: wall.start.x - direction.x * wall.startExtension,
    y: wall.start.y - direction.y * wall.startExtension,
  };

  const extendedEnd = {
    x: wall.end.x + direction.x * wall.endExtension,
    y: wall.end.y + direction.y * wall.endExtension,
  };

  // Apply offset
  const offsetX = perpendicular.x * wall.offset;
  const offsetY = perpendicular.y * wall.offset;

  // Calculate half thickness
  const halfThickness = wall.thickness / 2;

  // Calculate corners
  const topLeft = {
    x: extendedStart.x + offsetX - perpendicular.x * halfThickness,
    y: extendedStart.y + offsetY - perpendicular.y * halfThickness,
  };

  const topRight = {
    x: extendedEnd.x + offsetX - perpendicular.x * halfThickness,
    y: extendedEnd.y + offsetY - perpendicular.y * halfThickness,
  };

  const bottomRight = {
    x: extendedEnd.x + offsetX + perpendicular.x * halfThickness,
    y: extendedEnd.y + offsetY + perpendicular.y * halfThickness,
  };

  const bottomLeft = {
    x: extendedStart.x + offsetX + perpendicular.x * halfThickness,
    y: extendedStart.y + offsetY + perpendicular.y * halfThickness,
  };

  return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Check if a line intersects a polygon
 */
function doesLineIntersectPolygon(
  lineStart: Position,
  lineEnd: Position,
  polygonPoints: Position[],
): boolean {
  // Check intersection with each edge of the polygon
  for (let i = 0; i < polygonPoints.length; i++) {
    const j = (i + 1) % polygonPoints.length;

    if (
      doLinesIntersect(lineStart, lineEnd, polygonPoints[i], polygonPoints[j])
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if there's a clear line of sight between two positions,
 * considering wall thickness, offset, and extensions
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
    // Get the four corners of the wall
    const corners = getWallCorners(wall);

    // Check if the line intersects with the wall polygon
    if (doesLineIntersectPolygon(center1, center2, corners)) {
      return false;
    }
  }

  // No walls block the line of sight
  return true;
}
