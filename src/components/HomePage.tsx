// src/components/HomePage.tsx
import React from "react";
import { MapData, AppPage } from "../types";

interface HomePageProps {
  maps: MapData[];
  onSelectMap: (mapId: string) => void;
  onNavigate: (page: AppPage) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  maps,
  onSelectMap,
  onNavigate,
}) => {
  return (
    <div className="home-page">
      <h1>Rainbow Six: Siege Line of Sight Calculator</h1>

      <div className="page-actions">
        <button onClick={() => onNavigate("admin")} className="admin-button">
          Admin Mode
        </button>
      </div>

      <div className="map-selection">
        <h2>Select a Map</h2>
        <div className="map-grid">
          {maps.map((map) => (
            <div
              key={map.id}
              className="map-card"
              onClick={() => onSelectMap(map.id)}
            >
              <div className="map-thumbnail">
                <img src={`src/assets/${map.id}.jpg`} alt={map.name} />
              </div>
              <div className="map-name">{map.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
