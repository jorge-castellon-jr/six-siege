// src/components/CalculatorPage.tsx
import React, { useState, useEffect } from "react";
import {
  MapData,
  Position,
  Player,
  AppPage,
  BrokenWalls,
  SmokePattern,
  Smoke,
} from "../types";
import {
  getLineOfSightDetails,
  Intersection,
  hasLineOfSightWithSmoke,
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

  // Initialize broken walls with empty arrays
  const [brokenWalls, setBrokenWalls] = useState<BrokenWalls>({
    red: [],
    orange: [],
    windows: [],
  });

  // State for smoke patterns and deployed smokes
  const [selectedSmokePattern, setSelectedSmokePattern] =
    useState<SmokePattern | null>(null);
  const [smokes, setSmokes] = useState<Smoke[]>([]);

  // Initialize all breakable walls as broken when map data changes
  useEffect(() => {
    // Get the indices of all breakable walls
    const redWallIndices = mapData.redWalls
      ? Array.from({ length: mapData.redWalls.length }, (_, i) => i)
      : [];

    const orangeWallIndices = mapData.orangeWalls
      ? Array.from({ length: mapData.orangeWalls.length }, (_, i) => i)
      : [];

    const windowIndices = mapData.windows
      ? Array.from({ length: mapData.windows.length }, (_, i) => i)
      : [];

    // Set all walls as broken by default
    setBrokenWalls({
      red: redWallIndices,
      orange: orangeWallIndices,
      windows: windowIndices,
    });

    // Reset other related states when map changes
    setHasLos(null);
    setIntersections([]);
    setProtrudingWalls([]);
    setBluePlayer(null);
    setOrangePlayer(null);
    setSmokes([]);
  }, [mapData]);

  // Handle canvas click - this is passed to GameCanvas
  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement> & {
      gridIntersection?: Position;
      gridPosition?: Position;
    },
  ) => {
    // Player mode - place players or smoke in cells
    if (event.gridPosition) {
      const { x, y } = event.gridPosition;

      // If we have a selected smoke pattern, place smoke
      if (selectedSmokePattern) {
        // Check if the smoke would fit within the grid
        if (
          x + selectedSmokePattern.width <= mapData.gridSize.width &&
          y + selectedSmokePattern.height <= mapData.gridSize.height
        ) {
          // Add new smoke
          const newSmoke: Smoke = {
            position: { x, y },
            pattern: { ...selectedSmokePattern },
          };
          setSmokes([...smokes, newSmoke]);
          setHasLos(null); // Reset line of sight

          // Reset smoke selection after deployment
          setSelectedSmokePattern(null);

          return;
        }
      }
      // Otherwise handle player placement
      else if (activeTeam === "blue") {
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

  // Check line of sight including breakable walls and smoke
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

    // Then calculate actual line of sight using all active walls (non-broken) and smoke
    const hasLineOfSight = hasLineOfSightWithSmoke(
      bluePlayer.position,
      orangePlayer.position,
      mapData.walls,
      mapData.redWalls || [],
      mapData.orangeWalls || [],
      mapData.windows || [],
      smokes,
      brokenWalls,
    );

    setHasLos(hasLineOfSight);
  };

  // Handle update of the broken walls state
  const handleBrokenWallsUpdate = (updatedBrokenWalls: BrokenWalls) => {
    setBrokenWalls(updatedBrokenWalls);
    setHasLos(null); // Reset line of sight whenever walls are toggled
  };

  // Clear all deployed smokes
  const clearSmokes = () => {
    setSmokes([]);
    setHasLos(null); // Reset line of sight when clearing smokes
  };

  // Reset walls to default (all broken)
  const resetWalls = () => {
    // Get the indices of all breakable walls
    const redWallIndices = mapData.redWalls
      ? Array.from({ length: mapData.redWalls.length }, (_, i) => i)
      : [];

    const orangeWallIndices = mapData.orangeWalls
      ? Array.from({ length: mapData.orangeWalls.length }, (_, i) => i)
      : [];

    const windowIndices = mapData.windows
      ? Array.from({ length: mapData.windows.length }, (_, i) => i)
      : [];

    // Set all walls as broken
    setBrokenWalls({
      red: redWallIndices,
      orange: orangeWallIndices,
      windows: windowIndices,
    });

    setHasLos(null); // Reset line of sight
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
        smokes={smokes}
        setSmokes={setSmokes}
        selectedSmokePattern={selectedSmokePattern}
        activeTeam={activeTeam}
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
          selectedSmokePattern={selectedSmokePattern}
          setSelectedSmokePattern={setSelectedSmokePattern}
          clearSmokes={clearSmokes}
          smokesCount={smokes.length}
          resetWalls={resetWalls} // Add this prop for resetting walls
        />
      </div>
    </div>
  );
};

export default CalculatorPage;
