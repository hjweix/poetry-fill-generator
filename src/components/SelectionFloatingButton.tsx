/**
 * SelectionFloatingButton — 选区浮动操作按钮
 *
 * 当用户在诗句区域选中文字后，在选区上方浮现一个"添加选题"按钮。
 * 点击后将选中文本添加为题目。
 */

import React, { useEffect, useRef, useState } from 'react';

interface SelectionFloatingButtonProps {
  /** 浮动按钮是否可见 */
  visible: boolean;
  /** 选区矩形信息（left, top, width, height 相对于视口） */
  rangeRect: DOMRect | null;
  /** 点击确认回调 */
  onConfirm: () => void;
  /** 点击取消/关闭回调 */
  onCancel: () => void;
}

const SelectionFloatingButton: React.FC<SelectionFloatingButtonProps> = ({
  visible,
  rangeRect,
  onConfirm,
  onCancel,
}) => {
  const btnRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // 根据选区位置计算按钮坐标
  useEffect(() => {
    if (visible && rangeRect) {
      // 按钮在选区上方居中
      const top = rangeRect.top - 40;
      const left = rangeRect.left + rangeRect.width / 2;

      // 确保不超出视口
      const clampedLeft = Math.max(60, Math.min(left, window.innerWidth - 60));
      const clampedTop = Math.max(8, top);

      setPosition({ top: clampedTop, left: clampedLeft });
    }
  }, [visible, rangeRect]);

  // ESC 取消
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        // 清除浏览器选区
        window.getSelection()?.removeAllRanges();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel]);

  if (!visible) return null;

  return (
    <div
      ref={btnRef}
      className="tse-floating-btn"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        className="tse-floating-btn__confirm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onConfirm();
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        添加填空题
      </button>
    </div>
  );
};

export default SelectionFloatingButton;
