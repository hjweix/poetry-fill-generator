# 诗词填空生成器

一个功能丰富的 Web 版诗词填空题生成工具，支持单首/批量诗词录入，智能或手动拆分题目，一键导出 Word/PDF 文档。

## 功能特性

### 📝 诗词录入
- **单首录入**：输入诗词内容，自动识别标题和作者
- **批量录入**：支持多首诗词粘贴解析，空行自动分隔
- **智能识别**：自动提取诗词正文，过滤标题/作者行

### 🎯 拆题模式
- **智能生成**：一键自动生成填空题，根据难度智能选词
- **手动拆分**：拖选诗句添加填空题，逐字点击选择挖空位置
- **整句挖空**：一键将整句作为填空，适合默写训练

### 🎨 难度选择
- 🌱 **简单**：每句填空 1-2 个字（约 15% 字符）
- 🌟 **中等**：每句填空 2-3 个字（约 25% 字符）
- 🔥 **困难**：每句填空 3-4 个字（约 35% 字符）

### 📄 导出功能
- **Word 文档**：导出 .docx 格式，支持 Word/WPS 打开
- **PDF 文档**：导出 .pdf 格式，排版美观
- **打印**：直接打印预览效果
- **复制文本**：一键复制纯文本格式，粘贴到其他应用

### ✨ 其他特性
- 🎨 现代化响应式设计，支持移动端
- 📋 预览区实时同步，所见即所得
- ♿ 完整的无障碍支持（ARIA 标签、键盘导航）
- 🚀 性能优化（代码分割、资源压缩）

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **文档导出**：docx + html2canvas + jsPDF
- **测试框架**：Vitest + Cypress

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 使用方法

### 单首诗词模式

1. 选择「单首录入」标签页
2. 输入诗词内容（系统会自动识别标题和作者）
3. 选择难度级别（简单/中等/困难）
4. 选择拆题方式：
   - 点击「智能生成」自动生成填空题
   - 或在下方拖选诗句，手动添加填空题并逐字选词
5. 在右侧预览区查看效果
6. 导出为 Word/PDF 或复制文本

### 批量诗词模式

1. 选择「批量录入」标签页
2. 粘贴多首诗词内容（每首之间用空行分隔）
3. 点击「解析诗词」自动识别各首诗词
4. 选择难度级别
5. 点击「智能生成」批量生成填空题
6. 导出完整试卷

### 手动拆题

1. 在拆题面板中，用鼠标拖选要添加的句子
2. 松开鼠标后点击「添加填空题」
3. 在已添加的题目卡片中，点击字符选择挖空位置
4. 使用「一键智能选词」根据当前难度自动选词
5. 点击「整句挖空」将整句作为填空

## 项目结构

```
poetry-fill-generator/
├── src/
│   ├── components/              # React 组件
│   │   ├── PoetryInput.tsx      # 单首诗词输入
│   │   ├── BatchPoetryInput.tsx # 批量诗词输入
│   │   ├── SplitModePanel.tsx   # 拆题面板（整合智能/手动）
│   │   ├── BlankModeSelector.tsx# 难度选择器
│   │   ├── TextSelectionEditor.tsx   # 文本选择式手动拆分
│   │   ├── QuestionPreview.tsx  # 题目预览
│   │   ├── GroupSizeSelector.tsx# 分组大小选择
│   │   └── ErrorBoundary.tsx    # 错误边界
│   ├── utils/                   # 工具函数
│   │   ├── fillGenerator.ts     # 填空生成核心逻辑
│   │   ├── docxExporter.ts      # Word 导出
│   │   ├── pdfExporter.ts       # PDF 导出
│   │   └── performance.ts       # 性能监控
│   ├── types/                   # TypeScript 类型定义
│   ├── styles/                  # 样式文件
│   ├── App.tsx                  # 主应用组件
│   └── main.tsx                 # 应用入口
├── tests/                       # 测试文件
├── public/                      # 静态资源
└── package.json                 # 项目配置
```

## 填空算法说明

### 智能保护机制
- 自动保护标点符号不被填空
- 保护虚词（之、乎、者、也等）不被优先选为填空

### 关键词识别
- **动词**：看、见、听、思、念、望等
- **形容词**：美、好、清、明、碧、翠等
- **名词**：山、水、月、花、云、风等

### 难度分级
| 难度 | 填空比例 | 每句填空数 |
|------|----------|-----------|
| 简单 | ~15%     | 1-2 字    |
| 中等 | ~25%     | 2-3 字    |
| 困难 | ~35%     | 3-4 字    |

## 测试

```bash
# 运行单元测试
npm test

# 运行 E2E 测试（交互模式）
npm run test:e2e:open

# 运行 E2E 测试（命令行）
npm run test:e2e

# 类型检查
npm run typecheck

# 代码规范检查
npm run lint
```

## 部署

### Vercel（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录并部署
vercel
```

或通过 Git 集成：Push 到 GitHub 后在 Vercel 导入仓库。

### 其他平台

支持部署到 Netlify、Cloudflare Pages、GitHub Pages 等静态托管平台。

构建命令：`npm run build`  
输出目录：`dist`

详细部署指南请参阅 [DEPLOY.md](./DEPLOY.md)。

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 许可证

MIT License. See [LICENSE](./LICENSE).

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request
