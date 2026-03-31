---
name: poetry-grouping-feature
overview: 新增分题功能：生成前可按N句自动分组，生成后在预览区支持拖动分题线调整分组边界；批量模式每首诗词独立配置。
todos:
  - id: types-and-groupfn
    content: 在 types/index.ts 新增 QuestionGroup、GroupSize、BatchPoetryItem.groupSize；在 fillGenerator.ts 新增 groupQuestions 和 formatGroupsForExport 函数
    status: completed
  - id: group-size-selector
    content: 新建 GroupSizeSelector.tsx；改造 BatchPoetryInput.tsx 每首卡片加独立分题选择；App.tsx 新增 groupSizeMap/adjustedGroups state 和 useMemo 初始分组逻辑，并在单首/批量模式下渲染 GroupSizeSelector
    status: completed
    dependencies:
      - types-and-groupfn
  - id: preview-and-export
    content: 改造 QuestionPreview 接收 QuestionGroup[]、渲染大题格式和合并/拆分按钮；docxExporter 新增 exportToDocxGroups；App.tsx 的复制文本改用 formatGroupsForExport
    status: completed
    dependencies:
      - group-size-selector
---

## 用户需求

在现有填空题生成基础上新增「分题」功能，支持两级控制：

### 核心功能

**生成前：自动分组设置**

- 难度选择下方新增「分题设置」控件
- 选项：整首一题（默认）/ 每2句 / 每4句 / 每6句
- 批量模式下每首诗词卡片上独立设置分题粒度

**生成后：预览区手动调整**

- 预览区两道相邻大题之间显示「分题线」操作区
- 点击「合并」可将相邻两题合并为一题；题目内部点击「拆分」可在指定行之后拆成两题
- 调整后预览即时更新，导出和复制同步反映最新分组

**大题格式**

- 每道大题用汉字题号（一）（二）…编号
- 大题内部各句保持独立填空，按行排列
- 出处显示在大题末尾一次，不逐行重复

**导出同步**

- docx 导出、复制文本均按大题格式输出

## 产品概览

用户可在生成前用「每N句」快速设定分组粒度，生成后在预览区通过合并/拆分按钮精细调整，最终导出的试卷以「大题」为单位展示，每道大题含若干填空行，共享一个题号。

## 核心功能

- 分题设置 UI（GroupSizeSelector 组件）
- 批量模式每首独立分题配置
- QuestionGroup 数据层及 groupQuestions 分组函数
- 预览区大题合并/拆分交互
- docx 导出及复制文本按大题格式输出

## 技术栈

延续现有栈：React 18 + TypeScript + Vite，无新增依赖。

---

## 实现方案

**核心策略**：`FillBlankQuestion[]` 平铺结构不变（不改 generator 签名），新增 `groupQuestions()` 纯函数将平铺数据派生为 `QuestionGroup[]`。App.tsx 用 `useMemo` 计算初始分组，用户手动调整后存入 `adjustedGroups` state，预览与导出均消费 `adjustedGroups`。

批量模式分题配置存于 `groupSizeMap: Map<poetryId, GroupSize>`，BatchPoetryItem 扩展 `groupSize` 字段以持久化每首配置。

---

## 架构设计

```
FillBlankQuestion[]（平铺，generator 生成）
  ↓ groupQuestions(questions, groupSizeMap) [useMemo，questions/groupSizeMap 变化时重算]
QuestionGroup[]（初始分组）
  ↓ 用户在 Preview 里合并/拆分
adjustedGroups: QuestionGroup[]（手动调整后，存 App state）
  ↓                ↓                  ↓
QuestionPreview  exportToDocx     handleCopyText
```

---

## 实现注意事项

1. **groupSize 变化即重算**：`questions` 或 `groupSizeMap` 任一变化时，`useMemo` 重新计算初始分组并**覆盖** `adjustedGroups`（丢弃旧的手动调整），这是符合预期的行为。
2. **合并/拆分操作**：直接操作 `adjustedGroups` 数组——合并是将 `groups[i].lines` 与 `groups[i+1].lines` 拼接；拆分是在指定 `lineIndex` 处将 `group.lines` 切为两段，重新分配 id。
3. **单首模式**：`groupSizeMap` 只有一条 key（`poetryId` 或 `title-author`），与批量模式共用同一路径。
4. **docxExporter**：新增 `exportToDocxGroups(groups, title)` 函数，原 `exportToDocx` 保持兼容以防其他调用处报错，App.tsx 直接调用新函数。
5. **题号重排**：合并/拆分后需对 `adjustedGroups` 重新编号（`id = index + 1`），避免 id 空洞。
6. **汉字题号**：`1→一, 2→二 …` 映射表写在 QuestionPreview 和 docxExporter 共用的工具函数里，避免重复。

---

## 目录结构

```
src/
├── types/
│   └── index.ts                    [MODIFY] 新增 QuestionGroup、GroupSize；BatchPoetryItem 加 groupSize 字段
├── utils/
│   ├── fillGenerator.ts            [MODIFY] 新增 groupQuestions(questions, groupSizeMap) 和 formatGroupsForExport(groups)
│   └── docxExporter.ts             [MODIFY] 新增 exportToDocxGroups(groups, title)；原 exportToDocx 保留
├── components/
│   ├── GroupSizeSelector.tsx       [NEW] 分题粒度选择控件，复用 difficulty-selector 样式类
│   ├── QuestionPreview.tsx         [MODIFY] props 改为 questionGroups: QuestionGroup[]；大题渲染 + 合并/拆分按钮
│   └── BatchPoetryInput.tsx        [MODIFY] 每首卡片上方加 GroupSizeSelector，onChange 同步到 items[i].groupSize
└── App.tsx                         [MODIFY] 新增 groupSizeMap、adjustedGroups state；useMemo 派生初始分组；导出/复制改用 groups
```

---

## 关键类型定义

```ts
// types/index.ts 新增

export type GroupSize = 'whole' | 2 | 4 | 6;

export interface QuestionGroup {
  id: number;           // 大题编号（1-based，展示时转汉字）
  title: string;
  author: string;
  poetryId?: string;
  lines: FillBlankQuestion[];
}

// BatchPoetryItem 扩展
export interface BatchPoetryItem {
  id: string;
  poetry: PoetryInput;
  isExpanded: boolean;
  groupSize?: GroupSize;  // 新增，undefined 时默认 'whole'
}
```

```ts
// fillGenerator.ts 新增签名

export function groupQuestions(
  questions: FillBlankQuestion[],
  // key: poetryId 或 `${title}-${author}`，value: 分题粒度
  groupSizeMap: Map<string, GroupSize>
): QuestionGroup[]
```