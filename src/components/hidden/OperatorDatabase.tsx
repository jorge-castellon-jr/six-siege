// src/components/hidden/OperatorDatabase.tsx
import React, { useState } from "react";
import "./OperatorDatabase.css";

interface Operator {
  id: string;
  name: string;
  team: "Attacker" | "Defender";
  armor: 1 | 2 | 3;
  speed: 1 | 2 | 3;
  difficulty: 1 | 2 | 3;
  primaryWeapons: string[];
  secondaryWeapons: string[];
  gadget: string;
  specialAbility: string;
  bio: string;
  imageUrl: string;
}

// Sample operators data
const operatorsData: Operator[] = [
  {
    id: "ash",
    name: "Ash",
    team: "Attacker",
    armor: 1,
    speed: 3,
    difficulty: 1,
    primaryWeapons: ["R4-C", "G36C"],
    secondaryWeapons: ["5.7 USG", "M45 MEUSOC"],
    gadget: "Breach Charge, Claymore",
    specialAbility: "Breaching Rounds",
    bio: "Eliza Cohen, codenamed Ash, is an Attacking Operator featured in Rainbow Six Siege. She is equipped with her M120 CREM, which fires breaching rounds that can be used to destroy barricades, walls, and floors from a distance.",
    imageUrl: "/assets/operators/ash.jpg",
  },
  {
    id: "bandit",
    name: "Bandit",
    team: "Defender",
    armor: 1,
    speed: 3,
    difficulty: 2,
    primaryWeapons: ["MP7", "M870"],
    secondaryWeapons: ["P12"],
    gadget: "Barbed Wire, Nitro Cell",
    specialAbility: "Shock Wire",
    bio: "Dominic Brunsmeier, codenamed Bandit, is a Defending Operator featured in Rainbow Six Siege. Bandit's unique gadget is his Crude Electrical Device (CED-1), also referred to as a 'Shock Wire', which can be placed on metal objects, including reinforced walls, barbed wire, and deployable shields.",
    imageUrl: "/assets/operators/bandit.jpg",
  },
  {
    id: "doc",
    name: "Doc",
    team: "Defender",
    armor: 3,
    speed: 1,
    difficulty: 1,
    primaryWeapons: ["SG-CQB", "MP5", "P90"],
    secondaryWeapons: ["P9", "LFP586"],
    gadget: "Barbed Wire, Bulletproof Camera",
    specialAbility: "Stim Pistol",
    bio: "Gustave Kateb, codenamed Doc, is a Defending Operator in Rainbow Six Siege. He is armed with the MPD-0 Stim Pistol, which can fire darts that heal allies for 40 health points or even revive downed teammates from a distance.",
    imageUrl: "/assets/operators/doc.jpg",
  },
  {
    id: "sledge",
    name: "Sledge",
    team: "Attacker",
    armor: 2,
    speed: 2,
    difficulty: 1,
    primaryWeapons: ["L85A2", "M590A1"],
    secondaryWeapons: ["P226 MK 25", "SMG-11"],
    gadget: "Frag Grenade, Stun Grenade",
    specialAbility: "Tactical Breaching Hammer",
    bio: "Seamus Cowden, codenamed Sledge, is an Attacking Operator featured in Rainbow Six Siege. Sledge is equipped with his 'Tactical Breaching Hammer' (nicknamed 'The Caber'), which can destroy barricades, walls, and floors with a single strike.",
    imageUrl: "/assets/operators/sledge.jpg",
  },
];

const OperatorDatabase: React.FC = () => {
  const [operators] = useState<Operator[]>(operatorsData);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterTeam, setFilterTeam] = useState<"All" | "Attacker" | "Defender">(
    "All",
  );

  // Filter operators based on search and team filter
  const filteredOperators = operators.filter((op) => {
    // Filter by search term
    const matchesSearch = op.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filter by team
    const matchesTeam = filterTeam === "All" || op.team === filterTeam;

    return matchesSearch && matchesTeam;
  });

  // Handle operator click
  const handleOperatorClick = (operator: Operator) => {
    setSelectedOperator(operator);
  };

  // Render armor/speed/difficulty bars
  const renderRatingBars = (value: number, max: number = 3) => {
    return (
      <div className="rating-bars">
        {[...Array(max)].map((_, i) => (
          <div
            key={i}
            className={`rating-bar ${i < value ? "filled" : "empty"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="operator-database">
      <h2>Operator Database</h2>

      <div className="operator-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="team-filter">
          <button
            className={filterTeam === "All" ? "active" : ""}
            onClick={() => setFilterTeam("All")}
          >
            All
          </button>
          <button
            className={filterTeam === "Attacker" ? "active" : ""}
            onClick={() => setFilterTeam("Attacker")}
          >
            Attackers
          </button>
          <button
            className={filterTeam === "Defender" ? "active" : ""}
            onClick={() => setFilterTeam("Defender")}
          >
            Defenders
          </button>
        </div>
      </div>

      <div className="operator-content">
        <div className="operators-list">
          {filteredOperators.map((operator) => (
            <div
              key={operator.id}
              className={`operator-card ${selectedOperator?.id === operator.id ? "selected" : ""}`}
              onClick={() => handleOperatorClick(operator)}
            >
              <div className={`operator-icon ${operator.team.toLowerCase()}`}>
                <div className="placeholder-image">
                  {operator.name.charAt(0)}
                </div>
              </div>
              <div className="operator-name">{operator.name}</div>
              <div className={`operator-team ${operator.team.toLowerCase()}`}>
                {operator.team}
              </div>
            </div>
          ))}

          {filteredOperators.length === 0 && (
            <div className="no-results">
              No operators found matching your filters.
            </div>
          )}
        </div>

        <div className="operator-details">
          {selectedOperator ? (
            <div className="operator-profile">
              <div className="operator-header">
                <h3>{selectedOperator.name}</h3>
                <span
                  className={`team-badge ${selectedOperator.team.toLowerCase()}`}
                >
                  {selectedOperator.team}
                </span>
              </div>

              <div className="operator-stats">
                <div className="stat-group">
                  <label>Armor:</label>
                  {renderRatingBars(selectedOperator.armor)}
                </div>

                <div className="stat-group">
                  <label>Speed:</label>
                  {renderRatingBars(selectedOperator.speed)}
                </div>

                <div className="stat-group">
                  <label>Difficulty:</label>
                  {renderRatingBars(selectedOperator.difficulty)}
                </div>
              </div>

              <div className="operator-image">
                <div className="placeholder-portrait">
                  {selectedOperator.name}
                </div>
              </div>

              <div className="operator-loadout">
                <h4>Loadout</h4>

                <div className="weapon-group">
                  <label>Primary Weapons:</label>
                  <ul>
                    {selectedOperator.primaryWeapons.map((weapon, index) => (
                      <li key={index}>{weapon}</li>
                    ))}
                  </ul>
                </div>

                <div className="weapon-group">
                  <label>Secondary Weapons:</label>
                  <ul>
                    {selectedOperator.secondaryWeapons.map((weapon, index) => (
                      <li key={index}>{weapon}</li>
                    ))}
                  </ul>
                </div>

                <div className="gadget-group">
                  <label>Gadgets:</label>
                  <p>{selectedOperator.gadget}</p>
                </div>

                <div className="ability-group">
                  <label>Special Ability:</label>
                  <p>{selectedOperator.specialAbility}</p>
                </div>
              </div>

              <div className="operator-bio">
                <h4>Biography</h4>
                <p>{selectedOperator.bio}</p>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select an operator to view their details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDatabase;
