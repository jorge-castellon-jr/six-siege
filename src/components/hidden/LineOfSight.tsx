// src/components/hidden/LineOfSight.tsx
import React, { useEffect, useState } from "react";
import TacticalHeader from "./TacticalHeader";
import "./LineOfSight.css";

import { MapData } from "../../types";
import CalculatorPage from "../CalculatorPage";

interface LineOfSightProps {
  maps: MapData[];
}

const LineOfSight: React.FC<LineOfSightProps> = ({ maps }) => {
  const [selectedMapId, setSelectedMapId] = useState(() => maps[0]?.id ?? "");

  useEffect(() => {
    if (!maps.length) return;
    if (!maps.some((m) => m.id === selectedMapId)) {
      setSelectedMapId(maps[0].id);
    }
  }, [maps, selectedMapId]);

  const selectedMap = maps.find((m) => m.id === selectedMapId) ?? maps[0];

  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMapId(event.target.value);
  };

  if (!selectedMap) {
    return null;
  }

  return (
    <div className="los-tool">
      <TacticalHeader title="Line of Sight Calculator" />

      <div className="tactical-panel tactical-panel-hex">
        <div className="tactical-panel-header">
          <h3 className="tactical-panel-title">Map Selection</h3>
          <div className="los-map-selector">
            <select
              className="tactical-select"
              value={selectedMapId}
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

        <div className="tactical-panel-body los-calculator-embed">
          <CalculatorPage mapData={selectedMap} isNew />
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
