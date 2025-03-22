// src/components/hidden/TacticalHeader.tsx
import React from "react";
import { useTypewriter } from "../../hooks/useTacticalEffects";

interface TacticalHeaderProps {
  title: string;
  subtitle?: string;
  color?: "blue" | "orange" | "green" | "red" | "highlight" | "default";
  animate?: boolean;
  className?: string;
}

/**
 * TacticalHeader - A Rainbow Six Siege styled section header component
 */
const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  title,
  color = "default",
  animate = false,
  className = "",
}) => {
  // Use typing animation if animate is true
  const animatedTitle = useTypewriter(title, 30);
  const displayTitle = animate ? animatedTitle : title;

  // Determine color class
  const colorClass = color !== "default" ? `tactical-header-${color}` : "";

  return (
    <div className={`tactical-header ${colorClass} ${className}`}>
      <div className="tactical-header-content">
        <div className="tactical-header-text">
          <h2 className="tactical-header-title">{displayTitle}</h2>
        </div>
      </div>

      <div className="tactical-header-decoration">
        <div className="tactical-header-line"></div>
        <div className="tactical-header-dot"></div>
      </div>
    </div>
  );
};

export default TacticalHeader;
