export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface FillBlankQuestion {
  id: number;
  originalText: string;
  questionText: string;
  author: string;
  title: string;
}

export interface PoetryInput {
  content: string;
  author: string;
  title: string;
}