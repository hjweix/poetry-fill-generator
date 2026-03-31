# WorkBuddy 长期记忆

## 项目记录

### poetry-fill-generator_v1（诗词填空生成器）
- **位置**: `/Users/hjw/Documents/Develope/poetry-fill-generator_v1`
- **技术栈**: React 18 + TypeScript + Vite + Tailwind CSS 3.4 + jsPDF + html2canvas
- **功能（v6 合并拆题面板后）**:
  - 单首/批量诗词录入，自动识别标题/作者
  - 批量模式支持多首诗词粘贴解析（空行分隔）
  - **统一拆题面板（SplitModePanel）**：去掉智能/手动 Tab 切换，统一布局
    - 全局难度选择（BlankModeSelector）：简单 / 中等 / 困难，鼠标悬停显示 tooltip 提示
    - 诗句拖选区（单首模式）：TextSelectionEditor，鼠标拖选诗句 → 添加填空题 → 逐字选词挖空
    - 一键智能选词按钮（手动模式）：根据当前难度为所有手动添加的填空题智能选词
    - 智能生成按钮：一键智能生成填空题，也可手动拖选拆分
    - 整句模式下，点击题目卡片中的行直接整句挖空
  - **组件**：
    - `BlankModeSelector.tsx`：难度选择器（简单/中等/困难），带 tooltip
    - `TextSelectionEditor.tsx`：文本选择式手动拆分编辑器，支持整句模式、一键智能选词
    - `SelectionFloatingButton.tsx`：选区浮动操作按钮
    - `SmartSplitConfig.tsx`：已精简（空壳），挖空程度已提升到 SplitModePanel
    - `BlankMode` 类型、`blankModeToDifficulty` 映射函数
    - `SplitMode` 类型已移除
  - 预览区：大题用阿拉伯数字编号（1）（2）（3），支持复制文本和PDF导出
  - 预览区高度跟随左侧模块（ResizeObserver 动态同步）
  - 导出 Word (.docx) / PDF (jsPDF+html2canvas) / 打印 / 复制文本
  - Word 导出直接接收 QuestionGroup[]，与预览区保持一致
  - PDF 导出：截图前解除所有 overflow/scroll 限制（.preview-section、.preview-print-area、.exam-questions、.exam-paper），确保批量模式长内容完整导出
- **开发服务器**: npm run dev（默认 5173）
- **最后更新**: 2026-03-31（难度选择器tooltip、一键智能选词、Word导出与预览一致化、预览区高度跟随左侧、PDF批量导出修复）
