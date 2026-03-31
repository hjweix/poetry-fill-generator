import React, { useState, useEffect } from 'react';
import type { LineInteractiveData, FillBlankQuestion, PoetryInput } from '../types';
import { generateInteractiveBlanks, applyManualBlanks, generateFillBlankQuestions, autoDetectTitleAndAuthor, splitLinesBySentence } from '../utils/fillGenerator';

interface InteractiveFillBlanksProps {
  poetryInput: PoetryInput;
  difficulty: string;
  splitBySentence?: boolean;
  onSplitBySentenceChange?: (val: boolean) => void;
  onQuestionsGenerated: (questions: FillBlankQuestion[]) => void;
  onModeChange?: (mode: 'auto' | 'manual') => void;
  className?: string;
}

const InteractiveFillBlanks: React.FC<InteractiveFillBlanksProps> = ({
  poetryInput,
  difficulty,
  splitBySentence = true,
  onSplitBySentenceChange,
  onQuestionsGenerated,
  onModeChange,
  className = ''
}) => {
  const [interactiveLines, setInteractiveLines] = useState<LineInteractiveData[]>([]);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  // 将内容行处理成最终行列表
  const buildContentLines = (raw: string[], split: boolean): string[] => {
    return split ? splitLinesBySentence(raw) : raw;
  };

  // 初始化交互数据
  useEffect(() => {
    if (poetryInput.content.trim()) {
      const allLines = poetryInput.content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      // 过滤掉被识别为标题/作者的行，只保留正文
      const detected = autoDetectTitleAndAuthor(poetryInput.content);
      const filteredLines = allLines.filter(line => {
        const clean = line.replace(/[《》〈〉（）()]/g, '').trim();
        if (detected.title && clean === detected.title) return false;
        if (detected.author && clean === detected.author) return false;
        // 同行含"标题+作者"的格式（如"《登高》杜甫"）也排除
        if (detected.title && detected.author && line.includes(detected.title) && line.includes(detected.author)) return false;
        if (detected.title && line.replace(/[《》〈〉]/g, '').trim() === detected.title) return false;
        return true;
      });

      const contentLines = buildContentLines(filteredLines, splitBySentence);
      const interactiveData = contentLines.map((line, index) => generateInteractiveBlanks(line, index));
      setInteractiveLines(interactiveData);
    }
  }, [poetryInput.content, splitBySentence]);

  // 切换填空选择
  const toggleBlankSelection = (lineIndex: number, charIndex: number) => {
    setInteractiveLines(prev => prev.map((line, idx) => {
      if (idx === lineIndex) {
        return {
          ...line,
          blanks: line.blanks.map(blank => {
            if (blank.position === charIndex && blank.importance > 0) {
              return { ...blank, isSelected: !blank.isSelected };
            }
            return blank;
          })
        };
      }
      return line;
    }));
  };

  // 键盘选择支持
  const handleCharKeyDown = (e: React.KeyboardEvent, lineIndex: number, charIndex: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleBlankSelection(lineIndex, charIndex);
    }
  };

  // 自动选择推荐填空
  const selectRecommendedBlanks = () => {
    setInteractiveLines(prev => prev.map(line => ({
      ...line,
      blanks: line.blanks.map(blank => {
        if (blank.importance >= 2 && blank.importance > 0) { // 选择重要性>=2的字符
          return { ...blank, isSelected: true };
        }
        return { ...blank, isSelected: false };
      })
    })));
  };

  // 清除所有选择
  const clearAllSelections = () => {
    setInteractiveLines(prev => prev.map(line => ({
      ...line,
      blanks: line.blanks.map(blank => ({ ...blank, isSelected: false }))
    })));
  };

  // 生成最终题目
  const generateFinalQuestions = () => {
    if (mode === 'manual') {
      const manualQuestions = applyManualBlanks(interactiveLines);
      const questionsWithMetadata = manualQuestions.map(q => ({
        ...q,
        author: poetryInput.author,
        title: poetryInput.title
      }));
      onQuestionsGenerated(questionsWithMetadata);
    } else {
      const autoQuestions = generateFillBlankQuestions(poetryInput, difficulty as any, splitBySentence);
      onQuestionsGenerated(autoQuestions);
    }
  };

  if (!poetryInput.content.trim()) {
    return null;
  }

  return (
    <div
      className={`interactive-fill-blanks ${className}`.trim()}
      data-testid="interactive-blanks"
      role="region"
      aria-label="交互式填空选择"
    >
      <div className="mode-selector">
        <h3 className="stitch-h3">填空模式选择</h3>
        <div className="mode-buttons" role="tablist" aria-label="填空模式">
          <button
            className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
            onClick={() => { setMode('auto'); onModeChange?.('auto'); }}
            role="tab"
            aria-selected={mode === 'auto'}
            aria-controls="interactive-content"
            data-testid="mode-auto-btn"
          >
            🤖 智能填空
          </button>
          <button
            className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => { setMode('manual'); onModeChange?.('manual'); }}
            role="tab"
            aria-selected={mode === 'manual'}
            aria-controls="manual-controls"
            data-testid="mode-manual-btn"
          >
            ✋ 手动选择
          </button>
        </div>

        {/* 分句设置 */}
        <label className="split-sentence-toggle" aria-label="按句末标点分句设置">
          <input
            type="checkbox"
            checked={splitBySentence}
            onChange={e => onSplitBySentenceChange?.(e.target.checked)}
            data-testid="split-sentence-checkbox"
          />
          <span className="split-sentence-label">
            按句末标点分句
            <span className="split-sentence-hint">（。！？…）</span>
          </span>
        </label>
      </div>

      {mode === 'manual' && (
        <div className="manual-controls" data-testid="manual-controls" role="toolbar" aria-label="手动填空工具">
          <button
            onClick={selectRecommendedBlanks}
            className="stitch-button stitch-button--secondary"
            data-testid="select-recommended-btn"
            aria-label="选择推荐填空"
          >
            🎯 选择推荐填空
          </button>
          <button
            onClick={clearAllSelections}
            className="stitch-button stitch-button--secondary"
            data-testid="clear-all-btn"
            aria-label="清除所有选择"
          >
            🗑️ 清除所有选择
          </button>
        </div>
      )}

      <div className="interactive-lines" id="interactive-content" role="tabpanel">
        {interactiveLines.map((lineData, lineIndex) => (
          <div key={lineIndex} className="interactive-line" role="group" aria-label={`第${lineIndex + 1}句`}>
            <div className="line-number">第{lineIndex + 1}句</div>
            <div className="line-content" aria-label="点击字符选择填空">
              {lineData.blanks.map((blank, charIndex) => {
                if (blank.importance === 0) {
                  // 不可选择的字符（标点符号等）
                  return (
                    <span key={charIndex} className="protected-char" aria-hidden="true">
                      {blank.originalChar}
                    </span>
                  );
                }

                return (
                  <span
                    key={charIndex}
                    className={`char-selectable ${
                      blank.isSelected ? 'selected' : ''
                    } ${
                      blank.importance === 3 ? 'high-importance' :
                      blank.importance === 2 ? 'medium-importance' : 'low-importance'
                    }`}
                    onClick={() => mode === 'manual' && toggleBlankSelection(lineIndex, blank.position)}
                    onKeyDown={(e) => handleCharKeyDown(e, lineIndex, blank.position)}
                    role="button"
                    tabIndex={mode === 'manual' ? 0 : -1}
                    aria-pressed={mode === 'manual' ? blank.isSelected : undefined}
                    aria-label={
                      mode === 'manual'
                        ? `${blank.originalChar}，点击${blank.isSelected ? '取消' : '选择'}为填空，重要性${blank.importance === 3 ? '高' : blank.importance === 2 ? '中' : '低'}`
                        : blank.originalChar
                    }
                    title={mode === 'manual' ? `点击${blank.isSelected ? '取消' : '选择'}填空 (重要性: ${blank.importance})` : ''}
                  >
                    {blank.isSelected ? '____' : blank.originalChar}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* auto 模式：无需内部生成按钮，由外部「智能生成」统一触发 */}
      {mode === 'manual' && (
        <div className="generate-section">
          <button
            onClick={generateFinalQuestions}
            className="stitch-button stitch-button--primary"
            data-testid="generate-blanks-btn"
            aria-label="确认生成填空题"
          >
            ✨ 确认生成
          </button>
        </div>
      )}

    </div>
  );
};

export default InteractiveFillBlanks;