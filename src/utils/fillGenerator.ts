import type { DifficultyLevel, FillBlankQuestion, PoetryInput, LineInteractiveData, InteractiveBlank, BatchPoetryItem, QuestionGroup, GroupSize, ManualGroup, BlankMode } from '../types';

/**
 * 将 BlankMode 映射为 DifficultyLevel
 * - 'few' → 'easy' (1-2个词)
 * - 'some' → 'hard' (3-4个词)
 * - 'whole' → 'sentence' (整句)
 */
export function blankModeToDifficulty(mode: BlankMode): DifficultyLevel {
  switch (mode) {
    case 'few': return 'easy';
    case 'some': return 'hard';
    case 'whole': return 'sentence';
  }
}

// 智能分析词汇重要性
function analyzeWordImportance(text: string): Map<number, number> {
  const importance = new Map<number, number>();
  const chars = text.split('');

  // 关键词库 - 按重要性分级
  const highImportanceWords = [
    // 动词
    '看', '见', '听', '闻', '思', '念', '忆', '怀', '望', '观', '赏', '品',
    '登', '临', '游', '行', '走', '飞', '落', '升', '降', '来', '去',
    // 形容词
    '美', '好', '佳', '妙', '绝', '奇', '异', '新', '旧', '古', '今',
    '清', '明', '亮', '暗', '高', '低', '大', '小', '长', '短',
    // 名词（具象）
    '山', '水', '江', '河', '湖', '海', '云', '雨', '雪', '风', '花', '月', '日', '星'
  ];

  const mediumImportanceWords = [
    // 常见实词
    '心', '情', '意', '思', '梦', '魂', '身', '影', '声', '色', '香', '味',
    '春', '夏', '秋', '冬', '东', '南', '西', '北', '天', '地', '人'
  ];

  chars.forEach((char, index) => {
    if (highImportanceWords.includes(char)) {
      importance.set(index, 3); // 高重要性
    } else if (mediumImportanceWords.includes(char)) {
      importance.set(index, 2); // 中等重要性
    } else {
      importance.set(index, 1); // 低重要性
    }
  });

  return importance;
}

/**
 * 整句填空：把文本按「，」拆分成多个小段，随机挖掉其中一段（整段替换为____）。
 * 若无逗号则退化为挖掉后半段。
 * 返回与 generateSmartBlanks 相同的结构，便于复用。
 */
function generateSentenceBlanks(text: string): {
  text: string;
  blankPositions: number[];
  suggestions: string[];
} {
  // 按逗号（全角）分割，保留分隔符位置
  // 例："春风杨柳万千条，六亿神州尽舜尧。" → ["春风杨柳万千条", "，", "六亿神州尽舜尧。"]
  const segRe = /(，)/g;
  const segments: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = segRe.exec(text)) !== null) {
    segments.push(text.slice(last, m.index)); // 内容段
    segments.push(m[1]);                       // 逗号
    last = m.index + m[1].length;
  }
  segments.push(text.slice(last)); // 最后一段

  // 只取内容段（非逗号段），过滤空串
  const contentSegIndices: number[] = [];
  segments.forEach((seg, i) => {
    if (seg !== '，' && seg.trim().length > 0) contentSegIndices.push(i);
  });

  if (contentSegIndices.length === 0) {
    // 无法分段，退化为挖掉整行（除标点外）
    return generateSmartBlanks(text, 'hard');
  }

  // 随机选一段内容挖空（倾向于选第一段，更符合对仗填空习惯）
  // 使用加权随机：第一段权重 60%，其余均分剩余 40%
  let chosenSegIdx: number;
  if (contentSegIndices.length === 1) {
    chosenSegIdx = contentSegIndices[0];
  } else {
    const rand = Math.random();
    chosenSegIdx = rand < 0.6 ? contentSegIndices[0] : contentSegIndices[Math.floor(rand * contentSegIndices.length)];
  }

  const blankPositions: number[] = [];
  const suggestions: string[] = [];

  // 计算挖空段在原始文本中的字符偏移量
  let offset = 0;
  const resultParts: string[] = [];
  segments.forEach((seg, i) => {
    if (i === chosenSegIdx) {
      // 记录该段每个字符位置（排除其自身末尾标点）
      seg.split('').forEach((ch, ci) => {
        const punctuation = ['。', '！', '？', '；', '…'];
        if (!punctuation.includes(ch)) {
          blankPositions.push(offset + ci);
          suggestions.push(ch);
        }
      });
      // 保留该段末尾的句末标点（如果有）
      const trailingPunct = seg.match(/[。！？；…]+$/)?.[0] ?? '';
      resultParts.push('____' + trailingPunct);
    } else {
      resultParts.push(seg);
    }
    offset += seg.length;
  });

  return {
    text: resultParts.join(''),
    blankPositions,
    suggestions,
  };
}

