import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import './App.css';
import PoetryInput from './components/PoetryInput';
import QuestionPreview from './components/QuestionPreview';
import BatchPoetryInput from './components/BatchPoetryInput';
import SplitModePanel from './components/SplitModePanel';
import {
  generateFillBlankQuestions,
  generateBatchFillBlankQuestions,
  groupQuestions,
  formatGroupsForExport,
  convertManualGroupsToQuestionGroups,
  autoDetectTitleAndAuthor,
  splitLinesBySentence,
  blankModeToDifficulty,
} from './utils/fillGenerator';
import { exportToDocx } from './utils/docxExporter';
import { exportToPdf } from './utils/pdfExporter';
import type {
  PoetryInput as PoetryInputType,
  FillBlankQuestion,
  BatchPoetryItem,
  QuestionGroup,
  GroupSize,
  ManualGroup,
  BlankMode,
} from './types';

type InputMode = 'single' | 'batch';

// 从诗词原始内容中提取正文行（过滤标题/作者行）
function extractContentLines(content: string): string[] {
  const detected = autoDetectTitleAndAuthor(content);
  const allLines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return allLines.filter(line => {
    const clean = line.replace(/[《》〈〉（）()]/g, '').trim();
    if (detected.title && clean === detected.title) return false;
    if (detected.author && clean === detected.author) return false;
    if (detected.title && detected.author && line.includes(detected.title) && line.includes(detected.author)) return false;
    if (detected.title && line.replace(/[《》〈〉]/g, '').trim() === detected.title) return false;
    return true;
  });
}

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('single');
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const [poetryInput, setPoetryInput] = useState<PoetryInputType>({
    content: '',
    author: '',
    title: '',
  });
  const [batchItems, setBatchItems] = useState<BatchPoetryItem[]>([]);

  // ── 拆题设置 ──────────────────────────────────────────────────────────────
  // 全局挖空程度
  const [blankMode, setBlankMode] = useState<BlankMode>('whole');
  const [singleGroupSize, setSingleGroupSize] = useState<GroupSize>('whole');

  // 手动拆分：ManualGroup 列表（单首模式专用）
  const [manualGroups, setManualGroups] = useState<ManualGroup[]>([]);

  // ── questions / groups ────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<FillBlankQuestion[]>([]);
  // 手动调整后的最终分组（合并/拆分后覆盖）
  const [adjustedGroups, setAdjustedGroups] = useState<QuestionGroup[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const previewRef = useRef<HTMLDivElement>(null);

  // ── 单首正文行（ManualSplitEditor 用） ────────────────────────────────────
  const singleContentLines = useMemo(() => {
    if (!poetryInput.content.trim()) return [];
    return extractContentLines(poetryInput.content);
  }, [poetryInput.content]);

  // ── 构建 groupSizeMap ──────────────────────────────────────────────────────
  const groupSizeMap = useMemo<Map<string, GroupSize>>(() => {
    const map = new Map<string, GroupSize>();
    if (inputMode === 'single') {
      const key = `${poetryInput.title || ''}-${poetryInput.author || ''}`;
      map.set(key, singleGroupSize);
    } else {
      batchItems.forEach(item => {
        map.set(item.id, item.groupSize ?? 'whole');
      });
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, singleGroupSize, batchItems, poetryInput.title, poetryInput.author]);

  // ── 初始分组（智能模式） ───────────────────────────────────────────────────
  const initialGroups = useMemo<QuestionGroup[]>(() => {
    return groupQuestions(questions, groupSizeMap);
  }, [questions, groupSizeMap]);

  // 当初始分组重算时，重置手动调整状态
  useEffect(() => {
    setAdjustedGroups(initialGroups);
  }, [initialGroups]);

  // 当 manualGroups 变化时，实时更新预览（单首手动拆分）
  useEffect(() => {
    if (inputMode === 'single' && manualGroups.length > 0) {
      const groups = convertManualGroupsToQuestionGroups(
        manualGroups,
        poetryInput.title,
        poetryInput.author
      );
      setAdjustedGroups(groups);
    }
  }, [inputMode, manualGroups, poetryInput.title, poetryInput.author]);

  // ── 切换诗词内容时清空手动题目 ─────────────────────────────────────────────
  useEffect(() => {
    setManualGroups([]);
  }, [poetryInput.content]);

  // ── 预览区高度跟随左侧模块 ───────────────────────────────────────────────
  useEffect(() => {
    const inputEl = inputSectionRef.current;
    const previewEl = previewRef.current?.closest('.preview-section') as HTMLElement | null;
    if (!inputEl || !previewEl) return;

    const syncHeight = () => {
      previewEl.style.maxHeight = `${inputEl.offsetHeight}px`;
    };

    const observer = new ResizeObserver(syncHeight);
    observer.observe(inputEl);
    syncHeight();

    return () => observer.disconnect();
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ── 智能生成（SplitModePanel 内的按钮调用） ────────────────────────────────
  const handleSmartGenerate = () => {
    if (inputMode === 'single') {
      if (!poetryInput.content.trim()) {
        showToast('请输入诗词内容', 'error');
        return;
      }
      setIsGenerating(true);
      try {
        const rawLines = extractContentLines(poetryInput.content);
        const lines = splitLinesBySentence(rawLines);
        const difficulty = blankModeToDifficulty(blankMode);
        const generatedQuestions = generateFillBlankQuestions(
          { ...poetryInput, content: lines.join('\n') },
          difficulty,
          false
        );
        setQuestions(generatedQuestions);
        showToast(`已生成 ${generatedQuestions.length} 行填空题`, 'success');
      } catch (error) {
        console.error('生成填空题失败:', error);
        showToast('生成失败，请检查输入内容', 'error');
      } finally {
        setIsGenerating(false);
      }
    } else {
      // 批量模式
      const validItems = batchItems.filter(item => item.poetry.content.trim());
      if (validItems.length === 0) {
        showToast('请先解析诗词内容', 'error');
        return;
      }
      setIsGenerating(true);
      try {
        const difficulty = blankModeToDifficulty(blankMode);
        const generatedQuestions = generateBatchFillBlankQuestions(validItems, difficulty, true);
        setQuestions(generatedQuestions);
        showToast(`已生成 ${generatedQuestions.length} 行填空题`, 'success');
      } catch (error) {
        console.error('批量生成填空题失败:', error);
        showToast('生成失败，请检查输入内容', 'error');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // ── 导出 ───────────────────────────────────────────────────────────────────
  const handleExportDocx = async () => {
    if (adjustedGroups.length === 0) { showToast('请先生成填空题', 'error'); return; }
    try {
      const title = inputMode === 'single' ? (poetryInput.title || '诗词填空题') : '诗词填空题';
      // 直接传分组数据，与预览区保持一致
      await exportToDocx(adjustedGroups, title, inputMode);
      showToast('Word 文档导出成功', 'success');
    } catch (error) {
      console.error('导出失败:', error);
      showToast('导出失败，请重试', 'error');
    }
  };

  const handleExportPdf = async () => {
    if (adjustedGroups.length === 0) { showToast('请先生成填空题', 'error'); return; }
    if (!previewRef.current) { showToast('预览区域未就绪', 'error'); return; }
    setIsExportingPdf(true);
    try {
      const title = inputMode === 'single' ? (poetryInput.title || '诗词填空题') : '诗词填空题';
      await exportToPdf(previewRef.current, title);
      showToast('PDF 导出成功', 'success');
    } catch (error) {
      console.error('PDF 导出失败:', error);
      showToast('PDF 导出失败，请重试', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (adjustedGroups.length === 0) { showToast('请先生成填空题', 'error'); return; }
    window.print();
  };

  const handleCopyText = () => {
    if (adjustedGroups.length === 0) { showToast('请先生成填空题', 'error'); return; }
    const textContent = formatGroupsForExport(adjustedGroups);
    navigator.clipboard.writeText(textContent).then(() => {
      showToast('已复制到剪贴板', 'success');
    }).catch(() => {
      showToast('复制失败，请手动复制', 'error');
    });
  };

  const hasContent = inputMode === 'single'
    ? poetryInput.content.trim().length > 0
    : batchItems.some(item => item.poetry.content.trim());

  return (
    <div className="app" role="application" aria-label="诗词填空生成器">
      {/* 顶部 Header */}
      <header className="app-header" data-testid="app-header">
        <div className="header-glow" />
        <div className="header-content">
          <div className="header-badge">诗词学习工具</div>
          <h1>诗词填空生成器</h1>
          <p>传承千年文韵，智能生成填空题，助力诗词教学</p>
        </div>
      </header>

      <main className="app-main" data-testid="app-main">
        {/* 左侧：输入区 */}
        <div className="input-section" ref={inputSectionRef}>

          {/* 单首/批量 Tab 切换 */}
          <div className="input-mode-tabs">
            <button
              className={`mode-tab ${inputMode === 'single' ? 'active' : ''}`}
              onClick={() => setInputMode('single')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              单首录入
            </button>
            <button
              className={`mode-tab ${inputMode === 'batch' ? 'active' : ''}`}
              onClick={() => setInputMode('batch')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              批量录入
            </button>
          </div>

          {/* 输入内容区 */}
          <div className="input-content-area">
            {inputMode === 'single' ? (
              <PoetryInput value={poetryInput} onChange={setPoetryInput} />
            ) : (
              <BatchPoetryInput items={batchItems} onChange={setBatchItems} />
            )}
          </div>

          {/* 拆题面板 */}
          {hasContent && (
            <SplitModePanel
              inputMode={inputMode}
              blankMode={blankMode}
              onBlankModeChange={setBlankMode}
              contentLines={singleContentLines}
              manualGroups={manualGroups}
              onManualGroupsChange={setManualGroups}
              onSmartGenerate={handleSmartGenerate}
              isGenerating={isGenerating}
            />
          )}

          {/* 操作按钮组 */}
          <div className="action-buttons" role="group" aria-label="操作按钮">
            {adjustedGroups.length > 0 && (
              <>
                <button
                  onClick={handleCopyText}
                  className="stitch-button stitch-button--secondary"
                  data-testid="copy-text-button"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制文本
                </button>
                <button
                  onClick={handleExportDocx}
                  className="stitch-button stitch-button--success"
                  data-testid="export-docx-button"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <polyline points="9 15 12 18 15 15"/>
                  </svg>
                  导出 Word
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="stitch-button stitch-button--pdf"
                  data-testid="export-pdf-button"
                >
                  {isExportingPdf ? (
                    <>
                      <span className="btn-spinner" />
                      导出中...
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <path d="M9 13h1a2 2 0 0 1 0 4H9v-4z"/>
                        <path d="M14 13h2"/>
                        <path d="M14 17h2"/>
                      </svg>
                      导出 PDF
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="stitch-button stitch-button--print"
                  data-testid="print-button"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  打印
                </button>
              </>
            )}
          </div>
        </div>

        {/* 右侧：预览区 */}
        <div className="preview-section">
          <h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:'inline',marginRight:'8px',verticalAlign:'middle'}}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            预览效果
          </h2>
          <div ref={previewRef} className="preview-print-area">
            <QuestionPreview
              questionGroups={adjustedGroups}
              inputMode={inputMode}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 诗词填空生成器 · 传承千年文韵，体验诗词之美</p>
      </footer>

      {/* Toast 提示 */}
      {toastMessage && (
        <div
          className={`toast-message toast-${toastType}`}
          data-testid="toast-message"
          role="alert"
          aria-live="polite"
        >
          {toastType === 'success' && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {toastType === 'error' && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
