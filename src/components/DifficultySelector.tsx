import React from 'react';
import type { DifficultyLevel } from '../types';

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (difficulty: DifficultyLevel) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ value, onChange }) => {
  const options = [
    { value: 'sentence' as DifficultyLevel, label: '📝 整句填空', description: '挖空逗号间的一整段' },
    { value: 'easy' as DifficultyLevel, label: '🌱 简单', description: '每句填空1-2个字' },
    { value: 'medium' as DifficultyLevel, label: '🌟 中等', description: '每句填空2-3个字' },
    { value: 'hard' as DifficultyLevel, label: '🔥 困难', description: '每句填空3-4个字' }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, optionValue: DifficultyLevel) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(optionValue);
    }
  };

  return (
    <div className="difficulty-selector" data-testid="difficulty-selector" role="radiogroup" aria-label="难度选择">
      <span className="label stitch-caption" id="difficulty-label">难度选择</span>
      <div className="difficulty-options" role="radiogroup" aria-labelledby="difficulty-label">
        {options.map((option) => (
          <label
            key={option.value}
            className={`difficulty-option ${value === option.value ? 'selected' : ''}`}
            onKeyDown={(e) => handleKeyDown(e, option.value)}
          >
            <input
              type="radio"
              name="difficulty"
              value={option.value}
              data-testid={`difficulty-${option.value}`}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-describedby={`difficulty-${option.value}-desc`}
            />
            <div className="option-content">
              <div className="option-label" role="text">{option.label}</div>
              <div className="option-description" id={`difficulty-${option.value}-desc`}>{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;