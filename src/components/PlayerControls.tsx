// src/components/PlayerControls.tsx
import React from "react";
import { Player } from "../types";

interface PlayerControlsProps {
  bluePlayer: Player | null;
  orangePlayer: Player | null;
  activeTeam: "blue" | "orange" | null;
  setActiveTeam: React.Dispatch<React.SetStateAction<"blue" | "orange" | null>>;
  hasLos: boolean | null;
  checkLineOfSight: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  bluePlayer,
  orangePlayer,
  activeTeam,
  setActiveTeam,
  hasLos,
  checkLineOfSight,
}) => {
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
        </div>
      )}
    </div>
  );
};

export default PlayerControls;
