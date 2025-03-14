// src/utils/lineOfSight.ts
import { Position, Wall, BrokenWalls } from "../types";

// Default line thickness in grid units (can be adjusted)
export const DEFAULT_LINE_THICKNESS = 0.03;

// Tolerance for considering multiple intersections as one
export const INTERSECTION_TOLERANCE = 0.05;

/**
 * Information about an intersection between a line and a wall
 */
export interface Intersection {
  wallIndex: number;
  point: Position;
  edgeIndex: number; // Index of the edge in the wall polygon
  distance?: number; // Distance from line to point (for thick line calculations)
  side?: number; // Which side of the line the point is on (-1, 0, or 1)
}

/**
 * Detailed result of a line of sight check
 */
export interface LineOfSightResult {
  hasLineOfSight: boolean;
  intersections: Intersection[];
  protrudingWalls: number[]; // Walls that protrude through both sides of the line
}

/**
 * Result of checking if two line segments intersect
 */
interface IntersectionDetail {
  intersects: boolean;
  point?: Position;
  t?: number; // Parameter for line1
  s?: number; // Parameter for line2
}

/**
 * Check if two line segments intersect
 */
export function doLinesIntersect(
  line1Start: Position,
  line1End: Position,
  line2Start: Position,
  line2End: Position,
): IntersectionDetail {
  // Calculate line directions
  const x1 = line1End.x - line1Start.x;
  const y1 = line1End.y - line1Start.y;
  const x2 = line2End.x - line2Start.x;
  const y2 = line2End.y - line2Start.y;

  // Calculate determinant
  const det = x1 * y2 - y1 * x2;

  // If determinant is zero, lines are parallel
  if (Math.abs(det) < 1e-10) return { intersects: false };

  // Calculate relative positions
  const dx = line2Start.x - line1Start.x;
  const dy = line2Start.y - line1Start.y;

  // Calculate parameters
  const t = (dx * y2 - dy * x2) / det;
  const s = (dx * y1 - dy * x1) / det;

  // Check if intersection point lies on both line segments
  if (t >= 0 && t <= 1 && s >= 0 && s <= 1) {
    // Calculate intersection point
    const intersectionX = line1Start.x + t * (line1End.x - line1Start.x);
    const intersectionY = line1Start.y + t * (line1End.y - line1Start.y);

    return {
      intersects: true,
      point: { x: intersectionX, y: intersectionY },
      t,
      s,
    };
  }

  return { intersects: false };
}

/**
 * Calculate the Euclidean distance between two points
 */
export function getDistance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the minimum distance from a point to a line segment
 */
