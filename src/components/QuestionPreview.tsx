import React from 'react';
import type { QuestionGroup, FillBlankQuestion } from '../types';

interface QuestionPreviewProps {
  questionGroups: QuestionGroup[];
  inputMode?: 'single' | 'batch';
}

// 将填空符号渲染为带下划线的空格
function renderQuestionText(text: string) {
  const parts = text.split(/(_{4,})/g);
  return parts.map((part, i) => {
    if (/_{4,}/.test(part)) {
      return (
        <span key={i} className="fill-blank-underline" aria-label="填空处">
          &#x3000;&#x3000;&#x3000;&#x3000;&#x3000;&#x3000;
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  questionGroups,
  inputMode = 'single',
}) => {
  if (questionGroups.length === 0) {
    return (
      <div className="exam-empty" data-testid="question-preview">
        <svg
          width="40" height="40" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          className="exam-empty-icon"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <p className="exam-empty-text">尚未生成填空题</p>
        <p className="exam-empty-hint">在左侧输入诗词，选择难度后点击「智能生成」</p>
      </div>
    );
  }

  const totalLines = questionGroups.reduce((s, g) => s + g.lines.length, 0);
  const showGroupPoetryLabel = inputMode === 'batch' && questionGroups.length > 1;

  return (
    <div className="exam-paper" data-testid="question-preview">
      {/* 试卷标题区 */}
      <div className="exam-paper-header">
        <div className="exam-paper-title">诗词填空题</div>
        <div className="exam-paper-instruction">
          请在横线上填写正确的字词。（共&nbsp;
          <strong>{questionGroups.length}</strong>&nbsp;题，{totalLines}&nbsp;句）
        </div>
      </div>

      <div className="exam-divider" />

      {/* 题目列表 */}
      <div className="exam-questions" data-testid="questions-container">
        {questionGroups.map((group, groupIndex) => {
          // 本题的出处信息（大题末尾显示一次）
          const sourceInfo =
            group.author && group.title
              ? `（${group.author}《${group.title}》）`
              : group.author
              ? `（${group.author}）`
              : group.title
              ? `（《${group.title}》）`
              : '';

          return (
            <React.Fragment key={group.id}>
              {/* ── 大题块 ── */}
              <div className="exam-group" data-testid="question-group">

                {/* 跨诗词时显示诗词标签 */}
                {showGroupPoetryLabel && groupIndex > 0 &&
                  (() => {
                    const prev = questionGroups[groupIndex - 1];
                    const prevKey = prev.poetryId || `${prev.title}-${prev.author}`;
                    const curKey = group.poetryId || `${group.title}-${group.author}`;
                    return prevKey !== curKey;
                  })() && (
                  <div className="exam-group-title">
                    {group.title ? `《${group.title}》` : ''}
                    {group.author ? `　${group.author}` : ''}
                  </div>
                )}
                {showGroupPoetryLabel && groupIndex === 0 && (
                  <div className="exam-group-title">
                    {group.title ? `《${group.title}》` : ''}
                    {group.author ? `　${group.author}` : ''}
                  </div>
                )}

                {/* 大题题号行 */}
                <div className="exam-question-item" data-testid="question-item">
                  <div className="exam-question-text">
                    <span className="exam-question-num">
                      （{group.id}）
                    </span>
                    {/* 多行填空：每行一个 <p> */}
                    <span className="exam-question-lines">
                      {group.lines.map((line: FillBlankQuestion, lineIdx: number) => (
                        <span key={line.id} className="exam-question-line" data-testid="question-text">
                          {renderQuestionText(line.questionText)}
                          {/* 非最后一行加间隔符 */}
                          {lineIdx < group.lines.length - 1 && (
                            <span className="exam-line-sep">　</span>
                          )}
                        </span>
                      ))}
                      {/* 出处（大题末尾显示一次） */}
                      {sourceInfo && (
                        <span className="exam-question-source">{sourceInfo}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 底部统计 */}
      <div className="exam-divider" style={{ marginTop: '1rem' }} />
      <div className="exam-footer" data-testid="preview-stats">
        共&nbsp;<strong>{questionGroups.length}</strong>&nbsp;道大题
        &nbsp;·&nbsp;<strong>{totalLines}</strong>&nbsp;行填空
        {(() => {
          const poetrySet = new Set(questionGroups.map(g => g.poetryId || `${g.title}-${g.author}`));
          return poetrySet.size > 1 ? (
            <>&nbsp;·&nbsp;<strong>{poetrySet.size}</strong>&nbsp;首诗词</>
          ) : null;
        })()}
      </div>
    </div>
  );
};

export default QuestionPreview;
