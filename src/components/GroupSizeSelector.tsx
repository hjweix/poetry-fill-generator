import React from 'react';
import type { GroupSize } from '../types';

interface GroupSizeSelectorProps {
  value: GroupSize;
  onChange: (size: GroupSize) => void;
  /** 当前诗词的总行数，用于过滤不合理的选项 */
  totalLines?: number;
  /** 是否显示为紧凑内联样式（用于批量卡片） */
  compact?: boolean;
}

const ALL_OPTIONS: { value: GroupSize; label: string; description: string }[] = [
  { value: 'whole', label: '整首一题', description: '全部句子作为一道大题' },
  { value: 2,       label: '每 2 句',  description: '每 2 行划分一道大题' },
  { value: 4,       label: '每 4 句',  description: '每 4 行划分一道大题' },
  { value: 6,       label: '每 6 句',  description: '每 6 行划分一道大题' },
];

const GroupSizeSelector: React.FC<GroupSizeSelectorProps> = ({
  value,
  onChange,
  totalLines,
  compact = false,
}) => {
  // 只显示「有意义」的选项：整首始终保留；N 句选项当诗词行数 > N 时才显示
  const options = ALL_OPTIONS.filter(opt => {
    if (opt.value === 'whole') return true;
    if (totalLines == null) return true;
    return totalLines > (opt.value as number);
  });

  if (compact) {
    // 批量模式下的紧凑下拉样式
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/60 border-t border-amber-100">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 flex-shrink-0">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
        </svg>
        <span className="text-xs text-amber-700 font-medium flex-shrink-0">分题</span>
        <div className="flex gap-1 flex-wrap">
          {options.map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.description}
              className={`px-2 py-0.5 text-xs rounded-md border transition-all duration-150 ${
                value === opt.value
                  ? 'bg-amber-500 text-white border-amber-500 font-medium'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 单首模式下的完整选择器（复用 difficulty-selector 样式）
  return (
    <div className="difficulty-selector" role="radiogroup" aria-label="分题设置">
      <span className="label stitch-caption" id="groupsize-label">分题设置</span>
      <div className="difficulty-options" role="radiogroup" aria-labelledby="groupsize-label">
        {options.map(opt => (
          <label
            key={String(opt.value)}
            className={`difficulty-option ${value === opt.value ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="groupSize"
              value={String(opt.value)}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              aria-describedby={`groupsize-${opt.value}-desc`}
            />
            <div className="option-content">
              <div className="option-label" role="text">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                </svg>
                {opt.label}
              </div>
              <div className="option-description" id={`groupsize-${opt.value}-desc`}>
                {opt.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default GroupSizeSelector;
