---
name: poetry-fill-generator-v2
overview: 基于现有 poetry-fill-generator_v1，开发 v2 版本，新增批量输入识别、PDF 导出、打印功能，并用 Tailwind CSS + shadcn/ui 全面升级 UI。
design:
  architecture:
    framework: react
  styleKeywords:
    - 墨韵诗风
    - 朱砂红主色
    - 宣纸暖白背景
    - 毛笔字体点缀
    - 卡片分层阴影
    - 微动画过渡
  fontSystem:
    fontFamily: Noto Serif SC
    heading:
      size: clamp(2rem,4vw,2.5rem)
      weight: 700
    subheading:
      size: 1.2rem
      weight: 600
    body:
      size: 1rem
      weight: 400
  colorSystem:
    primary:
      - "#E54D42"
      - "#F39C12"
      - "#2C3E50"
    background:
      - "#FAF8F3"
      - "#FFFFFF"
      - "#1A1A1A"
    text:
      - "#1A1A2E"
      - "#4A4A6A"
      - "#8E8E9E"
    functional:
      - "#3498DB"
      - "#27AE60"
      - "#E74C3C"
      - "#95A5A6"
todos:
  - id: install-deps
    content: 安装 jspdf、html2canvas 依赖，配置 package.json
    status: completed
  - id: types-and-parser
    content: 扩展 types/index.ts 新增 BatchPoetryItem，在 fillGenerator.ts 中实现 parseBatchPoetry 批量解析函数
    status: completed
    dependencies:
      - install-deps
  - id: batch-input-component
    content: 使用 [skill:ui-ux-pro-max] 和 [skill:lucide-icons] 新建 BatchPoetryInput.tsx，实现批量粘贴、自动解析、逐条编辑与删除
    status: completed
    dependencies:
      - types-and-parser
  - id: app-state-and-ui
    content: 改造 App.tsx 和 PoetryInput.tsx，新增单首/批量 Tab 切换、批量状态管理与 InteractiveFillBlanks 多首适配
    status: completed
    dependencies:
      - batch-input-component
  - id: pdf-and-print
    content: 新建 pdfExporter.ts 实现 PDF 导出（jsPDF+html2canvas），扩展 print.css 打印样式，在 App.tsx 中接入 PDF 导出与打印按钮
    status: completed
    dependencies:
      - app-state-and-ui
---

## 用户需求

在现有 `poetry-fill-generator_v1` 项目基础上进行功能升级，打造完整的诗词填空 Web 应用。

## 产品概述

一款面向教育场景的诗词填空题生成工具，支持单首/批量诗词录入、多模式填空生成、在线预览及多格式导出。

## 核心功能

### 一、诗词录入（升级）

- 保留单首诗词输入模式，自动识别标题与作者，支持手动调整
- **新增批量输入模式**：一次粘贴多首诗词，系统自动按空行或"《标题》 作者"格式分割，逐一识别标题/作者，生成诗词列表，每首可独立编辑标题与作者，并可单独删除
- 批量模式下，所有已识别诗词统一参与填空题生成

### 二、生成填空题

- **智能填空**：按简单/中等/困难三档难度自动选取关键词填空（已有，保留）
- **手动选词填空**：点击字符交互式选择填空位置，支持重要性颜色提示（已有，保留）
- 批量模式下，对所有诗词逐一生成填空题

### 三、预览与导出

- **在线预览**：生成后实时展示填空题（已有，保留）
- **导出 Word (.docx)**：含标题、作者、题号，格式规范（已有，保留）
- **导出 PDF**：新增，使用 jsPDF + html2canvas 方案，与 Word 格式一致
- **发起打印**：新增，调用 `window.print()`，配套打印专用 CSS，隐藏无关 UI，仅打印题目区域

## 技术栈

- **框架**：React 19 + TypeScript（现有，继续沿用）
- **构建工具**：Vite 8（现有，继续沿用）
- **样式**：现有自定义 CSS（Stitch Design System），**新增 Tailwind CSS v4** 集成，用于新增组件
- **新增依赖**：
- `jspdf` + `html2canvas`：PDF 导出
- `tailwindcss` + `@tailwindcss/vite`：Tailwind CSS v4（Vite 原生插件方案）

## 实现方案

### 批量输入解析

在 `fillGenerator.ts` 中新增 `parseBatchPoetry(text: string): PoetryInput[]` 函数，解析规则：

1. 优先按连续空行（2 个以上换行）分割多首诗词
2. 对每个片段调用现有 `autoDetectTitleAndAuthor` 识别标题/作者
3. 去除识别出的标题/作者行，保留纯正文内容

在 `PoetryInput.tsx` 中新增"批量模式"切换 Tab，批量模式渲染一个 `BatchPoetryInput` 组件，展示解析后的诗词列表，每条可编辑标题/作者/内容，支持删除。

### PDF 导出

采用 **jsPDF + html2canvas** 方案，对已渲染的预览 DOM 节点（`QuestionPreview`）截图后写入 PDF。优点是与 Word 导出的格式完全一致，中文字体由 DOM 渲染保障，无需嵌入字体包。

新增 `src/utils/pdfExporter.ts`，接受 DOM ref，执行 `html2canvas` 截图后调用 `jsPDF.addImage` 分页写入。

### 打印功能

在 `App.tsx` 中新增 `handlePrint()` 函数，调用 `window.print()`。现有 `App.css` 中已有 `@media print` 骨架，扩展为：隐藏输入区、头部、尾部、导出按钮，仅显示预览区域，并对题目区域添加 `page-break-inside: avoid`。

### 架构调整

