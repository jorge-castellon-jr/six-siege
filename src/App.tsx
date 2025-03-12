// src/App.tsx
import React, { useState } from "react";
import { Position, Wall, Player, MapData } from "./types";
import { hasLineOfSight } from "./utils/lineOfSight";
import AdminPanel from "./components/AdminPanel";
import PlayerControls from "./components/PlayerControls";
import GameCanvas from "./components/GameCanvas";
import "./App.css";

const App: React.FC = () => {
  const [imageDimensions, setImageDimensions] = useState({
    width: 800,
    height: 600,
  }); // State for the map data
  const [mapData, setMapData] = useState<MapData>({
    name: "Default Map",
    imagePath: "",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  });

  // State for players
  const [bluePlayer, setBluePlayer] = useState<Player | null>(null);
  const [orangePlayer, setOrangePlayer] = useState<Player | null>(null);

  // State for admin mode
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // State for wall drawing
  const [wallStart, setWallStart] = useState<Position | null>(null);

  // State for current wall properties
  const [currentWallProps, setCurrentWallProps] = useState({
    thickness: 0.2, // Default thickness
    offset: 0, // Default centered
    startExtension: 0, // Default no extension
    endExtension: 0, // Default no extension
  });

  // State for line of sight result
  const [hasLos, setHasLos] = useState<boolean | null>(null);

  // State for active team selection
  const [activeTeam, setActiveTeam] = useState<"blue" | "orange" | null>(null);

  // State for selected wall (for editing)
  const [selectedWallIndex, setSelectedWallIndex] = useState<number | null>(
    null,
  );

  // Handle canvas click - this is passed to GameCanvas
  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement> & {
      gridIntersection?: Position;
      gridPosition?: Position;
    },
  ) => {
    // Admin mode - create walls at grid intersections
    if (isAdminMode && event.gridIntersection) {
      const intersectionPos = event.gridIntersection;

      if (wallStart === null) {
        // Start new wall at the grid intersection
        setWallStart(intersectionPos);
      } else {
        // Complete wall between intersections
        const newWall: Wall = {
          start: wallStart,
          end: intersectionPos,
          thickness: currentWallProps.thickness,
          offset: currentWallProps.offset,
          startExtension: currentWallProps.startExtension,
          endExtension: currentWallProps.endExtension,
        };

        // Don't add walls with same start and end
        if (
          wallStart.x !== intersectionPos.x ||
          wallStart.y !== intersectionPos.y
        ) {
          setMapData({
            ...mapData,
            walls: [...mapData.walls, newWall],
          });
        }

        setWallStart(null);
      }
      return;
    }

    // Player mode - place players in cells
    if (!isAdminMode && event.gridPosition) {
      const { x, y } = event.gridPosition;

      if (activeTeam === "blue") {
        setBluePlayer({
          position: { x, y },
          team: "blue",
        });
        setActiveTeam(null);
      } else if (activeTeam === "orange") {
        setOrangePlayer({
          position: { x, y },
          team: "orange",
        });
        setActiveTeam(null);
      }

      // Reset LoS result when players move
      setHasLos(null);
    }
  };

  // Check line of sight
  const checkLineOfSight = () => {
    if (!bluePlayer || !orangePlayer) return;

    const result = hasLineOfSight(
      bluePlayer.position,
      orangePlayer.position,
      mapData.walls,
    );

    setHasLos(result);
  };

  // Update a wall's properties
  const updateWall = (index: number, props: Partial<Wall>) => {
    if (index < 0 || index >= mapData.walls.length) return;

    const updatedWalls = [...mapData.walls];
    updatedWalls[index] = { ...updatedWalls[index], ...props };

    setMapData({
      ...mapData,
      walls: updatedWalls,
    });
  };

  return (
    <div className="app">
      <h1>Rainbow Six: Siege Line of Sight Calculator</h1>

      <GameCanvas
        mapData={mapData}
        bluePlayer={bluePlayer}
        orangePlayer={orangePlayer}
        hasLos={hasLos}
        isAdminMode={isAdminMode}
        wallStart={wallStart}
        onCanvasClick={handleCanvasClick}
        setImageDimensions={setImageDimensions}
        selectedWallIndex={selectedWallIndex}
        setSelectedWallIndex={setSelectedWallIndex}
      />
      {isAdminMode && <div className="spacer" />}

      <div className="controls">
        <div className="mode-toggle">
          <label>
            <input
              type="checkbox"
              checked={isAdminMode}
              onChange={() => {
                setIsAdminMode(!isAdminMode);
                setActiveTeam(null);
                setWallStart(null);
                setSelectedWallIndex(null);
              }}
            />
            Admin Mode
          </label>
        </div>

        {isAdminMode ? (
          <AdminPanel
            mapData={mapData}
            setMapData={setMapData}
            wallStart={wallStart}
            setWallStart={setWallStart}
            imageDimensions={imageDimensions}
            currentWallProps={currentWallProps}
            setCurrentWallProps={setCurrentWallProps}
            selectedWallIndex={selectedWallIndex}
            setSelectedWallIndex={setSelectedWallIndex}
            updateWall={updateWall}
          />
        ) : (
          <PlayerControls
            bluePlayer={bluePlayer}
            orangePlayer={orangePlayer}
            activeTeam={activeTeam}
            setActiveTeam={setActiveTeam}
            hasLos={hasLos}
            checkLineOfSight={checkLineOfSight}
          />
        )}
      </div>
    </div>
  );
};

export default App;
