export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'sentence';

/**
 * 全局难度模式
 * - few: 简单（每句1-2个字）
 * - some: 中等（每句3-4个字）
 * - whole: 困难（挖空整句）
 */
export type BlankMode = 'few' | 'some' | 'whole';

export type GroupSize = 'whole' | 2 | 4 | 6;

export interface FillBlankQuestion {
  id: number;
  originalText: string;
  questionText: string;
  author: string;
  title: string;
  blankPositions?: number[];
  suggestions?: string[];
  // 用于批量模式标识所属诗词
  poetryId?: string;
}

export interface QuestionGroup {
  id: number;           // 大题编号（1-based，展示时转汉字）
  title: string;
  author: string;
  poetryId?: string;
  lines: FillBlankQuestion[];  // 大题内的各行
}

export interface PoetryInput {
  content: string;
  author: string;
  title: string;
}

export interface InteractiveBlank {
  position: number;
  originalChar: string;
  isSelected: boolean;
  importance: number;
}

export interface LineInteractiveData {
  lineIndex: number;
  lineText: string;
  blanks: InteractiveBlank[];
}

// 批量模式下每首诗词条目
export interface BatchPoetryItem {
  id: string;
  poetry: PoetryInput;
  isExpanded: boolean;
  groupSize?: GroupSize;  // 分题粒度，undefined 时默认 'whole'
}

// ─── 手动拆分 ───────────────────────────────────────────────────────────────

/**
 * 手动拆分模式下，用户手动划定的一道大题。
 * - lineIndices：该题包含哪些行（相对于过滤后的诗词正文行数组，0-based）
 * - interactiveLines：每行的可交互填空数据（用户在题目卡片中逐字选词）
 */
export interface ManualGroup {
  /** 题目编号（1-based，UI 显示时转汉字） */
  id: number;
  /** 该题包含的行索引（对应过滤后的正文行数组） */
  lineIndices: number[];
  /** 每行文本原文 */
  lineTexts: string[];
  /** 每行的可交互填空状态，由 generateInteractiveBlanks 初始化，用户可修改 isSelected */
  interactiveLines: LineInteractiveData[];
}
