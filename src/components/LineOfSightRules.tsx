import React, { useState } from "react";

const LineOfSightRulesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50">
      <div className="relative w-full max-w-2xl p-6 mx-4 bg-zinc-900 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold">Line of Sight Rules</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="text-gray-800">
          <h3 className="font-semibold text-lg mb-2">
            Basic Line of Sight Rules
          </h3>
          <p className="mb-4 text-zinc-400">
            Line of sight in Rainbow Six Siege board game is determined by
            drawing an imaginary line between the centers of the grid cells
            occupied by two operators.
          </p>

          <h3 className="font-semibold text-lg mb-2 text-gray-200">
            Walls and Obstacles
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-zinc-400">
            <li>
              Line of sight is blocked if the line passes through any wall
              segment
            </li>
            <li>
              Walls are placed at grid intersections and block sight along their
              length
            </li>
            <li>Operators cannot see through multiple walls</li>
          </ul>

          <h3 className="font-semibold text-lg mb-2 text-zinc-200">
            Special Cases
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-zinc-400">
            <li>
              <strong>Corner Cases:</strong> If the line of sight passes exactly
              through the corner where walls meet, sight is blocked
            </li>
            <li>
              <strong>Edge Cases:</strong> If the line of sight passes exactly
              along a wall's edge, sight is blocked
            </li>
            <li>
              <strong>Adjacent Operators:</strong> Operators in adjacent cells
              always have line of sight unless a wall directly separates them
            </li>
          </ul>

          <h3 className="font-semibold text-lg mb-2 text-zinc-200">
            Using the Calculator
          </h3>
          <ol className="list-decimal pl-6 mb-4 space-y-2 text-zinc-400">
            <li>Place operators on the grid by clicking on grid cells</li>
            <li>
              The calculator will automatically determine if line of sight
              exists between operators
            </li>
            <li>Red line indicates blocked line of sight</li>
            <li>Green line indicates clear line of sight</li>
          </ol>

          <p className="text-sm italic text-zinc-600 mt-6">
            Note: These rules are simplified for the board game version. Refer
            to the official Rainbow Six Siege board game rulebook for complete
            details and edge cases.
          </p>
        </div>
      </div>
    </div>
  );
};

// Button component to open the modal
const RulesButton: React.FC<{
  className: string;
  onClick: () => void;
}> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className}`}
    >
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Line of Sight Rules
    </button>
  );
};

// Combined component for export
const LineOfSightRules: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <RulesButton onClick={openModal} className={className} />
      <LineOfSightRulesModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default LineOfSightRules;
