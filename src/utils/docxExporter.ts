import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import type { FillBlankQuestion } from '../types';

// 创建Docx文档
export async function exportToDocx(
  questions: FillBlankQuestion[],
  title: string = '诗词填空题'
): Promise<void> {
  const paragraphs = [];

  // 添加标题
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 28,
          font: 'SimSun'
        })
      ],
      spacing: { after: 400 },
      alignment: 'center'
    })
  );

  // 添加说明
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '请在横线上填写正确的字词：',
          size: 24,
          font: 'SimSun'
        })
      ],
      spacing: { after: 300 }
    })
  );

  // 添加题目
  questions.forEach((question, index) => {
    const questionNumber = index + 1;
    const authorInfo = question.author && question.title ? `（${question.author}《${question.title}》）` : '';

    // 处理填空文本，将下划线转换为更长的下划线
    const questionText = question.questionText.replace(/____/g, '________');

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `（${questionNumber}）${questionText}${authorInfo}`,
            size: 24,
            font: 'SimSun'
          })
        ],
        spacing: { after: 200 },
        indent: { left: 720 } // 首行缩进
      })
    );
  });

  // 创建文档
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });

  // 导出文件
  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer as any], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  const fileName = `${title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.docx`;
  saveAs(blob, fileName);
}