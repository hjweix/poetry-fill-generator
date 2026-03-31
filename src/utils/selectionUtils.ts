/**
 * selectionUtils — 文本选区解析工具
 *
 * 用于 TextSelectionEditor：将浏览器原生 Selection/Range 解析为
 * "第几行、第几个字符" 的坐标，方便映射到 contentLines 数据结构。
 */

/** 解析后的选区信息 */
export interface ParsedSelection {
  /** 起始行索引 (0-based, 对应 contentLines) */
  startLine: number;
  /** 起始字符索引 (0-based, 该行内) */
  startChar: number;
  /** 结束行索引 */
  endLine: number;
  /** 结束字符索引 */
  endChar: number;
  /** 选中的纯文本 */
  text: string;
}

/**
 * 判断一个节点是否在指定容器内（含容器本身）
 */
function isNodeInContainer(node: Node | null, container: HTMLElement): boolean {
  if (!node) return false;
  let current: Node | null = node;
  while (current) {
    if (current === container) return true;
    current = current.parentNode;
  }
  return false;
}

/**
 * 从一个 DOM 节点向上查找到带 data-line-index 属性的行元素，
 * 返回行索引和该行文本容器。
 */
function findLineInfo(
  node: Node,
  container: HTMLElement
): { lineIndex: number; textNode: Text | null } | null {
  let current: Node | null = node;
  while (current && current !== container) {
    if (current instanceof HTMLElement) {
      const idx = current.getAttribute('data-line-index');
      if (idx !== null) {
        // 找到行容器了，现在找里面的文本节点
        const textNode = findTextNodeInElement(current);
        return { lineIndex: parseInt(idx, 10), textNode };
      }
    }
    current = current.parentNode;
  }
  return null;
}

/**
 * 在元素内找到第一个文本节点
 */
function findTextNodeInElement(el: Element): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

/**
 * 给定一个 Range，计算它相对于指定容器内各行的起止坐标。
 *
 * 假设容器内每行是一个 `div[data-line-index="N"]`，
 * 行内文本就是一个纯文本节点。
 *
 * @returns ParsedSelection | null（选区无效或不在容器内时返回 null）
 */
export function parseRangeToSelection(
  range: Range,
  container: HTMLElement
): ParsedSelection | null {
  // 确保选区在容器内
  if (!isNodeInContainer(range.startContainer, container)) return null;
  if (!isNodeInContainer(range.endContainer, container)) return null;

  const startInfo = findLineInfo(range.startContainer, container);
  const endInfo = findLineInfo(range.endContainer, container);

  if (!startInfo || !endInfo) return null;

  // 计算字符偏移
  const startChar = getCharOffset(range.startContainer, range.startOffset, startInfo.lineIndex, container);
  const endChar = getCharOffset(range.endContainer, range.endOffset, endInfo.lineIndex, container);

  if (startChar === null || endChar === null) return null;

  // 提取纯文本
  const text = range.toString().trim();
  if (!text) return null;

  return {
    startLine: startInfo.lineIndex,
    startChar,
    endLine: endInfo.lineIndex,
    endChar,
    text,
  };
}

/**
 * 给定一个节点和偏移量，计算它在该行内的字符索引。
 *
 * 如果 node 本身就是带 data-line-index 的元素内的文本节点，
 * offset 就是字符位置。
 * 如果 node 在更深层次，需要向上找到行元素后重新计算。
 */
function getCharOffset(
  node: Node,
  offset: number,
  targetLineIndex: number,
  container: HTMLElement
): number | null {
  // 先找文本节点所在的行
  const lineInfo = findLineInfo(node, container);
  if (!lineInfo || lineInfo.lineIndex !== targetLineIndex) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    // 文本节点，offset 就是字符偏移
    // 但需要确认这个文本节点是行内唯一的文本节点
    // 如果行内只有一个文本节点，offset 直接就是 charIndex
    return offset;
  }

  // 如果是元素节点，offset 表示子节点索引，需要遍历前面的文本节点累计字符数
  let charCount = 0;
  for (let i = 0; i < offset && i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE) {
      charCount += child.textContent?.length ?? 0;
    }
  }
  return charCount;
}

/**
 * 获取 Range 对应的屏幕位置（用于定位浮动按钮）。
 * 返回 Range 的边界矩形信息。
 */
export function getRangeRect(range: Range): DOMRect {
  const rects = range.getClientRects();
  if (rects.length > 0) {
    // 合并所有矩形为一个大矩形
    let top = Infinity;
    let left = Infinity;
    let bottom = -Infinity;
    let right = -Infinity;

    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.top < top) top = r.top;
      if (r.left < left) left = r.left;
      if (r.bottom > bottom) bottom = r.bottom;
      if (r.right > right) right = r.right;
    }

    return new DOMRect(left, top, right - left, bottom - top);
  }

  // fallback: 使用 startContainer 的父元素位置
  const el = range.startContainer instanceof HTMLElement
    ? range.startContainer
    : range.startContainer.parentElement;
  return el?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
}

/**
 * 将选区信息转换为 ManualGroup 所需的行索引数组和行文本。
 * 支持跨行选择。
 */
export function selectionToLineData(
  selection: ParsedSelection,
  contentLines: string[]
): { lineIndices: number[]; lineTexts: string[] } | null {
  const lineIndices: number[] = [];
  const lineTexts: string[] = [];

  // 验证范围
  if (selection.startLine < 0 || selection.endLine >= contentLines.length) return null;

  for (let i = selection.startLine; i <= selection.endLine; i++) {
    lineIndices.push(i);
    lineTexts.push(contentLines[i]);
  }

  if (lineIndices.length === 0) return null;
  return { lineIndices, lineTexts };
}
