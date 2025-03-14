// src/components/CalculatorPage.tsx
import React, { useState } from "react";
import { MapData, Position, Player, AppPage, BrokenWalls } from "../types";
import {
  getLineOfSightDetails,
  Intersection,
  hasLineOfSightWithBreakableWalls,
} from "../utils/lineOfSight";
import GameCanvas from "./GameCanvas";
import PlayerControls from "./PlayerControls";

interface CalculatorPageProps {
  mapData: MapData;
  onNavigate: (page: AppPage) => void;
}

const CalculatorPage: React.FC<CalculatorPageProps> = ({
  mapData,
  onNavigate,
}) => {
  // State for players
  const [bluePlayer, setBluePlayer] = useState<Player | null>(null);
  const [orangePlayer, setOrangePlayer] = useState<Player | null>(null);

  // State for active team selection
  const [activeTeam, setActiveTeam] = useState<"blue" | "orange" | null>(null);

  // State for line of sight result
  const [hasLos, setHasLos] = useState<boolean | null>(null);

  // State for line of sight intersections
  const [intersections, setIntersections] = useState<Intersection[]>([]);

  // State for protruding walls
  const [protrudingWalls, setProtrudingWalls] = useState<number[]>([]);

  // State for broken walls
  const [brokenWalls, setBrokenWalls] = useState<BrokenWalls>({
    red: [],
    orange: [],
    windows: [],
  });

  // Handle canvas click - this is passed to GameCanvas
  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement> & {
      gridIntersection?: Position;
      gridPosition?: Position;
    },
  ) => {
    // Player mode - place players in cells
    if (event.gridPosition) {
      const { x, y } = event.gridPosition;

      if (activeTeam === "blue") {
        // Place blue player when explicitly selected
        setBluePlayer({
          position: { x, y },
          team: "blue",
        });
        setActiveTeam(null);
        setHasLos(null); // Reset line of sight
        setIntersections([]);
        setProtrudingWalls([]);
      } else if (activeTeam === "orange") {
        // Place orange player when explicitly selected
        setOrangePlayer({
          position: { x, y },
          team: "orange",
        });
        setActiveTeam(null);
        setHasLos(null); // Reset line of sight
        setIntersections([]);
        setProtrudingWalls([]);
      } else {
        // Auto-placement logic when no team is explicitly selected
        if (!bluePlayer) {
          // If no blue player exists, place blue player
          setBluePlayer({
            position: { x, y },
            team: "blue",
          });
          setHasLos(null); // Reset line of sight
          setIntersections([]);
          setProtrudingWalls([]);
        } else if (!orangePlayer) {
          // If blue exists but no orange, place orange player
          setOrangePlayer({
            position: { x, y },
            team: "orange",
          });
          setHasLos(null); // Reset line of sight
          setIntersections([]);
          setProtrudingWalls([]);
        }
        // If both players exist, do nothing on direct click
      }
    }
  };

  // Check line of sight including breakable walls
  const checkLineOfSight = () => {
    if (!bluePlayer || !orangePlayer) return;

    // First run standard line of sight analysis (for visualization purposes)
    const result = getLineOfSightDetails(
      bluePlayer.position,
      orangePlayer.position,
      mapData.walls,
    );

    setIntersections(result.intersections);
    setProtrudingWalls(result.protrudingWalls);

    // Then calculate actual line of sight using all active walls (non-broken)
    const hasLineOfSight = hasLineOfSightWithBreakableWalls(
      bluePlayer.position,
      orangePlayer.position,
      mapData.walls,
      mapData.redWalls || [],
      mapData.orangeWalls || [],
      mapData.windows || [],
      brokenWalls,
    );

    setHasLos(hasLineOfSight);
  };

  // Handle update of the broken walls state
  const handleBrokenWallsUpdate = (updatedBrokenWalls: BrokenWalls) => {
    setBrokenWalls(updatedBrokenWalls);
    setHasLos(null); // Reset line of sight whenever walls are toggled
  };

  return (
    <div className="calculator-page">
      <div className="page-header">
        <button onClick={() => onNavigate("home")} className="back-button">
          ← Back to Map Selection
        </button>
        <h1>{mapData.name}</h1>
      </div>

      <GameCanvas
        mapData={mapData}
        bluePlayer={bluePlayer}
        orangePlayer={orangePlayer}
        hasLos={hasLos}
        isAdminMode={false}
        wallStart={null}
        onCanvasClick={handleCanvasClick}
        selectedWallIndex={null}
        setSelectedWallIndex={() => { }}
        setBluePlayer={setBluePlayer}
        setOrangePlayer={setOrangePlayer}
        setHasLos={setHasLos}
        intersections={intersections}
        brokenWalls={brokenWalls}
        onBrokenWallsUpdate={handleBrokenWallsUpdate}
      />
      <div className="player-spacer" />

      <div className="calculator-controls">
        <PlayerControls
          bluePlayer={bluePlayer}
          orangePlayer={orangePlayer}
          activeTeam={activeTeam}
          setActiveTeam={setActiveTeam}
          hasLos={hasLos}
          checkLineOfSight={checkLineOfSight}
          intersections={intersections}
          protrudingWalls={protrudingWalls}
        />
      </div>
    </div>
  );
};

export default CalculatorPage;
