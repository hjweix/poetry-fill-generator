import React from 'react';
import type { FillBlankQuestion } from '../types';

interface QuestionPreviewProps {
  questions: FillBlankQuestion[];
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ questions }) => {
  if (questions.length === 0) {
    return (
      <div className="question-preview empty">
        <p>请输入诗词内容并选择难度，点击生成按钮查看预览</p>
      </div>
    );
  }

  return (
    <div className="question-preview">
      <h3>填空题预览</h3>
      <div className="questions-container">
        {questions.map((question, index) => {
          const questionNumber = index + 1;
          const authorInfo = question.author && question.title ? `（${question.author}《${question.title}》）` : '';

          return (
            <div key={question.id} className="question-item">
              <div className="question-text">
                （{questionNumber}）{question.questionText}{authorInfo}
              </div>
              <div className="original-text">
                原文：{question.originalText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionPreview;