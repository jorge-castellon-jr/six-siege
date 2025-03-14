// src/components/PlayerControls.tsx
import React from "react";
import { Player, SmokePattern } from "../types";
import { Intersection, DEFAULT_LINE_THICKNESS } from "../utils/lineOfSight";
import { isAdmin } from "../utils/admin";

interface PlayerControlsProps {
  bluePlayer: Player | null;
  orangePlayer: Player | null;
  activeTeam: "blue" | "orange" | null;
  setActiveTeam: React.Dispatch<React.SetStateAction<"blue" | "orange" | null>>;
  hasLos: boolean | null;
  checkLineOfSight: () => void;
  intersections: Intersection[];
  protrudingWalls?: number[]; // Prop for protruding walls
  selectedSmokePattern: SmokePattern | null;
  setSelectedSmokePattern: React.Dispatch<
    React.SetStateAction<SmokePattern | null>
  >;
  clearSmokes: () => void;
  smokesCount: number;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  bluePlayer,
  orangePlayer,
  activeTeam,
  setActiveTeam,
  hasLos,
  checkLineOfSight,
  intersections,
  protrudingWalls = [], // Default to empty array if not provided
  selectedSmokePattern,
  setSelectedSmokePattern,
  clearSmokes,
  smokesCount,
}) => {
  // Group intersections by wall
  const wallIntersections = new Map<number, Intersection[]>();
  intersections.forEach((intersection) => {
    if (!wallIntersections.has(intersection.wallIndex)) {
      wallIntersections.set(intersection.wallIndex, []);
    }
    wallIntersections.get(intersection.wallIndex)?.push(intersection);
  });

  // Function to check if points are close enough to be considered as one intersection
  const checkIfPointsAreClose = (intersections: Intersection[]): boolean => {
    const TOLERANCE = 0.05;

    // If there's only one point, it's always valid
    if (intersections.length <= 1) return true;

    // Check if all points are within the tolerance distance of each other
    for (let i = 0; i < intersections.length; i++) {
      for (let j = i + 1; j < intersections.length; j++) {
        const dx = Math.abs(
          intersections[i].point.x - intersections[j].point.x,
        );
        const dy = Math.abs(
          intersections[i].point.y - intersections[j].point.y,
        );
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > TOLERANCE) {
          // Found points that are far enough apart to be considered separate
          return false;
        }
      }
    }

    // All points are close to each other
    return true;
  };

  return (
    <div className="player-controls">
      <div className="controls-main">
        <button
          onClick={() => setActiveTeam("blue")}
          disabled={activeTeam === "blue"}
          className={`blue-button ${bluePlayer ? "player-placed" : ""}`}
        >
          {bluePlayer ? "Blue Player ✓" : "Place Blue Player"}
        </button>

        <button
          onClick={() => setActiveTeam("orange")}
          disabled={activeTeam === "orange"}
          className={`orange-button ${orangePlayer ? "player-placed" : ""}`}
        >
          {orangePlayer ? "Orange Player ✓" : "Place Orange Player"}
        </button>

        <button
          onClick={checkLineOfSight}
          disabled={!bluePlayer || !orangePlayer}
          className="check-los-button"
        >
          Check Line of Sight
        </button>
      </div>

      {hasLos !== null && (
        <div className={`los-result ${hasLos ? "has-los" : "no-los"}`}>
          {hasLos ? "Line of Sight: YES" : "Line of Sight: NO"}

          {isAdmin() && intersections.length > 0 && (
            <div className="los-details">
              <div>Intersections:</div>
              <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                {Array.from(wallIntersections.entries()).map(
                  ([wallIndex, wallPoints]) => {
                    const isProtruding = protrudingWalls.includes(wallIndex);
                    const arePointsClose = checkIfPointsAreClose(wallPoints);
                    const arePointsValid =
                      wallPoints.length < 2 || arePointsClose;

                    return (
                      <li key={wallIndex} style={{ marginBottom: "5px" }}>
                        Wall #{wallIndex + 1} ({wallPoints.length} point
                        {wallPoints.length > 1 ? "s" : ""}):
                        <span
                          style={{
                            marginLeft: "5px",
                            color: isProtruding
                              ? "var(--error)"
                              : "var(--success)",
                          }}
                        >
                          [{isProtruding ? "Protrudes" : "Doesn't Protrude"}]
                        </span>
                        {wallPoints.length >= 2 && (
                          <span
                            style={{
                              marginLeft: "5px",
                              color: arePointsValid
                                ? "var(--success)"
                                : "var(--error)",
                            }}
                          >
                            [{arePointsValid ? "Close Points" : "Far Points"}]
                          </span>
                        )}
                        <ul style={{ paddingLeft: "15px" }}>
                          {wallPoints.map((intersection, pointIndex) => (
                            <li key={pointIndex}>
                              Point {pointIndex + 1}: (
                              {intersection.point.x.toFixed(2)},{" "}
                              {intersection.point.y.toFixed(2)})
                              {intersection.distance !== undefined && (
                                <span className="distance-info">
                                  {" "}
                                  - Distance: {intersection.distance.toFixed(3)}
                                </span>
                              )}
                              {intersection.side !== undefined && (
                                <span className="side-info">
                                  {intersection.side === 0
                                    ? " - On line"
                                    : intersection.side > 0
                                      ? " - Above line"
                                      : " - Below line"}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  },
                )}
              </ul>
              <div className="intersection-info">
                <p>
                  Current line thickness:{" "}
                  <strong>{DEFAULT_LINE_THICKNESS}</strong> grid units
                </p>
                <p>
                  Protruding walls:{" "}
                  {protrudingWalls.length > 0
                    ? protrudingWalls.map((w) => w + 1).join(", ")
                    : "None"}
                </p>
                {!hasLos && (
                  <div style={{ marginTop: "5px", fontWeight: "bold" }}>
                    Line is blocked because wall(s) protrude through both sides
                    of the line AND have multiple intersection points that are
                    far apart.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smoke Overlay Controls */}
      <div className="smoke-controls flex gap-5 items-center">
        <h4>Deploy Smoke</h4>
        <div className="smoke-patterns">
          <button
            className={`smoke-pattern ${selectedSmokePattern?.width === 2 && selectedSmokePattern?.height === 2 ? "selected" : ""}`}
            onClick={() => setSelectedSmokePattern({ width: 2, height: 2 })}
          >
            <div className="smoke-preview smoke-2x2">
              <div className="smoke-cell"></div>
              <div className="smoke-cell"></div>
              <div className="smoke-cell"></div>
              <div className="smoke-cell"></div>
            </div>
          </button>
          <button
            className={`smoke-pattern ${selectedSmokePattern?.width === 2 && selectedSmokePattern?.height === 1 ? "selected" : ""}`}
            onClick={() => setSelectedSmokePattern({ width: 2, height: 1 })}
          >
            <div className="smoke-preview smoke-2x1">
              <div className="smoke-cell"></div>
              <div className="smoke-cell"></div>
            </div>
          </button>
          <button
            className={`smoke-pattern ${selectedSmokePattern?.width === 1 && selectedSmokePattern?.height === 2 ? "selected" : ""}`}
            onClick={() => setSelectedSmokePattern({ width: 1, height: 2 })}
          >
            <div className="smoke-preview smoke-1x2">
              <div className="smoke-cell"></div>
              <div className="smoke-cell"></div>
            </div>
          </button>
        </div>
      </div>

      {selectedSmokePattern && (
        <div className="instructions" style={{ marginTop: "10px" }}>
          Click on the map to place the {selectedSmokePattern.width}×
          {selectedSmokePattern.height} smoke
        </div>
      )}

      {smokesCount > 0 && (
        <>
          <div className="instructions">
            Click on a deployed smoke to remove it
          </div>
          <button onClick={clearSmokes} className="clear-smokes-button">
            Clear All Smokes ({smokesCount})
          </button>
        </>
      )}
    </div>
  );
};

export default PlayerControls;
