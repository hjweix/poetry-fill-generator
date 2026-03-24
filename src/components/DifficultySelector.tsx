import React from 'react';
import type { DifficultyLevel } from '../types';

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (difficulty: DifficultyLevel) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ value, onChange }) => {
  const options = [
    { value: 'easy' as DifficultyLevel, label: '简单', description: '每句填空1-2个字' },
    { value: 'medium' as DifficultyLevel, label: '中等', description: '每句填空2-3个字' },
    { value: 'hard' as DifficultyLevel, label: '困难', description: '每句填空3-4个字' }
  ];

  return (
    <div className="difficulty-selector">
      <label className="label">选择难度：</label>
      <div className="difficulty-options">
        {options.map((option) => (
          <label key={option.value} className={`difficulty-option ${value === option.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="difficulty"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <div className="option-content">
              <div className="option-label">{option.label}</div>
              <div className="option-description">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;