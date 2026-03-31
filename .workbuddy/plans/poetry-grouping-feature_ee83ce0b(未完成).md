---
name: poetry-grouping-feature
overview: 新增「分题」功能：用户可设置每道大题包含几句诗词，系统在生成填空时将多句组合成一道题（支持按首、按N句两种粒度），预览和导出都以分组后的大题形式展示。
todos:
  - id: types-and-groupfn
    content: 在 types/index.ts 新增 QuestionGroup 接口和 GroupSize 类型；在 fillGenerator.ts 新增 groupQuestions 和 formatGroupsForExport 函数
    status: pending
  - id: group-size-selector
    content: 新建 GroupSizeSelector.tsx 组件；在 App.tsx 新增 groupSize state 和 useMemo 派生 questionGroups，并渲染 GroupSizeSelector
    status: pending
    dependencies:
      - types-and-groupfn
  - id: preview-and-export
    content: 改造 QuestionPreview 按 QuestionGroup[] 渲染大题；更新 docxExporter 和复制文本逻辑支持大题格式输出
    status: pending
    dependencies:
      - group-size-selector
---

## 用户需求

在现有「每句一道小题」基础上新增「分题」功能：

- **默认模式**：每首诗词的所有句子合并为一道大题（原本是每句一道独立题）
- **可选模式**：按每 N 句（2 / 4 / 6 句）划分一道大题
- 分题后大题内部每句保持独立填空（____），整体共享一个题号（一）（二）…
- 预览区、docx 导出、复制文本均按大题格式同步展示

## 产品概览

新增「分题设置」控件（位于难度选择下方），用户选择分题粒度后，系统将平铺的句级填空题重新分组为若干大题，每道大题内包含 N 行填空内容，渲染和导出均以大题为单位编号。

## 核心功能

- 分题设置 UI：单选按钮组，选项为 整首（默认）/ 每2句 / 每4句 / 每6句
- 数据层：新增 `QuestionGroup` 类型，一个 Group = 一道大题，内含多个 `FillBlankQuestion`
- 预览：大题题号 + 组内各行填空按换行排列，出处显示在大题末尾
- 导出（docx / 复制文本）：同步按大题格式输出

## 技术栈

延续现有栈：React 18 + TypeScript + Vite，无需新增依赖。

## 实现方案

**核心策略**：`FillBlankQuestion[]` 平铺结构保持不变（不改 generator 签名），新增 `groupQuestions()` 纯函数在渲染/导出层将平铺数据派生为 `QuestionGroup[]`。App.tsx 用 `useMemo` 缓存分组结果，做到零额外副作用。

## 新增核心类型（types/index.ts）

```ts
export interface QuestionGroup {
  id: number;           // 大题编号
  title: string;
  author: string;
  poetryId?: string;
  lines: FillBlankQuestion[];  // 大题内的各行
}

export type GroupSize = 'whole' | 2 | 4 | 6;
```

## 分组逻辑（fillGenerator.ts 新增）

```ts
export function groupQuestions(
  questions: FillBlankQuestion[],
  groupSize: GroupSize
): QuestionGroup[]
```

- `groupSize === 'whole'`：按 poetryId / title-author 聚合，每首诗词全部行 = 一个 Group
- `groupSize === number`：先按诗词聚合，再在每首内部每 N 行切一组

## 架构设计

```
FillBlankQuestion[]（平铺，由 generateFillBlankQuestions 生成）
        ↓ groupQuestions(questions, groupSize)  [useMemo]
QuestionGroup[]（大题列表）
        ↓              ↓               ↓
QuestionPreview   exportToDocx    formatGroupsForExport（复制文本）
```

## 实现注意事项

- `GroupSizeSelector` 与 `DifficultySelector` 样式保持一致（复用 `.difficulty-selector` 类名模式）
- `InteractiveFillBlanks` 手动生成的结果也走同一 `groupQuestions` 分组，无需额外处理
- `QuestionPreview` 大题内部各行用 `<br/>` 或 `block` 元素换行，保证可打印布局正确
- docxExporter 大题内各行合并为同一段落（行间手动插入换行符 `\n`）或分独立段落（推荐，间距更可控）
- pdf 导出复用 `previewRef` DOM 快照，无需额外改动

## 目录结构

```
src/
├── types/
│   └── index.ts                [MODIFY] 新增 QuestionGroup、GroupSize
├── utils/
│   └── fillGenerator.ts        [MODIFY] 新增 groupQuestions、formatGroupsForExport
├── components/
│   ├── GroupSizeSelector.tsx   [NEW] 分题粒度单选控件（整首/每2句/每4句/每6句）
│   ├── QuestionPreview.tsx     [MODIFY] props 改为接收 questionGroups: QuestionGroup[]
│   └── DifficultySelector.tsx  [NO CHANGE]
├── utils/
│   └── docxExporter.ts         [MODIFY] 新增按 QuestionGroup[] 渲染大题逻辑
└── App.tsx                     [MODIFY] 新增 groupSize state，useMemo 派生 questionGroups，传递给 Preview/导出
```