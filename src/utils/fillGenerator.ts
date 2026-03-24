import type { DifficultyLevel, FillBlankQuestion, PoetryInput } from '../types';

// 生成下划线填空
function generateBlanks(text: string, difficulty: DifficultyLevel): string {
  const chars = text.split('');
  let blankCount = 0;

  switch (difficulty) {
    case 'easy':
      blankCount = Math.max(1, Math.floor(text.length * 0.15)); // 15% 字符填空
      break;
    case 'medium':
      blankCount = Math.max(2, Math.floor(text.length * 0.25)); // 25% 字符填空
      break;
    case 'hard':
      blankCount = Math.max(3, Math.floor(text.length * 0.35)); // 35% 字符填空
      break;
  }

  // 重要词汇保护（标点符号、虚词等）
  const protectedIndices = new Set<number>();
  const punctuation = ['，', '。', '！', '？', '；', '：', '、', '"', "'", '(', ')', '《', '》'];
  const functionWords = ['之', '乎', '者', '也', '而', '以', '于', '为', '所', '与', '及', '或', '且'];

  chars.forEach((char, index) => {
    if (punctuation.includes(char) || functionWords.includes(char)) {
      protectedIndices.add(index);
    }
  });

  // 随机选择填空位置
  const availableIndices = chars
    .map((_, index) => index)
    .filter(index => !protectedIndices.has(index));

  const selectedIndices = new Set<number>();
  while (selectedIndices.size < blankCount && selectedIndices.size < availableIndices.length) {
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    selectedIndices.add(availableIndices[randomIndex]);
  }

  // 生成填空文本
  let result = '';
  chars.forEach((char, index) => {
    if (selectedIndices.has(index)) {
      result += '____';
    } else {
      result += char;
    }
  });

  return result;
}

// 解析诗词文本
function parsePoetryText(poetryText: string): string[] {
  // 按行分割，过滤空行
  return poetryText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

// 生成填空题
export function generateFillBlankQuestions(
  poetryInput: PoetryInput,
  difficulty: DifficultyLevel
): FillBlankQuestion[] {
  const lines = parsePoetryText(poetryInput.content);
  const questions: FillBlankQuestion[] = [];

  lines.forEach((line, index) => {
    if (line.trim()) {
      const questionText = generateBlanks(line, difficulty);
      questions.push({
        id: index + 1,
        originalText: line,
        questionText,
        author: poetryInput.author,
        title: poetryInput.title
      });
    }
  });

  return questions;
}

// 格式化导出文本
export function formatQuestionsForExport(questions: FillBlankQuestion[]): string {
  return questions
    .map((q, index) => {
      const questionNumber = index + 1;
      const authorInfo = q.author && q.title ? `（${q.author}《${q.title}》）` : '';
      return `（${questionNumber}）${q.questionText}${authorInfo}`;
    })
    .join('\n\n');
}