- 类型定义扩展：新增 `BatchPoetryItem` 接口，包含 `id`、`PoetryInput` 字段和 `isExpanded` 展开状态
- `App.tsx` 新增 `inputMode: 'single' | 'batch'` 状态，批量模式下维护 `batchPoems: BatchPoetryItem[]` 列表
- 导出区按钮组新增"导出 PDF"和"打印"按钮，保持现有按钮顺序不变

## 实现细节

- **PDF 分页**：html2canvas 截图后按 A4 高度分割图片，避免内容被裁断
- **批量解析边界**：单行文本不构成诗词时保持原样，避免误分割；解析结果为空时回退到整体单首处理
- **打印 CSS**：使用 `@media print` 隔离，不影响屏幕显示；`input-section`、`.app-header`、`.app-footer`、`.action-buttons` 均设 `display: none`
- **向后兼容**：单首模式保持与现有完全一致的行为，不破坏已有 Cypress E2E 测试

## 架构图

```mermaid
graph TD
    A[App.tsx] --> B{inputMode}
    B -->|single| C[PoetryInput 单首]
    B -->|batch| D[BatchPoetryInput 批量]
    C --> E[InteractiveFillBlanks]
    D --> E
    E --> F[FillBlankQuestion[]]
    F --> G[QuestionPreview]
    G --> H[导出 Word]
    G --> I[导出 PDF - pdfExporter.ts]
    G --> J[打印 window.print]
    D --> K[parseBatchPoetry - fillGenerator.ts]
    K --> D
```

## 目录结构

```
poetry-fill-generator_v1/
├── src/
│   ├── components/
│   │   ├── PoetryInput.tsx              # [MODIFY] 新增单首/批量模式 Tab 切换入口
│   │   ├── BatchPoetryInput.tsx         # [NEW] 批量输入组件：文本粘贴区 + 解析后诗词列表，每条可编辑标题/作者/内容，可删除
│   │   ├── InteractiveFillBlanks.tsx    # [MODIFY] 支持接受 PoetryInput[] 批量输入（兼容单首）
│   │   └── QuestionPreview.tsx          # [MODIFY] 挂载 ref，供 pdf 导出截图；预览区分诗词分组展示
│   ├── types/
│   │   └── index.ts                     # [MODIFY] 新增 BatchPoetryItem 接口；PoetryInput 扩展 id 字段
│   ├── utils/
│   │   ├── fillGenerator.ts             # [MODIFY] 新增 parseBatchPoetry 函数
│   │   └── pdfExporter.ts               # [NEW] PDF 导出工具：html2canvas 截图 + jsPDF 分页写入
│   ├── styles/
│   │   └── print.css                    # [NEW] 打印专用样式，@media print 隔离
│   ├── App.tsx                          # [MODIFY] 新增 inputMode 状态、handlePrint、handleExportPDF；按钮组补充 PDF/打印按钮
│   └── App.css                          # [MODIFY] 扩展 @media print 规则；引入 print.css
├── package.json                         # [MODIFY] 新增 jspdf、html2canvas 依赖
└── vite.config.ts                       # [MODIFY] 新增 @tailwindcss/vite 插件（可选，用于 BatchPoetryInput 样式）
```

## 设计风格

延续现有「诗韵墨香」设计语言，在原有 Stitch Design System 基础上扩展新增功能的 UI，保持视觉一致性。

### 新增 UI 模块设计

#### 单首/批量模式切换 Tab

- 位于诗词录入区顶部，两个水平 Tab：「单首录入」「批量录入」
- 激活态：背景色为朱砂红（`#E54D42`），文字白色；非激活态：透明背景，边框线条
- Tab 切换带有 0.25s 淡入过渡

#### 批量输入区（BatchPoetryInput）

- 上方：大文本框（高度 160px），placeholder 说明用空行分隔多首诗词的格式；右侧「解析」按钮
- 下方：解析结果列表，每条为卡片样式，左侧彩色竖条区分不同诗词，内有标题/作者输入框（内联可编辑）、正文折叠展示、右上角删除图标
- 卡片间距 12px，hover 时轻微上浮阴影

#### 导出按钮组扩展

- 原有：「智能生成」「复制文本」「导出 Docx」
- 新增：「导出 PDF」（蓝色调，与 Docx 区分）、「打印」（墨色调）
- 按钮排列保持 flex-wrap，移动端自动换行

#### 预览区分组展示

- 批量模式下按诗词分组，每组前显示「《标题》 作者」标题行，金色装饰线区分

### 各页面/区块设计

**主页面（唯一页面，上下分区）：**

**Block 1 - 顶部 Header**
沿用现有：深墨色渐变背景，「诗词填空生成器」大标题，副标题，微动画光晕效果

**Block 2 - 左侧：诗词录入区**
顶部新增「单首/批量」Tab；单首模式保持现状；批量模式替换为 BatchPoetryInput；底部难度选择器 + 填空模式选择 + 操作按钮组

**Block 3 - 右侧：预览区**
保持现状，扩展：批量多诗词分组展示，导出/打印按钮移至此区域底部或保留在左侧操作区

**Block 4 - 底部 Footer**
沿用现有

## 使用的 Agent 扩展

### Skill: ui-ux-pro-max

- **用途**：在实现新增 UI 组件（BatchPoetryInput、新按钮组）前，查询现有设计系统的配色、间距和交互规范，确保与项目已有 Stitch Design System 风格一致
- **预期结果**：获取适合诗词/教育场景的组件样式指导，应用于批量输入卡片和 PDF/打印按钮的具体实现

### Skill: lucide-icons

- **用途**：下载批量模式所需 SVG 图标（如 `trash-2` 删除、`file-text` 文档导出、`printer` 打印、`layers` 批量、`edit-3` 编辑）
- **预期结果**：以 React 组件格式输出到 `src/icons/`，替代现有 emoji 图标用于新增功能按钮