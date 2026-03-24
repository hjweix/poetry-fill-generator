import { useState } from 'react';
import './App.css';
import PoetryInput from './components/PoetryInput';
import DifficultySelector from './components/DifficultySelector';
import QuestionPreview from './components/QuestionPreview';
import { generateFillBlankQuestions, formatQuestionsForExport } from './utils/fillGenerator';
import { exportToDocx } from './utils/docxExporter';
import type { PoetryInput as PoetryInputType, DifficultyLevel, FillBlankQuestion } from './types';

function App() {
  const [poetryInput, setPoetryInput] = useState<PoetryInputType>({
    content: '',
    author: '',
    title: ''
  });
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questions, setQuestions] = useState<FillBlankQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!poetryInput.content.trim()) {
      alert('请输入诗词内容');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedQuestions = generateFillBlankQuestions(poetryInput, difficulty);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('生成填空题失败:', error);
      alert('生成失败，请检查输入内容');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (questions.length === 0) {
      alert('请先生成填空题');
      return;
    }

    try {
      const title = poetryInput.title || '诗词填空题';
      await exportToDocx(questions, title);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleCopyText = () => {
    if (questions.length === 0) {
      alert('请先生成填空题');
      return;
    }

    const textContent = formatQuestionsForExport(questions);
    navigator.clipboard.writeText(textContent).then(() => {
      alert('已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>诗词填空生成器</h1>
        <p>输入诗词内容，选择难度，自动生成填空题并导出为Word文档</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <PoetryInput value={poetryInput} onChange={setPoetryInput} />

          <DifficultySelector value={difficulty} onChange={setDifficulty} />

          <div className="action-buttons">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !poetryInput.content.trim()}
              className="btn btn-primary"
            >
              {isGenerating ? '生成中...' : '生成填空题'}
            </button>

            {questions.length > 0 && (
              <>
                <button onClick={handleCopyText} className="btn btn-secondary">
                  复制文本
                </button>
                <button onClick={handleExport} className="btn btn-success">
                  导出Docx
                </button>
              </>
            )}
          </div>
        </div>

        <div className="preview-section">
          <QuestionPreview questions={questions} />
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 诗词填空生成器 - 让古诗词学习更有趣</p>
      </footer>
    </div>
  );
}

export default App
