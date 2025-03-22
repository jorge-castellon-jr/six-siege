// src/components/hidden/LineOfSight.tsx
import React, { useEffect, useState } from "react";
import TacticalHeader from "./TacticalHeader";
import "./LineOfSight.css";
import CalculatorPage from "../CalculatorPage";

import consulateData from "../../data/consulate.json";
import clubhouseData from "../../data/clubhouse.json";
// import clubhouseData2 from "./data/clubhouse2.json";
import bankData from "../../data/bank.json";
import kafeData from "../../data/kafe.json";
import chaletData from "../../data/chalet.json";
import oregonData from "../../data/oregon.json";
import coastlineData from "../../data/coastline.json";
import borderData from "../../data/border.json";
import {
  BrokenWalls,
  MapData,
  Player,
  Position,
  Smoke,
  SmokePattern,
} from "../../types";
import GameCanvas from "../GameCanvas";
import {
  getLineOfSightDetails,
  hasLineOfSightWithSmoke,
  Intersection,
} from "../../utils/lineOfSight";

const LineOfSight: React.FC = () => {
  // Available maps
  const maps: MapData[] = [
    consulateData,
    clubhouseData,
    // clubhouseData2,
    bankData,
    kafeData,
    chaletData,
    oregonData,
    coastlineData,
    borderData,
  ];

  const [selectedMap, setSelectedMap] = useState<MapData>(maps[0]);
  // Handle map change
  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(
      maps.find((map) => map.id === event.target.value) ?? maps[0],
    );
    resetPositions();
  };
  const resetPositions = () => {
    console.log(orangePlayer);
    setBluePlayer(null);
    setOrangePlayer(null);
    setActiveTeam("blue");
  };

  // State for players
  const [bluePlayer, setBluePlayer] = useState<Player | null>(null);
  const [orangePlayer, setOrangePlayer] = useState<Player | null>(null);

  // State for active team selection
  const [activeTeam, setActiveTeam] = useState<"blue" | "orange" | null>(
    "blue",
  );

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
    const redWallIndices = selectedMap.redWalls
      ? Array.from({ length: selectedMap.redWalls.length }, (_, i) => i)
      : [];

    const orangeWallIndices = selectedMap.orangeWalls
      ? Array.from({ length: selectedMap.orangeWalls.length }, (_, i) => i)
      : [];

    const windowIndices = selectedMap.windows
      ? Array.from({ length: selectedMap.windows.length }, (_, i) => i)
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
  }, [selectedMap]);

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
          x + selectedSmokePattern.width <= selectedMap.gridSize.width &&
          y + selectedSmokePattern.height <= selectedMap.gridSize.height
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
        setActiveTeam("orange");
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
        console.log(orangePlayer);
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

  useEffect(() => {
    setTimeout(() => checkLineOfSight(), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bluePlayer, orangePlayer]);

  // Check line of sight including breakable walls and smoke
  const checkLineOfSight = () => {
    if (!bluePlayer || !orangePlayer) return;

    // First run standard line of sight analysis (for visualization purposes)
    const result = getLineOfSightDetails(
      bluePlayer.position,
      orangePlayer.position,
      selectedMap.walls,
    );

    setIntersections(result.intersections);
    setProtrudingWalls(result.protrudingWalls);

    // Then calculate actual line of sight using all active walls (non-broken) and smoke
    const hasLineOfSight = hasLineOfSightWithSmoke(
      bluePlayer.position,
      orangePlayer.position,
      selectedMap.walls,
      selectedMap.redWalls || [],
      selectedMap.orangeWalls || [],
      selectedMap.windows || [],
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

  return (
    <div className="los-tool">
      <TacticalHeader title="Line of Sight Calculator" />

      <div className="tactical-panel tactical-panel-hex">
        <div className="tactical-panel-header">
          <h3 className="tactical-panel-title">Map Selection</h3>
          <div className="los-map-selector">
            <select
              className="tactical-select"
              value={selectedMap.name}
              onChange={handleMapChange}
            >
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tactical-panel-body">
          <div className="los-controls">
            <div className="player-indicators">
              <div
                className={`player-indicator ${activeTeam === "blue" ? "active" : ""}`}
              >
                <div className="player-color attacker"></div>
                <span>Attacker</span>
                {bluePlayer && (
                  <div className="player-position">
                    Position: {bluePlayer.position.x}, {bluePlayer.position.y}
                  </div>
                )}
              </div>

              <div
                className={`player-indicator ${activeTeam === "orange" ? "active" : ""}`}
              >
                <div className="player-color defender"></div>
                <span>Defender</span>
                {orangePlayer && (
                  <div className="player-position">
                    Position: {orangePlayer.position.x},{" "}
                    {orangePlayer.position.y}
                  </div>
                )}
              </div>
            </div>

            <button
              className="tactical-btn tactical-btn-primary tactical-btn-notched"
              onClick={resetPositions}
            >
              Reset Positions
            </button>
          </div>

          {/* <CalculatorPage */}
          {/*   mapData={selectedMap} */}
          {/*   onNavigate={() => void 0} */}
          {/*   isNew */}
          {/* /> */}
          <GameCanvas
            mapData={selectedMap}
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

          {hasLos !== null && (
            <div className={`los-result ${hasLos ? "has-los" : "no-los"}`}>
              <div className="los-result-icon">{hasLos ? "✓" : "✕"}</div>
              <div className="los-result-text">
                {hasLos
                  ? "Line of sight exists between operators"
                  : "No line of sight between operators"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tactical-panel">
        <div className="tactical-panel-header">
          <h3 className="tactical-panel-title">Line of Sight Rules</h3>
        </div>

        <div className="tactical-panel-body">
          <ul className="tactical-list">
            <li>
              Line of sight is determined by drawing a straight line between the
              centers of operators' positions
            </li>
            <li>Line of sight is blocked by walls and obstacles</li>
            <li>Operators cannot see through multiple walls</li>
            <li>
              If the line passes through the corner of a wall, sight is blocked
            </li>
            <li>
              Adjacent operators always have line of sight unless directly
              separated by a wall
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LineOfSight;