// 生成智能推荐的填空位置
function generateSmartBlanks(text: string, difficulty: DifficultyLevel): {
  text: string;
  blankPositions: number[];
  suggestions: string[];
} {
  // 整句填空模式：单独处理
  if (difficulty === 'sentence') {
    return generateSentenceBlanks(text);
  }

  const chars = text.split('');
  let blankCount = 0;

  switch (difficulty) {
    case 'easy':
      blankCount = Math.max(1, Math.floor(text.length * 0.15));
      break;
    case 'medium':
      blankCount = Math.max(2, Math.floor(text.length * 0.25));
      break;
    case 'hard':
      blankCount = Math.max(3, Math.floor(text.length * 0.35));
      break;
  }

  // 保护性字符
  const protectedIndices = new Set<number>();
  const punctuation = ['，', '。', '！', '？', '；', '：', '、', '"', "'", '(', ')', '《', '》'];
  const functionWords = ['之', '乎', '者', '也', '而', '以', '于', '为', '所', '与', '及', '或', '且'];

  chars.forEach((char, index) => {
    if (punctuation.includes(char) || functionWords.includes(char)) {
      protectedIndices.add(index);
    }
  });

  // 分析词汇重要性
  const importance = analyzeWordImportance(text);

  // 智能选择填空位置（优先选择重要词汇）
  const availableIndices = chars
    .map((_, index) => index)
    .filter(index => !protectedIndices.has(index));

  // 按重要性排序
  const sortedIndices = availableIndices.sort((a, b) => {
    const importanceA = importance.get(a) || 1;
    const importanceB = importance.get(b) || 1;
    return importanceB - importanceA; // 重要性高的排在前面
  });

  const selectedIndices = new Set<number>();
  const suggestions: string[] = [];

  // 选择最重要的字符作为填空
  for (let i = 0; i < Math.min(blankCount, sortedIndices.length); i++) {
    const index = sortedIndices[i];
    selectedIndices.add(index);
    suggestions.push(chars[index]);
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

  return {
    text: result,
    blankPositions: Array.from(selectedIndices),
    suggestions
  };
}


// 解析诗词文本
function parsePoetryText(poetryText: string): string[] {
  // 按行分割，过滤空行
  return poetryText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * 按句末标点（。！？…）将一行文本拆分为多个子句。
 * 保留句末标点附着在对应子句末尾。
 * 省略号（……）视为一个分隔符。
 * 若该行无任何句末标点，则原样返回。
 */
export function splitLinesBySentence(lines: string[]): string[] {
  // 句末标点正则：匹配 。！？ 以及 ……（两个省略号）
  const sentenceEndRe = /([^。！？…]*(?:……|[。！？])[^。！？…]*)/g;

  const result: string[] = [];
  for (const line of lines) {
    // 先判断行内是否包含句末标点
    if (!/[。！？…]/.test(line)) {
      result.push(line);
      continue;
    }

    // 用分隔符切割，保留分隔符
    // 策略：在每个句末标点（含……）后切一刀
    const parts: string[] = [];
    // 匹配：非标点序列 + 句末标点(组)
    const re = /((?:……|[。！？])+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(line)) !== null) {
      const segment = line.slice(lastIndex, match.index + match[0].length).trim();
      if (segment) parts.push(segment);
      lastIndex = match.index + match[0].length;
    }

    // 剩余（没有句末标点的尾部，如引号后的内容）
    const tail = line.slice(lastIndex).trim();
    if (tail) parts.push(tail);

    if (parts.length > 0) {
      result.push(...parts);
    } else {
      result.push(line);
    }
  }
  return result;
}

// 智能识别标题和作者
export function autoDetectTitleAndAuthor(content: string): { title: string; author: string } {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let title = '';
  let author = '';

  // 常见诗词标题模式
  const titlePatterns = [
    /^([《〈]([^》〉]+)[》〉])/,  // 《标题》或〈标题〉
    /^([\u4e00-\u9fa5]{2,8}[··](?:词|诗|赋|歌|吟|颂|曲))$/, // 标题·体裁
    /^([\u4e00-\u9fa5]{2,10}(?:词|诗|赋|歌|吟|颂|曲))$/, // 标题+体裁
    /^([\u4e00-\u9fa5]{2,12})$/, // 简单标题
  ];

  // 常见作者模式
  const authorPatterns = [
    /[（\(]\s*([\u4e00-\u9fa5]{2,5}(?:[··][\u4e00-\u9fa5]{1,4})?)\s*[）\)]$/, // （作者）或(作者)
    /\s+([\u4e00-\u9fa5]{2,5}(?:[··][\u4e00-\u9fa5]{1,4})?)\s*$/, // 行末作者名
    /\s+([\u4e00-\u9fa5]{2,5})$/, // 简单作者名
  ];

  // 遍历每一行寻找标题和作者
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];

    // 如果还没有找到标题，尝试匹配标题模式
    if (!title) {
      for (const pattern of titlePatterns) {
        const match = line.match(pattern);
        if (match) {
          title = match[1].replace(/[《》〈〉]/g, '').trim();
          break;
        }
      }
    }

    // 尝试匹配作者模式
    if (!author) {
      for (const pattern of authorPatterns) {
        const match = line.match(pattern);
        if (match) {
          const potentialAuthor = match[1].trim();
          // 过滤掉可能是标题的内容
          if (!potentialAuthor.includes('·') && !potentialAuthor.includes('·') &&
              potentialAuthor.length >= 2 && potentialAuthor.length <= 5) {
            author = potentialAuthor;
            break;
          }
        }
      }
    }

    // 如果标题包含作者信息，分离它们
    if (title && title.includes('·')) {
      const parts = title.split('·');
      if (parts.length === 2) {
        const possibleTitle = parts[0].trim();
        const possibleAuthor = parts[1].trim();

        // 如果后半部分像是作者名
        if (possibleAuthor.length >= 2 && possibleAuthor.length <= 5 &&
            !possibleAuthor.includes('词') && !possibleAuthor.includes('诗')) {
          title = possibleTitle;
          author = possibleAuthor;
        }
      }
    }
  }

  return { title, author };
}

