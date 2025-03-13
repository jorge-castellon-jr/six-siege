// src/components/PlayerControls.tsx
import React from "react";
import { Player } from "../types";
import { Intersection } from "../utils/lineOfSight";
import { isAdmin } from "../utils/admin";

interface PlayerControlsProps {
  bluePlayer: Player | null;
  orangePlayer: Player | null;
  activeTeam: "blue" | "orange" | null;
  setActiveTeam: React.Dispatch<React.SetStateAction<"blue" | "orange" | null>>;
  hasLos: boolean | null;
  checkLineOfSight: () => void;
  intersections: Intersection[];
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  bluePlayer,
  orangePlayer,
  activeTeam,
  setActiveTeam,
  hasLos,
  checkLineOfSight,
  intersections,
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

      {hasLos !== null && (
        <div className={`los-result ${hasLos ? "has-los" : "no-los"}`}>
          {hasLos ? "Line of Sight: YES" : "Line of Sight: NO"}

          {isAdmin() && intersections.length > 0 && (
            <div className="los-details">
              <div>Intersections:</div>
              <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                {Array.from(wallIntersections.entries()).map(
                  ([wallIndex, wallPoints]) => {
                    const arePointsClose = checkIfPointsAreClose(wallPoints);
                    const arePointsValid =
                      wallPoints.length < 2 || arePointsClose;

                    return (
                      <li key={wallIndex} style={{ marginBottom: "5px" }}>
                        Wall #{wallIndex + 1} ({wallPoints.length} point
                        {wallPoints.length > 1 ? "s" : ""}):
                        {wallPoints.length >= 2 && (
                          <span
                            style={{
                              marginLeft: "5px",
                              color: arePointsValid
                                ? "var(--success)"
                                : "var(--error)",
                            }}
                          >
                            [{arePointsValid ? "Close Enough" : "Too Far Apart"}
                            ]
                          </span>
                        )}
                        <ul style={{ paddingLeft: "15px" }}>
                          {wallPoints.map((intersection, pointIndex) => (
                            <li key={pointIndex}>
                              Point {pointIndex + 1}: (
                              {intersection.point.x.toFixed(2)},{" "}
                              {intersection.point.y.toFixed(2)})
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  },
                )}
              </ul>
              {!hasLos && (
                <div style={{ marginTop: "5px", fontWeight: "bold" }}>
                  Line is blocked because it passes through points on the same
                  wall that are more than 0.05 units apart.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerControls;
