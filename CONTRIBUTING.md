# 贡献指南

感谢您对诗词填空生成器项目的兴趣！我们欢迎各种形式的贡献，包括但不限于bug修复、新功能开发、文档改进等。

## 开发环境设置

### 前置要求

- Node.js 16+
- npm 8+ 或 yarn 1.22+
- Git

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-username/poetry-fill-generator.git
cd poetry-fill-generator

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 开发工作流程

### 1. 创建分支

从 `main` 分支创建功能分支：

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 编写代码

请遵循以下编码规范：

- 使用 TypeScript 进行开发
- 组件使用函数式组件 + Hooks
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### 3. 测试

#### 单元测试（可选）

```bash
npm test
```

#### E2E测试

```bash
# 启动开发服务器
npm run dev

# 在另一个终端运行E2E测试
npm run test:e2e
```

### 4. 提交更改

使用清晰的提交信息：

```
<type>: <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更改
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：

```
feat: 添加诗词自动识别功能

- 支持从诗词内容中自动提取标题
- 支持从诗词内容中自动提取作者
- 添加智能检测算法

Closes #123
```

### 5. 推送并创建PR

```bash
git push origin feature/your-feature-name
```

然后在GitHub上创建Pull Request。

## 代码规范

### TypeScript

- 启用严格模式
- 避免使用 `any` 类型
- 为公共API添加类型注解
- 使用接口定义对象类型

### React组件

- 使用函数式组件
- Hooks放在组件顶部
- 自定义Hooks以 `use` 开头
- 组件文件使用 PascalCase

### CSS/Styling

- 使用CSS类名而非内联样式（复杂样式）
- 遵循BEM命名规范
- 响应式设计优先移动端

### 可访问性

- 所有交互元素需要有适当的ARIA标签
- 支持键盘导航
- 确保颜色对比度符合WCAG标准
- 添加屏幕阅读器支持

## 项目结构

```
src/
├── components/       # React组件
│   └── *.tsx         # 组件文件
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
├── styles/          # 样式文件
├── App.tsx          # 主应用
└── main.tsx         # 入口文件
```

## 测试指南

### 添加测试

测试文件应放在与被测文件相同的目录下：

```
src/components/
├── Button.tsx
└── Button.test.tsx
```

### E2E测试数据属性

添加 `data-testid` 属性以便E2E测试定位元素：

```tsx
<button data-testid="submit-button">提交</button>
```

## 问题反馈

### Bug报告

请包含以下信息：

1. 问题描述
2. 复现步骤
3. 预期行为
4. 实际行为
5. 环境信息（操作系统、浏览器版本等）

### 功能请求

请描述：

1. 解决的问题或需求
2. 建议的解决方案
3. 可能的替代方案

## 许可证

通过贡献代码，您同意将您的代码按MIT许可证发布。
