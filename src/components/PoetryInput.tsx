import React, { useRef } from 'react';
import type { PoetryInput as PoetryInputType } from '../types';
import { autoDetectTitleAndAuthor } from '../utils/fillGenerator';

interface PoetryInputProps {
  value: PoetryInputType;
  onChange: (poetry: PoetryInputType) => void;
}

const PoetryInput: React.FC<PoetryInputProps> = ({ value, onChange }) => {
  // 跟踪标题/作者是否被用户手动编辑过
  const titleManualRef = useRef(false);
  const authorManualRef = useRef(false);

  const handleContentChange = (newContent: string) => {
    const detected = autoDetectTitleAndAuthor(newContent);
    onChange({
      ...value,
      content: newContent,
      // 只有未手动编辑过时才自动填充
      title: titleManualRef.current ? value.title : (detected.title || ''),
      author: authorManualRef.current ? value.author : (detected.author || ''),
    });
  };

  const handleTitleChange = (newTitle: string) => {
    titleManualRef.current = true; // 标记为手动编辑
    onChange({ ...value, title: newTitle });
  };

  const handleAuthorChange = (newAuthor: string) => {
    authorManualRef.current = true; // 标记为手动编辑
    onChange({ ...value, author: newAuthor });
  };

  // 重置手动标记（清空内容时还原自动识别）
  const handleClearContent = () => {
    titleManualRef.current = false;
    authorManualRef.current = false;
    onChange({ content: '', title: '', author: '' });
  };

  const detected = autoDetectTitleAndAuthor(value.content);
  const hasDetected = !!(detected.title || detected.author);
  const hasContent = value.content.trim().length > 0;

  return (
    <div className="poetry-input">
      {/* 第一步：输入诗词内容 */}
      <div className="input-group">
        <div className="input-label-row">
          <label htmlFor="poetry-content" className="label stitch-caption">
            诗词内容
          </label>
          {hasContent && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClearContent}
              title="清空内容"
            >
              清空
            </button>
          )}
        </div>
        <textarea
          id="poetry-content"
          data-testid="poetry-content-input"
          value={value.content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={`直接粘贴或输入诗词内容，系统自动识别标题与作者\n\n示例：\n《登高》杜甫\n风急天高猿啸哀，渚清沙白鸟飞回\n无边落木萧萧下，不尽长江滚滚来`}
          className="stitch-input textarea"
          rows={8}
          aria-describedby="poetry-content-desc"
          aria-required="true"
        />
        <span id="poetry-content-desc" className="sr-only">
          输入诗词内容，每行一句
        </span>
      </div>

      {/* 自动识别结果 + 可编辑 */}
      {hasContent && (
        <div className="auto-detect-panel">
          <div className="auto-detect-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" className="auto-detect-icon">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span className="auto-detect-label">
              {hasDetected ? '已自动识别' : '未识别到标题/作者，请手动填写'}
            </span>
          </div>

          <div className="auto-detect-fields">
            <div className="auto-detect-field">
              <label htmlFor="poetry-title" className="auto-detect-field-label">
                标题
              </label>
              <input
                id="poetry-title"
                type="text"
                data-testid="poetry-title-input"
                value={value.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="诗词标题（可选）"
                className="auto-detect-input"
                aria-describedby="poetry-title-desc"
              />
              <span id="poetry-title-desc" className="sr-only">诗词标题</span>
            </div>

            <div className="auto-detect-field">
              <label htmlFor="poetry-author" className="auto-detect-field-label">
                作者
              </label>
              <input
                id="poetry-author"
                type="text"
                data-testid="poetry-author-input"
                value={value.author}
                onChange={(e) => handleAuthorChange(e.target.value)}
                placeholder="作者姓名（可选）"
                className="auto-detect-input"
                aria-describedby="poetry-author-desc"
              />
              <span id="poetry-author-desc" className="sr-only">作者</span>
            </div>
          </div>

          {(titleManualRef.current || authorManualRef.current) && (
            <button
              type="button"
              className="reset-detect-btn"
              onClick={() => {
                titleManualRef.current = false;
                authorManualRef.current = false;
                const re = autoDetectTitleAndAuthor(value.content);
                onChange({ ...value, title: re.title || '', author: re.author || '' });
              }}
            >
              ↺ 恢复自动识别
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PoetryInput;