// 生成填空题
export function generateFillBlankQuestions(
  poetryInput: PoetryInput,
  difficulty: DifficultyLevel,
  splitBySentence = false
): FillBlankQuestion[] {
  const allLines = parsePoetryText(poetryInput.content);

  // 过滤掉被识别为标题/作者的行
  const detected = autoDetectTitleAndAuthor(poetryInput.content);
  const filtered = allLines.filter(line => {
    const clean = line.replace(/[《》〈〉（）()]/g, '').trim();
    if (detected.title && clean === detected.title) return false;
    if (detected.author && clean === detected.author) return false;
    if (detected.title && detected.author && line.includes(detected.title) && line.includes(detected.author)) return false;
    if (detected.title && line.replace(/[《》〈〉]/g, '').trim() === detected.title) return false;
    return true;
  });

  // 按句末标点分句（可选）
  const lines = splitBySentence ? splitLinesBySentence(filtered) : filtered;

  const questions: FillBlankQuestion[] = [];

  lines.forEach((line, index) => {
    if (line.trim()) {
      const smartResult = generateSmartBlanks(line, difficulty);
      questions.push({
        id: index + 1,
        originalText: line,
        questionText: smartResult.text,
        author: poetryInput.author,
        title: poetryInput.title,
        blankPositions: smartResult.blankPositions,
        suggestions: smartResult.suggestions
      });
    }
  });

  return questions;
}

