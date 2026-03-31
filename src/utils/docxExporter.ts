import { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } from 'docx';
import { saveAs } from 'file-saver';
import type { FillBlankQuestion, QuestionGroup } from '../types';

// 将填空符号替换为带下划线的格式（Word 中用下划线全角空格表示）
function makeBlankSpaces(text: string): Array<{ text: string; isBlank: boolean }> {
  const parts: Array<{ text: string; isBlank: boolean }> = [];
  const regex = /_{4,}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isBlank: false });
    }
    // 每个填空用 6 个全角空格（带下划线）表示，宽度约 6 个汉字
    parts.push({ text: '\u3000\u3000\u3000\u3000\u3000\u3000', isBlank: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isBlank: false });
  }

  return parts;
}

// 数字转全角（1→１，2→２…）
function toFullWidthNum(n: number): string {
  return String(n).split('').map(c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0)).join('');
}

// 将一行题目文字转为 TextRun 数组
function buildQuestionRuns(num: number, questionText: string, sourceInfo: string): TextRun[] {
  const runs: TextRun[] = [];

  // 题号：（１）全角括号+全角数字
  runs.push(
    new TextRun({
      text: `（${toFullWidthNum(num)}）`,
      size: 24, // 12pt
      font: { name: 'SimSun' },
    })
  );

  // 题目主体（含填空符号）
  const parts = makeBlankSpaces(questionText);
  for (const part of parts) {
    if (part.isBlank) {
      runs.push(
        new TextRun({
          text: part.text,
          size: 24,
          font: { name: 'SimSun' },
          underline: { type: UnderlineType.SINGLE },
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part.text,
          size: 24,
          font: { name: 'SimSun' },
        })
      );
    }
  }

  // 出处：（作者《标题》）小字灰色
  if (sourceInfo) {
    runs.push(
      new TextRun({
        text: sourceInfo,
        size: 21, // 10.5pt
        font: { name: 'SimSun' },
        color: '555555',
      })
    );
  }

  return runs;
}

// 创建 Docx 文档
export async function exportToDocx(
  groups: QuestionGroup[],
  title: string = '诗词填空题',
  inputMode: 'single' | 'batch' = 'single'
): Promise<void> {
  const paragraphs: Paragraph[] = [];

  // ── 大标题 ──
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32, // 16pt
          font: { name: 'SimHei' },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // ── 说明行 ──
  const totalLines = groups.reduce((s, g) => s + g.lines.length, 0);
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `请在横线上填写正确的字词。（共 ${groups.length} 题，${totalLines} 句）`,
          size: 22,
          font: { name: 'SimSun' },
          italics: true,
          color: '444444',
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 },
    })
  );

  // ── 题目内容（与预览区保持一致的分组结构） ──
  const showGroupPoetryLabel = inputMode === 'batch' && groups.length > 1;

  groups.forEach((group, groupIndex) => {
    // 出处信息（大题末尾显示一次，与预览一致）
    const sourceInfo =
      group.author && group.title
        ? `（${group.author}《${group.title}》）`
        : group.author
        ? `（${group.author}）`
        : group.title
        ? `（《${group.title}》）`
        : '';

    // 跨诗词时显示诗词标签（与预览区的 exam-group-title 一致）
    if (showGroupPoetryLabel) {
      const isFirst = groupIndex === 0;
      const prev = !isFirst ? groups[groupIndex - 1] : null;
      const prevKey = prev ? (prev.poetryId || `${prev.title}-${prev.author}`) : '';
      const curKey = group.poetryId || `${group.title}-${group.author}`;

      if (isFirst || prevKey !== curKey) {
        const groupLabel = [
          group.title ? `《${group.title}》` : '',
          group.author ? `\u3000${group.author}` : '',
        ].filter(Boolean).join('');

        if (groupLabel) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: groupLabel,
                  bold: true,
                  size: 24,
                  font: { name: 'SimSun' },
                  color: '333333',
                }),
              ],
              spacing: { before: 200, after: 120 },
              border: {
                bottom: { style: 'single', size: 4, color: '999999', space: 4 },
              },
            })
          );
        }
      }
    }

    // 构建大题内容：题号 + 多行正文（用全角空格间隔，与预览的 exam-line-sep 一致）
    const runs: TextRun[] = [];

    // 题号
    runs.push(
      new TextRun({
        text: `（${toFullWidthNum(group.id)}）`,
        size: 24,
        font: { name: 'SimSun' },
      })
    );

    // 多行正文，行间用全角空格间隔（与预览的 <span class="exam-line-sep">　</span> 一致）
    group.lines.forEach((line: FillBlankQuestion, lineIdx: number) => {
      // 填空处理
      const parts = makeBlankSpaces(line.questionText);
      for (const part of parts) {
        if (part.isBlank) {
          runs.push(
            new TextRun({
              text: part.text,
              size: 24,
              font: { name: 'SimSun' },
              underline: { type: UnderlineType.SINGLE },
            })
          );
        } else {
          runs.push(
            new TextRun({
              text: part.text,
              size: 24,
              font: { name: 'SimSun' },
            })
          );
        }
      }

      // 非最后一行加全角空格间隔
      if (lineIdx < group.lines.length - 1) {
        runs.push(
          new TextRun({
            text: '\u3000',
            size: 24,
            font: { name: 'SimSun' },
          })
        );
      }
    });

    // 出处（大题末尾显示一次，与预览一致）
    if (sourceInfo) {
      runs.push(
        new TextRun({
          text: sourceInfo,
          size: 21,
          font: { name: 'SimSun' },
          color: '555555',
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        children: runs,
        spacing: { after: 280, line: 480, lineRule: 'auto' },
        indent: { left: 0 },
      })
    );
  });

  // ── 末尾空行 ──
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 0 },
    })
  );

  // ── 构建文档 ──
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: 24,
            font: { name: 'SimSun' },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,   // 2cm
              bottom: 1134,
              left: 1701,  // 3cm
              right: 1134, // 2cm
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  // ── 导出文件（用 toBlob 兼容浏览器环境）──
  try {
    const blob = await Packer.toBlob(doc);
    const dateStr = new Date()
      .toLocaleDateString('zh-CN')
      .replace(/\//g, '');
    saveAs(blob, `${title}_${dateStr}.docx`);
  } catch {
    // 兜底：toBuffer → ArrayBuffer → Blob
    const buffer = await Packer.toBuffer(doc);
    const ab: ArrayBuffer = buffer instanceof ArrayBuffer
      ? buffer
      : (buffer as unknown as { buffer: ArrayBuffer }).buffer;
    const blob = new Blob([ab], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const dateStr = new Date()
      .toLocaleDateString('zh-CN')
      .replace(/\//g, '');
    saveAs(blob, `${title}_${dateStr}.docx`);
  }
}
