/**
 * TextSelectionEditor
 *
 * 文本选择式手动拆分编辑器，工作流：
 *   1. 展示诗词正文（支持原生文本选择）
 *   2. 用户用鼠标拖选任意文字（可以跨行，也可以只选部分文字）
 *   3. 选区上方出现"添加选题"浮动按钮
 *   4. 点击按钮，选中文字被添加为一道选题
 *   5. 题库中每个选题卡片可逐字选择挖空词
 *   6. 用户可随时编辑/删除选题卡片
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ManualGroup, LineInteractiveData, InteractiveBlank, BlankMode } from '../types';
import { generateInteractiveBlanks } from '../utils/fillGenerator';
import SelectionFloatingButton from './SelectionFloatingButton';

// ─── 常量 ────────────────────────────────────────────────────────────────────

const CN_NUMS = ['一','二','三','四','五','六','七','八','九','十',
                 '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];

function toCnNum(n: number): string {
  return n <= CN_NUMS.length ? CN_NUMS[n - 1] : String(n);
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TextSelectionEditorProps {
  contentLines: string[];
  groups: ManualGroup[];
  onChange: (groups: ManualGroup[]) => void;
  blankMode: BlankMode;
}

// ─── Main Component ─────────────────────────────────────────────────────────

const TextSelectionEditor: React.FC<TextSelectionEditorProps> = ({
  contentLines,
  groups,
  onChange,
  blankMode,
}) => {
  const linesContainerRef = useRef<HTMLDivElement>(null);

  // 浮动按钮状态
  const [floatingVisible, setFloatingVisible] = useState(false);
  const [floatingRect, setFloatingRect] = useState<DOMRect | null>(null);
  /** 用户实际选中的文字（可能跨行） */
  const [selectedText, setSelectedText] = useState<string>('');

  // ── 监听文本选择 ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !linesContainerRef.current) {
        setFloatingVisible(false);
        setSelectedText('');
        return;
      }

      const range = selection.getRangeAt(0);
      if (!range) return;

      const container = linesContainerRef.current;
      if (!container.contains(range.commonAncestorContainer)) {
        setFloatingVisible(false);
        setSelectedText('');
        return;
      }

      // 获取用户实际选中的文字
      const text = selection.toString();
      if (!text.trim()) {
        setFloatingVisible(false);
        setSelectedText('');
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setFloatingVisible(false);
        setSelectedText('');
        return;
      }

      setSelectedText(text);
      setFloatingRect(rect);
      setFloatingVisible(true);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);

  // ── 添加选题：用选中的文字作为一道题 ──────────────────────────────────────
  const handleAddTopic = useCallback(() => {
    if (!selectedText.trim()) return;

    const text = selectedText.trim();

    // 把选中的文字按换行拆分为多行，每行作为独立的一行数据
    const lineTexts = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lineTexts.length === 0) return;

    // 生成可交互填空数据（lineIndex 用 0-based）
    const interactiveLines: LineInteractiveData[] = lineTexts.map((lt, idx) =>
      generateInteractiveBlanks(lt, idx)
    );

    const newGroup: ManualGroup = {
      id: groups.length + 1,
      // 手动选择的片段，没有有意义的行索引，用 -1 占位
      lineIndices: lineTexts.map((_, i) => -(groups.length + 1) * 100 - i),
      lineTexts,
      interactiveLines,
    };

    onChange([...groups, newGroup]);

    // 清除选区和浮动按钮
    window.getSelection()?.removeAllRanges();
    setFloatingVisible(false);
    setSelectedText('');
  }, [selectedText, groups, onChange]);

  // ── 取消浮动按钮 ─────────────────────────────────────────────────────────
  const handleCancelFloating = useCallback(() => {
    setFloatingVisible(false);
    setSelectedText('');
  }, []);

  // ── 删除题目 ──────────────────────────────────────────────────────────────
  const handleDeleteGroup = (groupId: number) => {
    const filtered = groups.filter(g => g.id !== groupId);
    const renumbered = filtered.map((g, idx) => ({ ...g, id: idx + 1 }));
    onChange(renumbered);
  };

  // ── 清空全部 ──────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    onChange([]);
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

  // ── 整句模式：点击某个字，选中该字所在的逗号分段 ──────────────────────────
  const handleSegmentClick = (groupId: number, lineIdx: number, charPos: number) => {
    if (blankMode !== 'whole') return;

    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const lineData = group.interactiveLines[lineIdx];
    if (!lineData) return;

    const blanks = lineData.blanks;

    // 定义句子分隔标点（importance === 0 的标点即为分隔符）
    const isSeparator = (b: InteractiveBlank) => b.importance === 0;

    // 找到 charPos 所在的分段范围 [segStart, segEnd)（不含分隔标点本身）
    let segStart = charPos;
    let segEnd = charPos;

    // 向左找到上一个分隔标点之后的位置
    while (segStart > 0 && !isSeparator(blanks[segStart - 1])) {
      segStart--;
    }

    // 向右找到下一个分隔标点的位置
    while (segEnd < blanks.length && !isSeparator(blanks[segEnd])) {
      segEnd++;
    }

    // 收集该分段内所有 importance > 0 的位置
    const segmentPositions = new Set<number>();
    for (let i = segStart; i < segEnd; i++) {
      if (blanks[i].importance > 0) {
        segmentPositions.add(i);
      }
    }

    // 检查该分段是否已全部选中 → 决定是全选还是全取消
    const allSelected = [...segmentPositions].every(pos => blanks[pos].isSelected);

    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        interactiveLines: g.interactiveLines.map((ld, idx) => {
          if (idx !== lineIdx) return ld;
          return {
            ...ld,
            blanks: ld.blanks.map((b, pos) => {
              if (!segmentPositions.has(pos)) return b;
              return { ...b, isSelected: !allSelected };
            }),
          };
        }),
      };
    });
    onChange(updated);
  };

  // ── 智能选词核心逻辑（纯函数，不依赖 state） ──────────────────────────────
  const smartSelectBlanks = useCallback((group: ManualGroup, mode: BlankMode): ManualGroup => {
    if (mode === 'whole') {
      return {
        ...group,
        interactiveLines: group.interactiveLines.map(ld => {
          const blanks = ld.blanks;
          const separators: number[] = [];
          blanks.forEach((b, i) => { if (b.importance === 0) separators.push(i); });

          const segments: { start: number; end: number }[] = [];
          let segStart = 0;
          for (const sep of separators) {
            segments.push({ start: segStart, end: sep });
            segStart = sep + 1;
          }
          segments.push({ start: segStart, end: blanks.length });

          let targetSeg = segments[segments.length - 1];
          for (let i = segments.length - 1; i >= 0; i--) {
            const hasContent = blanks.slice(segments[i].start, segments[i].end)
              .some(b => b.importance > 0);
            if (hasContent) { targetSeg = segments[i]; break; }
          }

          const targetPositions = new Set<number>();
          for (let i = targetSeg.start; i < targetSeg.end; i++) {
            if (blanks[i].importance > 0) targetPositions.add(i);
          }

          return {
            ...ld,
            blanks: blanks.map(b => ({
              ...b,
              isSelected: targetPositions.has(b.position),
            })),
          };
        }),
      };
    }

    const maxPerLine = mode === 'few' ? 2 : 4;
    const minImportance = mode === 'few' ? 3 : 2;

    return {
      ...group,
      interactiveLines: group.interactiveLines.map(ld => {
        const blanks = ld.blanks.filter((b: InteractiveBlank) => b.importance > 0);
        const sorted = [...blanks].sort((a, b) => b.importance - a.importance);
        const selected = new Set<number>();

        for (const b of sorted) {
          if (b.importance >= minImportance && selected.size < maxPerLine) {
            selected.add(b.position);
          }
        }
        if (selected.size < maxPerLine) {
          for (const b of sorted) {
            if (!selected.has(b.position) && selected.size < maxPerLine) {
              selected.add(b.position);
            }
          }
        }

        return {
          ...ld,
          blanks: ld.blanks.map((b: InteractiveBlank) => ({
            ...b,
            isSelected: selected.has(b.position),
          })),
        };
      }),
    };
  }, []);

  // ── 推荐选词（单题） ──────────────────────────────────────────────────────
  const applyRecommended = (groupId: number) => {
    const updated = groups.map(g =>
      g.id === groupId ? smartSelectBlanks(g, blankMode) : g
    );
    onChange(updated);
  };

  // ── 一键智能选词（所有题） ────────────────────────────────────────────────
  const applyAllRecommended = () => {
    const updated = groups.map(g => smartSelectBlanks(g, blankMode));
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

  // ── 题目统计 ──────────────────────────────────────────────────────────────
  const totalBlanks = groups.reduce(
    (sum, g) => sum + g.interactiveLines.reduce(
      (s, ld) => s + ld.blanks.filter((b: InteractiveBlank) => b.isSelected).length,
      0
    ),
    0
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="tse-root">

      {/* ── 浮动按钮 ── */}
      <SelectionFloatingButton
        visible={floatingVisible}
        rangeRect={floatingRect}
        onConfirm={handleAddTopic}
        onCancel={handleCancelFloating}
      />

      {/* ── 诗句选择区 ── */}
      <div className="tse-lines-section">
        <div className="tse-lines-header">
          <span className="tse-lines-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3l14 9-14 9V3z"/>
            </svg>
          </span>
          <span className="tse-lines-title">用鼠标选中文字，添加为单独的填空题</span>
          {groups.length > 0 && (
            <button
              type="button"
              className="tse-clear-btn"
              onClick={handleClearAll}
            >
              清空全部
            </button>
          )}
        </div>

        <div className="tse-lines-list" ref={linesContainerRef}>
          {contentLines.map((line, idx) => (
            <div
              key={idx}
              className="tse-line tse-line--free"
              data-line-index={idx}
            >
              <span className="tse-line-num">{idx + 1}</span>
              <span className="tse-line-text">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 已添加的选题卡片 ── */}
      {groups.length > 0 && (
        <div className="tse-groups-section">
          <div className="tse-groups-header">
            <span className="tse-groups-title">
              已添加 {groups.length} 道填空题
              {totalBlanks > 0 && (
                <span className="tse-groups-stat">（共 {totalBlanks} 处挖空）</span>
              )}
            </span>
            <button
              type="button"
              className="tse-action-btn tse-action-btn--recommend tse-smart-all-btn"
              onClick={applyAllRecommended}
              title="根据难度设置，为所有填空题智能选词"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              一键智能选词
            </button>
          </div>

          {groups.map(group => {
            const blanksInGroup = group.interactiveLines.reduce(
              (s, ld) => s + ld.blanks.filter((b: InteractiveBlank) => b.isSelected).length,
              0
            );

            return (
              <div key={group.id} className="tse-group-card">
                <div className="tse-group-header">
                  <span className="tse-group-label">第{toCnNum(group.id)}题</span>
                  <div className="tse-group-actions">
                    <button
                      type="button"
                      className="tse-action-btn tse-action-btn--recommend"
                      title="自动推荐填空词"
                      onClick={() => applyRecommended(group.id)}
                    >
                      推荐选词
                    </button>
                    <button
                      type="button"
                      className="tse-action-btn tse-action-btn--clear"
                      title="清除该题的填空选择"
                      onClick={() => clearSelected(group.id)}
                    >
                      清除
                    </button>
                    <button
                      type="button"
                      className="tse-action-btn tse-action-btn--delete"
                      title="删除此填空题"
                      onClick={() => handleDeleteGroup(group.id)}
                      aria-label={`删除第${toCnNum(group.id)}题`}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="tse-group-lines">
                  {group.interactiveLines.map((lineData, lineIdx) => (
                    <div key={lineIdx} className="tse-iline">
                      {lineData.blanks.map((blank: InteractiveBlank) => {
                        if (blank.importance === 0) {
                          return (
                            <span key={blank.position} className="tse-char tse-char--punct">
                              {blank.originalChar}
                            </span>
                          );
                        }
                        // 整句模式：点击选中逗号分隔的片段；非整句模式：点击切换单字
                        const handleClick = blankMode === 'whole'
                          ? () => handleSegmentClick(group.id, lineIdx, blank.position)
                          : () => toggleChar(group.id, lineIdx, blank.position);
                        const clickTitle = blankMode === 'whole'
                          ? '点击挖空此句段'
                          : (blank.isSelected ? '点击取消挖空' : '点击设为挖空');
                        return (
                          <span
                            key={blank.position}
                            className={[
                              'tse-char',
                              'tse-char--selectable',
                              blank.isSelected ? 'tse-char--selected' : '',
                              blank.importance === 3 ? 'tse-char--high' :
                              blank.importance === 2 ? 'tse-char--mid' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={handleClick}
                            title={clickTitle}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleClick();
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

                <div className="tse-group-stat">
                  {blanksInGroup > 0
                    ? `已选 ${blanksInGroup} 处填空`
                    : '点击上方文字选择挖空词，或使用「推荐选词」'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 空态提示 ── */}
      {groups.length === 0 && contentLines.length > 0 && (
        <div className="tse-empty-hint">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:'6px'}}>
            <path d="M5 3l14 9-14 9V3z"/>
          </svg>
          用鼠标拖选上方诗句中的文字，<br/>然后点击出现的「添加填空题」按钮
        </div>
      )}
    </div>
  );
};

export default TextSelectionEditor;
