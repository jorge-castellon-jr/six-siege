// src/components/CalculatorPage.tsx
import React, { useState } from "react";
import { MapData, Position, Player, AppPage } from "../types";
import { hasLineOfSight } from "../utils/lineOfSight";
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
  const [imageDimensions, setImageDimensions] = useState({
    width: 800,
    height: 600,
  });

  // State for players
  const [bluePlayer, setBluePlayer] = useState<Player | null>(null);
  const [orangePlayer, setOrangePlayer] = useState<Player | null>(null);

  // State for active team selection
  const [activeTeam, setActiveTeam] = useState<"blue" | "orange" | null>(null);

  // State for line of sight result
  const [hasLos, setHasLos] = useState<boolean | null>(null);

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
        setImageDimensions={setImageDimensions}
        selectedWallIndex={null}
        setSelectedWallIndex={() => { }}
      />

      <div className="calculator-controls">
        <PlayerControls
          bluePlayer={bluePlayer}
          orangePlayer={orangePlayer}
          activeTeam={activeTeam}
          setActiveTeam={setActiveTeam}
          hasLos={hasLos}
          checkLineOfSight={checkLineOfSight}
        />
      </div>
    </div>
  );
};

export default CalculatorPage;
