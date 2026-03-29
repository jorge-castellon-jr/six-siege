// src/components/hidden/DiceRoller.tsx
import React, { useState } from "react";
import "./DiceRoller.css";
import TacticalHeader from "./TacticalHeader";
import {
  CombatDiceTier,
  COMBAT_DICE_FACES,
  COMBAT_DICE_META,
} from "../../data/combatDice";

const TIERS: CombatDiceTier[] = ["yellow", "orange", "red"];

interface CombatDie {
  id: number;
  tier: CombatDiceTier;
  damage: number;
  rolled: boolean;
}

interface RollHistory {
  id: number;
  dice: CombatDie[];
  timestamp: Date;
  total: number;
}

/** Renders bullet-hole pips for a given damage amount. */
const BulletHoles: React.FC<{ damage: number; tier: CombatDiceTier }> = ({
  damage,
  tier,
}) => {
  const hole = (key: number) => (
    <span key={key} className={`bullet-hole bullet-hole--${tier}`} />
  );

  if (damage === 0) {
    return <span className="no-damage">—</span>;
  }

  // 3 damage: upside-down triangle (2 on top, 1 centred below)
  if (damage === 3) {
    return (
      <div className="bullet-holes bullet-holes--triangle">
        <div className="bullet-holes-row">{hole(0)}{hole(1)}</div>
        <div className="bullet-holes-row">{hole(2)}</div>
      </div>
    );
  }

  return (
    <div className="bullet-holes">
      {Array.from({ length: damage }).map((_, i) => hole(i))}
    </div>
  );
};

