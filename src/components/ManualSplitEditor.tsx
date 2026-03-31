/**
 * ManualSplitEditor
 *
 * 手动拆分模式编辑器（复选框勾选版），工作流：
 *   1. 展示诗词正文，每行前面有一个复选框
 *   2. 用户点击复选框（或点击整行）来选中/取消选中诗句
 *   3. 选中的行高亮显示，底部出现「添加为题目」按钮
 *   4. 点击按钮后，选中行归入新题目卡片，出现逐字选词界面
 *   5. 每道题卡片可独立删除；支持「清空全部」重新来过
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { ManualGroup, LineInteractiveData, InteractiveBlank } from '../types';
import { generateInteractiveBlanks } from '../utils/fillGenerator';

// ─── 常量 ────────────────────────────────────────────────────────────────────

const CN_NUMS = ['一','二','三','四','五','六','七','八','九','十',
                 '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];

function toCnNum(n: number): string {
  return n <= CN_NUMS.length ? CN_NUMS[n - 1] : String(n);
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ManualSplitEditorProps {
  contentLines: string[];
  groups: ManualGroup[];
  onChange: (groups: ManualGroup[]) => void;
}

// ─── 自定义复选框组件 ────────────────────────────────────────────────────────

const Checkbox: React.FC<{
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, disabled, onChange }) => (
  <span
    className={[
      'mse-cb',
      checked ? 'mse-cb--checked' : '',
      disabled ? 'mse-cb--disabled' : '',
    ].filter(Boolean).join(' ')}
    onClick={e => { e.stopPropagation(); if (!disabled) onChange(!checked); }}
    role="checkbox"
    aria-checked={checked}
    tabIndex={disabled ? -1 : 0}
    onKeyDown={e => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        onChange(!checked);
      }
    }}
  >
    {checked && (
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2.5 6 5 8.5 9.5 3.5" />
      </svg>
    )}
  </span>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const ManualSplitEditor: React.FC<ManualSplitEditorProps> = ({
  contentLines,
  groups,
  onChange,
}) => {
  // 用户当前勾选的行索引
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // ── 已被分配到某个 group 的行索引 ──────────────────────────────────────────
  const assignedIndices = useMemo(
    () => new Set(groups.flatMap(g => g.lineIndices)),
    [groups],
  );

  // ── 可选行（未分配的行索引） ──────────────────────────────────────────────
  const selectableIndices = useMemo(
    () => contentLines.map((_, i) => i).filter(i => !assignedIndices.has(i)),
    [contentLines, assignedIndices],
  );

  // ── 全选 / 取消全选（仅操作可选行） ──────────────────────────────────────
  const allSelectableSelected = selectableIndices.length > 0
    && selectableIndices.every(i => selectedIndices.has(i));

  const handleSelectAll = useCallback(() => {
    if (allSelectableSelected) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(selectableIndices));
    }
  }, [allSelectableSelected, selectableIndices]);

  // ── 切换单行选中 ──────────────────────────────────────────────────────────
  const handleToggleLine = useCallback((lineIndex: number) => {
    if (assignedIndices.has(lineIndex)) return;
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(lineIndex)) {
        next.delete(lineIndex);
      } else {
        next.add(lineIndex);
      }
      return next;
    });
  }, [assignedIndices]);

  // ── 添加题目 ───────────────────────────────────────────────────────────────

  const handleAddGroup = () => {
    if (selectedIndices.size === 0) return;

    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    const lineTexts = sortedIndices.map(i => contentLines[i]);
    const interactiveLines: LineInteractiveData[] = lineTexts.map((text, idx) =>
      generateInteractiveBlanks(text, idx)
    );

    const newGroup: ManualGroup = {
      id: groups.length + 1,
      lineIndices: sortedIndices,
      lineTexts,
      interactiveLines,
    };

    onChange([...groups, newGroup]);
    setSelectedIndices(new Set());
  };

  // ── 删除题目 ───────────────────────────────────────────────────────────────

  const handleDeleteGroup = (groupId: number) => {
    const filtered = groups.filter(g => g.id !== groupId);
    const renumbered = filtered.map((g, idx) => ({ ...g, id: idx + 1 }));
    onChange(renumbered);
  };

  // ── 清空全部 ───────────────────────────────────────────────────────────────

  const handleClearAll = () => {
    onChange([]);
    setSelectedIndices(new Set());
  };

  // ── 单字点击切换选词（题目卡片内） ────────────────────────────────────────

  const toggleChar = (groupId: number, lineIdx: number, charPos: number) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      const newLines = g.interactiveLines.map((ld, lIdx) => {
        if (lIdx !== lineIdx) return ld;
        return {
          ...ld,
          blanks: ld.blanks.map((b: InteractiveBlank) => {
            if (b.position === charPos && b.importance > 0) {
              return { ...b, isSelected: !b.isSelected };
            }
            return b;
          }),
        };
      });
      return { ...g, interactiveLines: newLines };
    });
    onChange(updated);
  };

  // ── 推荐选词 / 清除选词（单题） ────────────────────────────────────────────

  const applyRecommended = (groupId: number) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        interactiveLines: g.interactiveLines.map(ld => ({
          ...ld,
          blanks: ld.blanks.map((b: InteractiveBlank) => ({
            ...b,
            isSelected: b.importance >= 2,
          })),
        })),
      };
    });
    onChange(updated);
  };

  const clearSelected = (groupId: number) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        interactiveLines: g.interactiveLines.map(ld => ({
          ...ld,
          blanks: ld.blanks.map((b: InteractiveBlank) => ({ ...b, isSelected: false })),
        })),
      };
    });
    onChange(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mse-root">

      {/* ── 诗句勾选区 ── */}
      <div className="mse-lines-section">
        <div className="mse-lines-header">
          <Checkbox
            checked={allSelectableSelected}
            disabled={selectableIndices.length === 0}
            onChange={handleSelectAll}
          />
          <span className="mse-lines-title">勾选诗句划定题目范围</span>
          {selectableIndices.length > 0 && (
            <span className="mse-hint">
              {selectableIndices.length} 行可选
            </span>
          )}
          {groups.length > 0 && (
            <button
              type="button"
              className="mse-clear-btn"
              onClick={handleClearAll}
            >
              清空全部
            </button>
          )}
        </div>

        <div className="mse-lines-list">
          {contentLines.map((line, idx) => {
            const isAssigned = assignedIndices.has(idx);
            const isSelected = selectedIndices.has(idx);
            const ownerGroup = groups.find(g => g.lineIndices.includes(idx));

            return (
              <div
                key={idx}
                className={[
                  'mse-line',
                  isAssigned ? 'mse-line--assigned' : 'mse-line--free',
                  isSelected ? 'mse-line--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleToggleLine(idx)}
              >
                <Checkbox
                  checked={isSelected || isAssigned}
                  disabled={isAssigned}
                  onChange={() => handleToggleLine(idx)}
                />
                <span className="mse-line-num">{idx + 1}</span>
                <span className="mse-line-text">{line}</span>
                {isAssigned && ownerGroup && (
                  <span className="mse-line-badge">
                    第{toCnNum(ownerGroup.id)}题
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── 底部添加按钮 ── */}
        {selectedIndices.size > 0 && (
          <div className="mse-add-bar">
            <span className="mse-add-bar-text">
              已选 {selectedIndices.size} 行诗句
            </span>
            <button
              type="button"
              className="mse-add-btn"
              onClick={handleAddGroup}
            >
              + 添加为第 {toCnNum(groups.length + 1)} 题
            </button>
          </div>
        )}
      </div>

      {/* ── 已划定的题目卡片 ── */}
      {groups.length > 0 && (
        <div className="mse-groups-section">
          <div className="mse-groups-title">已划定的题目</div>
          {groups.map(group => (
            <div key={group.id} className="mse-group-card">
              <div className="mse-group-header">
                <span className="mse-group-label">第{toCnNum(group.id)}题</span>
                <div className="mse-group-actions">
                  <button
                    type="button"
                    className="mse-action-btn mse-action-btn--recommend"
                    title="自动推荐填空词"
                    onClick={() => applyRecommended(group.id)}
                  >
                    推荐选词
                  </button>
                  <button
                    type="button"
                    className="mse-action-btn mse-action-btn--clear"
                    title="清除该题的填空选择"
                    onClick={() => clearSelected(group.id)}
                  >
                    清除
                  </button>
                  <button
                    type="button"
                    className="mse-action-btn mse-action-btn--delete"
                    title="删除此题目"
                    onClick={() => handleDeleteGroup(group.id)}
                    aria-label={`删除第${toCnNum(group.id)}题`}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="mse-group-lines">
                {group.interactiveLines.map((lineData, lineIdx) => (
                  <div key={lineIdx} className="mse-iline">
                    {lineData.blanks.map((blank: InteractiveBlank) => {
                      if (blank.importance === 0) {
                        return (
                          <span key={blank.position} className="mse-char mse-char--punct">
                            {blank.originalChar}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={blank.position}
                          className={[
                            'mse-char',
                            'mse-char--selectable',
                            blank.isSelected ? 'mse-char--selected' : '',
                            blank.importance === 3 ? 'mse-char--high' :
                            blank.importance === 2 ? 'mse-char--mid' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => toggleChar(group.id, lineIdx, blank.position)}
                          title={blank.isSelected ? '点击取消挖空' : '点击设为挖空'}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleChar(group.id, lineIdx, blank.position);
                            }
                          }}
                          aria-pressed={blank.isSelected}
                        >
                          {blank.isSelected ? '＿' : blank.originalChar}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mse-group-stat">
                已选 {group.interactiveLines.reduce(
                  (sum, ld) => sum + ld.blanks.filter((b: InteractiveBlank) => b.isSelected).length,
                  0
                )} 处填空
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 空态提示 ── */}
      {groups.length === 0 && contentLines.length > 0 && (
        <div className="mse-empty-hint">
          在上方勾选诗句行，然后点击「添加为题目」按钮
        </div>
      )}
    </div>
  );
};

export default ManualSplitEditor;