// 生成可交互的填空数据
export function generateInteractiveBlanks(lineText: string, lineIndex: number): LineInteractiveData {
  const chars = lineText.split('');
  const importance = analyzeWordImportance(lineText);

  // 保护性字符（仅保留标点符号）
  const protectedChars = ['，', '。', '！', '？', '；', '：', '、', '"', "'", '(', ')', '《', '》'];

  const blanks: InteractiveBlank[] = chars.map((char, index) => ({
    position: index,
    originalChar: char,
    isSelected: false,
    importance: protectedChars.includes(char) ? 0 : (importance.get(index) || 1)
  }));

  return {
    lineIndex,
    lineText,
    blanks
  };
}

// 应用手动选择的填空
export function applyManualBlanks(lines: LineInteractiveData[]): FillBlankQuestion[] {
  const questions: FillBlankQuestion[] = [];

  lines.forEach((lineData, index) => {
    const chars = lineData.lineText.split('');
    let questionText = '';
    const suggestions: string[] = [];

    chars.forEach((char: string, charIndex: number) => {
      const blank = lineData.blanks.find((b: InteractiveBlank) => b.position === charIndex);
      if (blank && blank.isSelected) {
        questionText += '____';
        suggestions.push(char);
      } else {
        questionText += char;
      }
    });

    questions.push({
      id: index + 1,
      originalText: lineData.lineText,
      questionText,
      author: '',
      title: '',
      suggestions
    });
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

// 批量解析多首诗词
// 支持用连续空行（或分隔线）分割多首诗词，每首自动识别标题/作者
export function parseBatchPoetry(text: string): BatchPoetryItem[] {
  if (!text.trim()) return [];

  // 按两个以上连续换行分割
  const segments = text
    .split(/\n{2,}/)
    .map(seg => seg.trim())
    .filter(seg => seg.length > 0);

  // 如果只有一段，尝试按"诗词标题行"智能拆分
  // 匹配模式：《xxx》或第一行为短标题（<=12字且下一行有内容）
  const items: BatchPoetryItem[] = [];

  segments.forEach((segment, index) => {
    const detected = autoDetectTitleAndAuthor(segment);
    const lines = segment.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 去除识别出的标题/作者行，保留正文
    let contentLines = lines;
    if (detected.title) {
      contentLines = lines.filter(line => {
        const cleanLine = line.replace(/[《》〈〉（）()]/g, '').trim();
        return cleanLine !== detected.title && cleanLine !== detected.author;
      });
    }

    const content = contentLines.join('\n');

    items.push({
      id: `batch-${Date.now()}-${index}`,
      poetry: {
        title: detected.title || '',
        author: detected.author || '',
        content: content || segment,
      },
      isExpanded: true,
    });
  });

  return items;
}

// 批量生成填空题（多首诗词）
export function generateBatchFillBlankQuestions(
  batchItems: BatchPoetryItem[],
  difficulty: DifficultyLevel,
  splitBySentence = false
): FillBlankQuestion[] {
  const allQuestions: FillBlankQuestion[] = [];
  let globalId = 1;

  batchItems.forEach(item => {
    const rawLines = parsePoetryText(item.poetry.content);
    const lines = splitBySentence ? splitLinesBySentence(rawLines) : rawLines;
    lines.forEach(line => {
      if (line.trim()) {
        const smartResult = generateSmartBlanks(line, difficulty);
        allQuestions.push({
          id: globalId++,
          originalText: line,
          questionText: smartResult.text,
          author: item.poetry.author,
          title: item.poetry.title,
          blankPositions: smartResult.blankPositions,
          suggestions: smartResult.suggestions,
          poetryId: item.id,
        });
      }
    });
  });

  return allQuestions;
}

/**
 * 将平铺的 FillBlankQuestion[] 按分题粒度聚合为 QuestionGroup[]。
 *
 * @param questions  由 generateFillBlankQuestions / generateBatchFillBlankQuestions 生成的平铺列表
 * @param groupSizeMap  key 为 poetryId 或 `${title}-${author}`，value 为分题粒度
 *   - 'whole'：整首诗词的所有行 = 一道大题
 *   - 2 / 4 / 6：按每 N 行切一道大题
 *
 * 调用方需保证 useMemo 在 questions / groupSizeMap 变化时重新调用本函数。
 */
export function groupQuestions(
  questions: FillBlankQuestion[],
  groupSizeMap: Map<string, GroupSize>
): QuestionGroup[] {
  if (questions.length === 0) return [];

  // Step 1：按 poetryId / title-author 聚合成「诗词桶」
  const bucketKeys: string[] = [];
  const buckets = new Map<string, { title: string; author: string; poetryId?: string; lines: FillBlankQuestion[] }>();

  questions.forEach(q => {
    const key = q.poetryId || `${q.title || ''}-${q.author || ''}`;
    if (!buckets.has(key)) {
      bucketKeys.push(key);
      buckets.set(key, { title: q.title || '', author: q.author || '', poetryId: q.poetryId, lines: [] });
    }
    buckets.get(key)!.lines.push(q);
  });

  // Step 2：按每个桶的 groupSize 切分为若干 group
  const result: QuestionGroup[] = [];
  let groupId = 1;

  bucketKeys.forEach(key => {
    const bucket = buckets.get(key)!;
    const size = groupSizeMap.get(key) ?? 'whole';

    if (size === 'whole') {
      // 整首一题
      result.push({
        id: groupId++,
        title: bucket.title,
        author: bucket.author,
        poetryId: bucket.poetryId,
        lines: bucket.lines,
      });
    } else {
      // 每 N 行切一题
      const n = size as number;
      for (let i = 0; i < bucket.lines.length; i += n) {
        result.push({
          id: groupId++,
          title: bucket.title,
          author: bucket.author,
          poetryId: bucket.poetryId,
          lines: bucket.lines.slice(i, i + n),
        });
      }
    }
  });

  return result;
}

/**
 * 带元信息版本的手动填空应用函数。
 * 将一组 LineInteractiveData 转换为 FillBlankQuestion[]，同时写入 title / author。
 *
 * @param lines          可交互行数据（用户已完成选词）
 * @param title          诗词标题
 * @param author         诗词作者
 * @param startId        起始 id（避免多题时 id 重复）
 */
export function applyManualBlanksWithMeta(
  lines: LineInteractiveData[],
  title: string,
  author: string,
  startId = 1
): FillBlankQuestion[] {
  return lines.map((lineData, idx) => {
    const chars = lineData.lineText.split('');
    let questionText = '';
    const suggestions: string[] = [];

    chars.forEach((char: string, charIndex: number) => {
      const blank = lineData.blanks.find((b: InteractiveBlank) => b.position === charIndex);
      if (blank && blank.isSelected) {
        questionText += '____';
        suggestions.push(char);
      } else {
        questionText += char;
      }
    });

    return {
      id: startId + idx,
      originalText: lineData.lineText,
      questionText,
      author,
      title,
      suggestions,
    };
  });
}

/**
 * 将手动拆分结果 ManualGroup[] 直接转换为 QuestionGroup[]，供 QuestionPreview 使用。
 *
 * @param manualGroups  用户手动划定并完成选词的题目列表
 * @param title         诗词标题
 * @param author        诗词作者
 */
export function convertManualGroupsToQuestionGroups(
  manualGroups: ManualGroup[],
  title: string,
  author: string
): QuestionGroup[] {
  return manualGroups.map(mg => {
    let lineId = 1;
    const lines = applyManualBlanksWithMeta(mg.interactiveLines, title, author, lineId);
    lineId += lines.length;

    return {
      id: mg.id,
      title,
      author,
      lines,
    };
  });
}

/**
 * 将 QuestionGroup[] 格式化为纯文本（用于「复制文本」功能）。
 * 汉字题号：1→一，2→二 … 10→十，超出范围用阿拉伯数字。
 */
export function formatGroupsForExport(groups: QuestionGroup[]): string {
  return groups.map(group => {
    const numStr = String(group.id);
    const source =
      group.author && group.title ? `（${group.author}《${group.title}》）` :
      group.author ? `（${group.author}）` :
      group.title ? `（《${group.title}》）` : '';

    const linesText = group.lines.map(line => line.questionText).join('\n');
    return `（${numStr}）${linesText}${source ? '\n' + source : ''}`;
  }).join('\n\n');
}