const DiceRoller: React.FC = () => {
  const [dicePool, setDicePool] = useState<CombatDie[]>([]);
  const [nextId, setNextId] = useState<number>(1);
  const [rollResults, setRollResults] = useState<CombatDie[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [rolling, setRolling] = useState<boolean>(false);
  const [rollHistory, setRollHistory] = useState<RollHistory[]>([]);
  const [historyId, setHistoryId] = useState<number>(1);

  const addDie = (tier: CombatDiceTier) => {
    setDicePool((prev) => [
      ...prev,
      { id: nextId, tier, damage: 0, rolled: false },
    ]);
    setNextId((n) => n + 1);
  };

  const removeDie = (id: number) => {
    setDicePool((prev) => prev.filter((d) => d.id !== id));
  };

  const clearDice = () => {
    setDicePool([]);
    setRollResults([]);
    setShowResults(false);
  };

  const rollDice = () => {
    if (dicePool.length === 0) return;
    setRolling(true);

    const animationDuration = 900;
    const updateInterval = 100;
    let elapsed = 0;

    const randomDamage = (tier: CombatDiceTier) => {
      const faces = COMBAT_DICE_FACES[tier];
      return faces[Math.floor(Math.random() * 6)];
    };

    const animateRoll = () => {
      setRollResults(
        dicePool.map((die) => ({
          ...die,
          damage: randomDamage(die.tier),
          rolled: true,
        })),
      );

      elapsed += updateInterval;

      if (elapsed < animationDuration) {
        setTimeout(animateRoll, updateInterval);
      } else {
        const finalResults = dicePool.map((die) => ({
          ...die,
          damage: randomDamage(die.tier),
          rolled: true,
        }));
        const total = finalResults.reduce((sum, d) => sum + d.damage, 0);

        setRollResults(finalResults);
        setShowResults(true);
        setRolling(false);

        setRollHistory((prev) => [
          { id: historyId, dice: finalResults, timestamp: new Date(), total },
          ...prev,
        ]);
        setHistoryId((n) => n + 1);
      }
    };

    animateRoll();
  };

  const clearHistory = () => setRollHistory([]);

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const currentTotal = rollResults.reduce((sum, d) => sum + d.damage, 0);

  return (
    <div className="dice-roller">
      <TacticalHeader title="Dice Roller" />

      <div className="dice-controls">
        <div className="tier-buttons">
          {TIERS.map((tier) => {
            const meta = COMBAT_DICE_META[tier];
            return (
              <button
                key={tier}
                className={`tier-button tier-button--${tier}`}
                onClick={() => addDie(tier)}
                style={{ "--tier-color": meta.color } as React.CSSProperties}
              >
                <span className="tier-pip" />
                <span className="tier-label">{meta.label}</span>
                <span className="tier-sublabel">D6</span>
              </button>
            );
          })}
        </div>

        <div className="control-buttons">
          <button
            onClick={rollDice}
            disabled={dicePool.length === 0 || rolling}
            className="roll-button"
          >
            {rolling ? "Rolling..." : "Roll Dice"}
          </button>
          <button
            onClick={clearDice}
            disabled={dicePool.length === 0}
            className="clear-button"
          >
            Clear Dice
          </button>
        </div>
      </div>

      <div className="dice-section">
        <div className="dice-pool">
          <h3>
            Dice Pool{" "}
            {dicePool.length > 0 && <span>({dicePool.length})</span>}
          </h3>

          {dicePool.length === 0 ? (
            <div className="empty-pool">
              Add dice to your pool using the buttons above
            </div>
          ) : (
            <div className="dice-grid">
              {dicePool.map((die) => (
                <div
                  key={die.id}
                  className={`die die--${die.tier}`}
                  style={
                    {
                      "--tier-color": COMBAT_DICE_META[die.tier].color,
                    } as React.CSSProperties
                  }
                >
                  <div className="die-label">
                    {COMBAT_DICE_META[die.tier].label}
                  </div>
                  <button className="remove-die" onClick={() => removeDie(die.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showResults && (
          <div className="roll-results">
            <h3>Results</h3>
            <div className="results-grid">
              {rollResults.map((die) => (
                <div
                  key={die.id}
                  className={`die result-die die--${die.tier}`}
                  style={
                    {
                      "--tier-color": COMBAT_DICE_META[die.tier].color,
                    } as React.CSSProperties
                  }
                >
                  <div className="die-label">
                    {COMBAT_DICE_META[die.tier].label}
                  </div>
                  <BulletHoles damage={die.damage} tier={die.tier} />
                </div>
              ))}
            </div>

            <div className="total-result">
              Total Damage: <span>{currentTotal}</span>
            </div>
          </div>
        )}
      </div>

      <div className="roll-history">
        <div className="history-header">
          <h3>Roll History</h3>
          {rollHistory.length > 0 && (
            <button onClick={clearHistory} className="clear-history-button">
              Clear History
            </button>
          )}
        </div>

        {rollHistory.length === 0 ? (
          <div className="empty-history">
            No rolls yet. Roll some dice to see the history.
          </div>
        ) : (
          <div className="history-list">
            {rollHistory.map((entry) => (
              <div key={entry.id} className="history-entry">
                <div className="history-time">
                  {formatTimestamp(entry.timestamp)}
                </div>
                <div className="history-dice">
                  {entry.dice.map((die) => (
                    <div
                      key={die.id}
                      className={`history-die history-die--${die.tier}`}
                      style={
                        {
                          "--tier-color": COMBAT_DICE_META[die.tier].color,
                        } as React.CSSProperties
                      }
                    >
                      <span className="history-die-tier">
                        {COMBAT_DICE_META[die.tier].label.charAt(0)}
                      </span>
                      <span className="history-die-value">{die.damage}</span>
                    </div>
                  ))}
                </div>
                <div className="history-total">
                  Total: <span>{entry.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dice-rules">
        <p>
          Each die rolls one of its six faces at random. Damage is the value on
          that face. The total is the sum of all damage rolled.
        </p>
        <div className="dice-rules-tiers">
          {TIERS.map((tier) => (
            <div key={tier} className={`rules-tier rules-tier--${tier}`}>
              <span
                className="rules-pip"
                style={{ background: COMBAT_DICE_META[tier].color }}
              />
              <span className="rules-tier-name">
                {COMBAT_DICE_META[tier].label}
              </span>
              <span className="rules-faces">
                [{COMBAT_DICE_FACES[tier].join(", ")}]
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiceRoller;
