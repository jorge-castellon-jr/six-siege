// src/components/hidden/TournamentBans.tsx
import React, { useState } from "react";
import "./TournamentBans.css";

interface Map {
  id: string;
  name: string;
  image: string;
  banned: boolean;
  bannedBy?: "team1" | "team2";
}

const initialMaps: Map[] = [
  { id: "bank", name: "Bank", image: "/assets/bank.jpg", banned: false },
  { id: "border", name: "Border", image: "/assets/border.jpg", banned: false },
  { id: "chalet", name: "Chalet", image: "/assets/chalet.jpg", banned: false },
  {
    id: "clubhouse",
    name: "Club House",
    image: "/assets/clubhouse.jpg",
    banned: false,
  },
  {
    id: "coastline",
    name: "Coastline",
    image: "/assets/coastline.jpg",
    banned: false,
  },
  {
    id: "consulate",
    name: "Consulate",
    image: "/assets/consulate.jpg",
    banned: false,
  },
  { id: "kafe", name: "Kafe", image: "/assets/kafe.jpg", banned: false },
  { id: "oregon", name: "Oregon", image: "/assets/oregon.jpg", banned: false },
];

const TournamentBans: React.FC = () => {
  const [maps, setMaps] = useState<Map[]>(initialMaps);
  const [currentTeam, setCurrentTeam] = useState<"team1" | "team2">("team1");
  const [team1Name, setTeam1Name] = useState<string>("Team Blue");
  const [team2Name, setTeam2Name] = useState<string>("Team Orange");
  const [banCount, setBanCount] = useState<number>(6); // Default ban count
  const [bansComplete, setBansComplete] = useState<boolean>(false);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  // Count current bans
  const currentBans = maps.filter((map) => map.banned).length;

  // Handle map ban
  const banMap = (mapId: string) => {
    if (currentBans >= banCount) return;

    setMaps((prevMaps) =>
      prevMaps.map((map) => {
        if (map.id === mapId) {
          return { ...map, banned: true, bannedBy: currentTeam };
        }
        return map;
      }),
    );

    // Switch teams after each ban
    setCurrentTeam((current) => (current === "team1" ? "team2" : "team1"));

    // Check if bans are complete
    if (currentBans === banCount - 1) {
      setBansComplete(true);

      // Find the remaining map
      const remainingMap =
        maps.find((map) => !map.banned && map.id !== mapId)?.id || null;
      setSelectedMap(remainingMap);
    }
  };

  // Reset bans
  const resetBans = () => {
    setMaps(initialMaps);
    setCurrentTeam("team1");
    setBansComplete(false);
    setSelectedMap(null);
  };

  return (
    <div className="tournament-bans">
      <h2>Tournament Map Bans</h2>

      <div className="ban-settings">
        <div className="team-names">
          <div className="team-input">
            <label htmlFor="team1">Team 1:</label>
            <input
              type="text"
              id="team1"
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
            />
          </div>
          <div className="team-input">
            <label htmlFor="team2">Team 2:</label>
            <input
              type="text"
              id="team2"
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
            />
          </div>
        </div>

        <div className="ban-count-selector">
          <label htmlFor="ban-count">Number of Bans:</label>
          <select
            id="ban-count"
            value={banCount}
            onChange={(e) => setBanCount(Number(e.target.value))}
            disabled={currentBans > 0}
          >
            <option value={1}>1 ban</option>
            <option value={2}>2 bans</option>
            <option value={3}>3 bans</option>
            <option value={4}>4 bans</option>
            <option value={5}>5 bans</option>
            <option value={6}>6 bans</option>
            <option value={7}>7 bans</option>
          </select>
        </div>
      </div>

      <div className="ban-status">
        <div
          className={`current-team ${currentTeam === "team1" ? "team1-turn" : "team2-turn"}`}
        >
          Current Turn: {currentTeam === "team1" ? team1Name : team2Name}
        </div>
        <div className="ban-progress">
          Bans: {currentBans} / {banCount}
        </div>
      </div>

      {bansComplete && selectedMap && (
        <div className="selected-map-container">
          <h3>Selected Map</h3>
          <div className="selected-map">
            {maps.find((map) => map.id === selectedMap)?.name}
          </div>
        </div>
      )}

      <div className="maps-grid">
        {maps.map((map) => (
          <div
            key={map.id}
            className={`map-card ${map.banned ? "banned" : ""} ${map.bannedBy === "team1" ? "team1-banned" : map.bannedBy === "team2" ? "team2-banned" : ""}`}
            onClick={() => !map.banned && !bansComplete && banMap(map.id)}
          >
            <div className="map-image">
              <img src={map.image} alt={map.name} />
              {map.banned && (
                <div className="banned-overlay">
                  Banned by {map.bannedBy === "team1" ? team1Name : team2Name}
                </div>
              )}
            </div>
            <div className="map-name">{map.name}</div>
          </div>
        ))}
      </div>

      <div className="ban-actions">
        <button className="reset-bans" onClick={resetBans}>
          Reset Bans
        </button>
      </div>

      <div className="ban-instructions">
        <h4>How to use:</h4>
        <ol>
          <li>Set the team names.</li>
          <li>Select the number of maps to ban.</li>
          <li>Teams take turns banning maps by clicking on them.</li>
          <li>The final map will be automatically selected.</li>
        </ol>
      </div>
    </div>
  );
};

export default TournamentBans;
