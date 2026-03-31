import React, { useState } from 'react';
import type { BlankMode } from '../types';

interface BlankModeSelectorProps {
  value: BlankMode;
  onChange: (mode: BlankMode) => void;
}

const options: { value: BlankMode; label: string; tooltip: string }[] = [
  { value: 'few', label: '简单', tooltip: '每句挖空1-2个字' },
  { value: 'some', label: '中等', tooltip: '每句挖空3-4个字' },
  { value: 'whole', label: '困难', tooltip: '挖空整句' },
];

const BlankModeSelector: React.FC<BlankModeSelectorProps> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState<BlankMode | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, optionValue: BlankMode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(optionValue);
    }
  };

  return (
    <div className="blank-mode-selector" data-testid="blank-mode-selector" role="radiogroup" aria-label="难度选择">
      <div className="bms-row">
        <span className="bms-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bms-icon">
            <path d="M2 20h.01"/>
            <path d="M7 20v-4"/>
            <path d="M12 20v-8"/>
            <path d="M17 20V8"/>
          </svg>
          难度
        </span>
        <div className="bms-chips" role="radiogroup" aria-label="难度选项">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={value === option.value}
              data-testid={`blank-mode-${option.value}`}
              className={`bms-chip ${value === option.value ? 'bms-chip--active' : ''}`}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              onMouseEnter={() => setHovered(option.value)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="bms-chip-label">{option.label}</span>
              {/* tooltip */}
              {hovered === option.value && (
                <span className="bms-tooltip" role="tooltip">
                  {option.tooltip}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlankModeSelector;
