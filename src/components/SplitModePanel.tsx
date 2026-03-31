/**
 * SplitModePanel
 *
 * 拆题面板，统一展示：
 *   - 挖空程度选择（BlankModeSelector）
 *   - 诗句拖选区 + 选题卡片（单首模式，TextSelectionEditor 布局）
 *   - 智能生成按钮（单首 / 批量均可点击）
 *
 * 不再区分智能/手动 Tab，用户可以手动拖选拆分，也可以一键智能生成。
 */

import React from 'react';
import type { BlankMode, ManualGroup } from '../types';
import BlankModeSelector from './BlankModeSelector';
import TextSelectionEditor from './TextSelectionEditor';

// ─── Props ───────────────────────────────────────────────────────────────────

interface SplitModePanelProps {
  /** 输入模式 */
  inputMode: 'single' | 'batch';
  /** 全局挖空程度 */
  blankMode: BlankMode;
  onBlankModeChange: (v: BlankMode) => void;

  // 手动拆分（仅单首模式）
  contentLines: string[];
  manualGroups: ManualGroup[];
  onManualGroupsChange: (groups: ManualGroup[]) => void;

  // 智能生成
  onSmartGenerate: () => void;
  isGenerating: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const SplitModePanel: React.FC<SplitModePanelProps> = ({
  inputMode,
  blankMode,
  onBlankModeChange,
  contentLines,
  manualGroups,
  onManualGroupsChange,
  onSmartGenerate,
  isGenerating,
}) => {
  return (
    <div className="smp-root">
      {/* ── 工具栏：难度 + 智能生成（紧凑一行） ── */}
      <div className="smp-toolbar">
        <BlankModeSelector
          value={blankMode}
          onChange={onBlankModeChange}
        />
        <div className="smp-toolbar-divider" />
        <div className="smp-smart-generate">
          <button
            type="button"
            className="smp-smart-btn"
            onClick={onSmartGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="btn-spinner" />
                生成中...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                智能生成填空题
              </>
            )}
          </button>
          {inputMode === 'single' && (
            <span className="smp-smart-hint">
              也可拖选下方指定诗句生成填空题
            </span>
          )}
        </div>
      </div>

      {/* ── 诗句拖选区（仅单首模式） ── */}
      {inputMode === 'single' && contentLines.length > 0 && (
        <TextSelectionEditor
          contentLines={contentLines}
          groups={manualGroups}
          onChange={onManualGroupsChange}
          blankMode={blankMode}
        />
      )}
    </div>
  );
};

export default SplitModePanel;
