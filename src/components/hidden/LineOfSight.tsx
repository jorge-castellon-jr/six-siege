// src/components/hidden/LineOfSight.tsx
import React, { useState } from "react";
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
import { MapData } from "../../types";

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
  const [player1Position, setPlayer1Position] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [player2Position, setPlayer2Position] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hasLineOfSight, setHasLineOfSight] = useState<boolean | null>(null);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);

  // Handle map change
  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(
      maps.find((map) => map.id === event.target.value) ?? maps[0],
    );
    resetPositions();
  };

  // Reset player positions
  const resetPositions = () => {
    setPlayer1Position(null);
    setPlayer2Position(null);
    setHasLineOfSight(null);
    setActivePlayer(1);
  };

  // Handle grid click in the tactical panel
  const handleGridClick = (x: number, y: number) => {
    if (activePlayer === 1) {
      setPlayer1Position({ x, y });
      setActivePlayer(2);
    } else {
      setPlayer2Position({ x, y });

      // After both players are positioned, we could calculate line of sight
      // For now we'll just randomly determine it
      setTimeout(() => {
        // Simulate LOS calculation
        const hasLOS = Math.random() > 0.5;
        setHasLineOfSight(hasLOS);
      }, 500);
    }
  };

  return (
    <div className="los-tool">
      <TacticalHeader
        title="Line of Sight Calculator"
        subtitle="Determine visibility between operators on tactical maps"
        color="blue"
      />

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
                className={`player-indicator ${activePlayer === 1 ? "active" : ""}`}
              >
                <div className="player-color attacker"></div>
                <span>Attacker</span>
                {player1Position && (
                  <div className="player-position">
                    Position: {player1Position.x}, {player1Position.y}
                  </div>
                )}
              </div>

              <div
                className={`player-indicator ${activePlayer === 2 ? "active" : ""}`}
              >
                <div className="player-color defender"></div>
                <span>Defender</span>
                {player2Position && (
                  <div className="player-position">
                    Position: {player2Position.x}, {player2Position.y}
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

          <CalculatorPage
            mapData={selectedMap}
            onNavigate={() => void 0}
            isNew
          />

          {hasLineOfSight !== null && (
            <div
              className={`los-result ${hasLineOfSight ? "has-los" : "no-los"}`}
            >
              <div className="los-result-icon">
                {hasLineOfSight ? "✓" : "✕"}
              </div>
              <div className="los-result-text">
                {hasLineOfSight
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