function distanceFromPointToLine(
  point: Position,
  lineStart: Position,
  lineEnd: Position,
): number {
  const lineLength = getDistance(lineStart, lineEnd);

  if (lineLength === 0) {
    // Line is actually a point
    return getDistance(point, lineStart);
  }

  // Calculate the projection of the point onto the line
  const t =
    ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
      (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
    (lineLength * lineLength);

  // Clamp t to [0, 1] for a line segment
  const tClamped = Math.max(0, Math.min(1, t));

  // Find the closest point on the line segment
  const closestX = lineStart.x + tClamped * (lineEnd.x - lineStart.x);
  const closestY = lineStart.y + tClamped * (lineEnd.y - lineStart.y);

  // Return the distance to the closest point
  return getDistance(point, { x: closestX, y: closestY });
}

/**
 * Calculate which side of a line a point is on
 * Returns:
 *  1 if on positive side
 * -1 if on negative side
 *  0 if on the line (within a small epsilon)
 */
function getSideOfLine(
  point: Position,
  lineStart: Position,
  lineEnd: Position,
): number {
  // Vector from start to end
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // Vector from start to point
  const px = point.x - lineStart.x;
  const py = point.y - lineStart.y;

  // Cross product: determines which side the point is on
  const cross = dx * py - dy * px;

  // Epsilon for "on the line" determination (adjust as needed)
  const epsilon = 1e-10;

  if (Math.abs(cross) < epsilon) return 0; // On the line
  return cross > 0 ? 1 : -1; // Positive or negative side
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
 * Check if a wall protrudes through both sides of a thick line
 * Returns true if the wall has points on both sides of the line
 */
function checkWallProtrusion(
  wallCorners: Position[],
  lineStart: Position,
  lineEnd: Position,
  lineThickness: number = 0,
): boolean {
  const halfThickness = lineThickness / 2;

  // Track if we've found points on both sides
  let hasPositiveSide = false;
  let hasNegativeSide = false;

  // Check each corner of the wall
  for (const corner of wallCorners) {
    // First, calculate the distance to the line
    const distance = distanceFromPointToLine(corner, lineStart, lineEnd);

    // If point is within the line thickness, it doesn't count as protruding
    if (distance <= halfThickness) {
      continue;
    }

    // Determine which side of the line this point is on
    const side = getSideOfLine(corner, lineStart, lineEnd);

    if (side > 0) hasPositiveSide = true;
    if (side < 0) hasNegativeSide = true;

    // If we've found points on both sides, we can exit early
    if (hasPositiveSide && hasNegativeSide) {
      return true;
    }
  }

  // Wall doesn't protrude if all points are on the same side or within the line
  return hasPositiveSide && hasNegativeSide;
}

/**
 * Check if a line intersects with a polygon (wall), considering line thickness and protrusion
 */
function doesLineIntersectPolygon(
  lineStart: Position,
  lineEnd: Position,
  polygonPoints: Position[],
  wallIndex: number,
  lineThickness: number = 0,
): { intersections: Intersection[]; protrudes: boolean } {
  const intersections: Intersection[] = [];
  const halfThickness = lineThickness / 2;

  // First, check standard line intersections (thin line)
  for (let i = 0; i < polygonPoints.length; i++) {
    const j = (i + 1) % polygonPoints.length;

    const result = doLinesIntersect(
      lineStart,
      lineEnd,
      polygonPoints[i],
      polygonPoints[j],
    );

    if (result.intersects && result.point) {
      // Calculate which side of the line this point is on
      const side = getSideOfLine(result.point, lineStart, lineEnd);

      intersections.push({
        wallIndex,
        point: result.point,
        edgeIndex: i,
        distance: 0, // Direct intersection, so distance is 0
        side,
      });
    }
  }

  // For thick lines, check the distance from each wall point to the line
  for (let i = 0; i < polygonPoints.length; i++) {
    const point = polygonPoints[i];
    const distance = distanceFromPointToLine(point, lineStart, lineEnd);

    // Calculate which side of the line this point is on
    const side = getSideOfLine(point, lineStart, lineEnd);

    // If the point is within half the line thickness, include it as intersection
    if (distance <= halfThickness) {
      // Check if we already have this point (from the direct intersection check)
      const exists = intersections.some(
        (intr) =>
          Math.abs(intr.point.x - point.x) < 1e-5 &&
          Math.abs(intr.point.y - point.y) < 1e-5,
      );

      if (!exists) {
        intersections.push({
          wallIndex,
          point,
          edgeIndex: i,
          distance,
          side,
        });
      }
    }
  }

  // Check if this wall protrudes through both sides of the line
  const protrudes = checkWallProtrusion(
    polygonPoints,
    lineStart,
    lineEnd,
    lineThickness,
  );

  return { intersections, protrudes };
}

/**
 * Check if there's a clear line of sight between two positions,
 * considering wall thickness, offset, extensions, and protrusion.
 * Also takes broken walls into account.
 */
export function hasLineOfSight(
  pos1: Position,
  pos2: Position,
  walls: Wall[],
  lineThickness: number = DEFAULT_LINE_THICKNESS,
): boolean {
  const result = getLineOfSightDetails(pos1, pos2, walls, lineThickness);
  return result.hasLineOfSight;
}

/**
 * Get detailed information about the line of sight check,
 * taking into account broken walls.
 */
export function getLineOfSightDetails(
  pos1: Position,
  pos2: Position,
  walls: Wall[],
  lineThickness: number = DEFAULT_LINE_THICKNESS,
): LineOfSightResult {
  // Convert grid positions to cell centers for line of sight check
  const center1 = getCellCenter(pos1);
  const center2 = getCellCenter(pos2);

  const allIntersections: Intersection[] = [];
  const protrudingWalls: number[] = [];

  // Check each wall for intersections
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    const corners = getWallCorners(wall);

    const { intersections, protrudes } = doesLineIntersectPolygon(
      center1,
      center2,
      corners,
      i,
      lineThickness,
    );
    allIntersections.push(...intersections);

    if (protrudes) {
      protrudingWalls.push(i);
    }
  }

  // Group intersections by wall
  const wallIntersections = new Map<number, Intersection[]>();

  for (const intersection of allIntersections) {
    if (!wallIntersections.has(intersection.wallIndex)) {
      wallIntersections.set(intersection.wallIndex, []);
    }
    wallIntersections.get(intersection.wallIndex)!.push(intersection);
  }

  // Block line of sight only if:
  // 1. Wall protrudes through both sides of the line, AND
  // 2. The line passes through two points of the same wall that are separated by more than the tolerance
  let blocked = false;

  for (const wallIndex of protrudingWalls) {
    const intersections = wallIntersections.get(wallIndex) || [];

    if (intersections.length >= 2) {
      // Check if any pair of points is separated by more than the tolerance
      let validIntersection = true;

      // If all points are close to each other, consider them as a single intersection
      for (let i = 0; i < intersections.length; i++) {
        for (let j = i + 1; j < intersections.length; j++) {
          const dist = getDistance(
            intersections[i].point,
            intersections[j].point,
          );
          if (dist > INTERSECTION_TOLERANCE) {
            // Points are far enough apart to be considered separate intersections
            validIntersection = false;
            break;
          }
        }
        if (!validIntersection) break;
      }

      if (!validIntersection) {
        blocked = true;
        break;
      }
    }
  }

  return {
    hasLineOfSight: !blocked,
    intersections: allIntersections,
    protrudingWalls,
  };
}

/**
 * Modified line of sight function that takes into account broken walls.
 * It filters out broken walls from the calculation.
 */
export function hasLineOfSightWithBreakableWalls(
  pos1: Position,
  pos2: Position,
  mainWalls: Wall[],
  redWalls: Wall[] = [],
  orangeWalls: Wall[] = [],
  windows: Wall[] = [],
  brokenWalls: BrokenWalls,
  lineThickness: number = DEFAULT_LINE_THICKNESS,
): boolean {
  // Start with all main walls (unbreakable)
  const activeWalls = [...mainWalls];

  // Add only the red walls that aren't broken
  redWalls.forEach((wall, index) => {
    if (!brokenWalls.red.includes(index)) {
      activeWalls.push(wall);
    }
  });

  // Add only the orange walls that aren't broken
  orangeWalls.forEach((wall, index) => {
    if (!brokenWalls.orange.includes(index)) {
      activeWalls.push(wall);
    }
  });

  // Add only the windows that aren't broken
  windows.forEach((wall, index) => {
    if (!brokenWalls.windows.includes(index)) {
      activeWalls.push(wall);
    }
  });

  // Run the standard line of sight check with only the active walls
  return hasLineOfSight(pos1, pos2, activeWalls, lineThickness);
}
