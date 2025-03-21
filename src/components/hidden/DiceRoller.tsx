// src/components/hidden/DiceRoller.tsx
import React, { useState } from "react";
import "./DiceRoller.css";

interface DiceResult {
  id: number;
  sides: number;
  value: number;
  color: string;
}

interface RollHistory {
  id: number;
  dice: DiceResult[];
  timestamp: Date;
  total: number;
}

// Available dice colors
const diceColors = [
  "#4f8bff", // Blue
  "#ff7f50", // Orange
  "#50c878", // Green
  "#ff5252", // Red
  "#9370db", // Purple
  "#ffd700", // Gold
];

const DiceRoller: React.FC = () => {
  const [dicePool, setDicePool] = useState<DiceResult[]>([]);
  const [nextDiceId, setNextDiceId] = useState<number>(1);
  const [rollResults, setRollResults] = useState<DiceResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [rolling, setRolling] = useState<boolean>(false);
  const [rollHistory, setRollHistory] = useState<RollHistory[]>([]);
  const [historyId, setHistoryId] = useState<number>(1);

  // Available dice types
  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  // Add a die to the pool
  const addDie = (sides: number) => {
    const newDie: DiceResult = {
      id: nextDiceId,
      sides,
      value: 0,
      color: diceColors[Math.floor(Math.random() * diceColors.length)],
    };

    setDicePool([...dicePool, newDie]);
    setNextDiceId((prevId) => prevId + 1);
  };

  // Remove a die from the pool
  const removeDie = (id: number) => {
    setDicePool(dicePool.filter((die) => die.id !== id));
  };

  // Clear all dice from the pool
  const clearDice = () => {
    setDicePool([]);
    setRollResults([]);
    setShowResults(false);
  };

  // Roll all dice in the pool
  const rollDice = () => {
    if (dicePool.length === 0) return;

    setRolling(true);

    // Simulate rolling animation with multiple updates
    const animationDuration = 1000;
    const updateInterval = 100;
    let elapsedTime = 0;

    const animateRoll = () => {
      const tempResults = dicePool.map((die) => ({
        ...die,
        value: Math.floor(Math.random() * die.sides) + 1,
      }));

      setRollResults(tempResults);

      elapsedTime += updateInterval;

      if (elapsedTime < animationDuration) {
        setTimeout(animateRoll, updateInterval);
      } else {
        // Final results
        const finalResults = dicePool.map((die) => ({
          ...die,
          value: Math.floor(Math.random() * die.sides) + 1,
        }));

        setRollResults(finalResults);
        setShowResults(true);
        setRolling(false);

        // Add to history
        const newHistory: RollHistory = {
          id: historyId,
          dice: [...finalResults],
          timestamp: new Date(),
          total: finalResults.reduce((sum, die) => sum + die.value, 0),
        };

        setRollHistory([newHistory, ...rollHistory]);
        setHistoryId((prevId) => prevId + 1);
      }
    };

    // Start animation
    animateRoll();
  };

  // Format timestamp for history display
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Clear roll history
  const clearHistory = () => {
    setRollHistory([]);
  };

  // Calculate total of current roll
  const calculateTotal = (): number => {
    return rollResults.reduce((sum, die) => sum + die.value, 0);
  };

  return (
    <div className="dice-roller">
      <h2>Dice Roller</h2>

      <div className="dice-controls">
        <div className="dice-buttons">
          {diceTypes.map((sides) => (
            <button
              key={sides}
              onClick={() => addDie(sides)}
              className="add-die-button"
            >
              D{sides}
            </button>
          ))}
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
            Dice Pool {dicePool.length > 0 && <span>({dicePool.length})</span>}
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
                  className="die"
                  style={{ backgroundColor: die.color }}
                >
                  <div className="die-sides">D{die.sides}</div>
                  <button
                    className="remove-die"
                    onClick={() => removeDie(die.id)}
                  >
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
                  className="die result-die"
                  style={{ backgroundColor: die.color }}
                >
                  <div className="die-sides">D{die.sides}</div>
                  <div className="die-value">{die.value}</div>
                </div>
              ))}
            </div>

            <div className="total-result">
              Total: <span>{calculateTotal()}</span>
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
                      className="history-die"
                      style={{ backgroundColor: die.color }}
                    >
                      <span className="history-die-sides">D{die.sides}</span>
                      <span className="history-die-value">{die.value}</span>
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
    </div>
  );
};

export default DiceRoller;
