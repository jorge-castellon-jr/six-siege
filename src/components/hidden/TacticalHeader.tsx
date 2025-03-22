// src/components/hidden/TacticalHeader.tsx
import React from "react";
import { useTypewriter } from "../../hooks/useTacticalEffects";

interface TacticalHeaderProps {
  title: string;
  subtitle?: string;
  animate?: boolean;
  className?: string;
}

/**
 * TacticalHeader - A Rainbow Six Siege styled section header component
 */
const TacticalHeader: React.FC<TacticalHeaderProps> = ({ title }) => {
  // Use typing animation if animate is true
  const animatedTitle = useTypewriter(title, 30);

  return (
    <div className={`tactical-header`}>
      <div className="tactical-header-title-wrapper">
        <div className="tactical-header-title">{animatedTitle}</div>
      </div>

      <div className="tactical-header-decoration">
        <div className="tactical-header-line"></div>
        <div className="tactical-header-dot"></div>
      </div>
    </div>
  );
};

export default TacticalHeader;
