# 部署指南

本指南将帮助您将诗词填空生成器部署到各种平台。

## 构建生产版本

### 1. 本地构建

```bash
# 安装依赖（如果尚未安装）
npm install

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

构建产物将输出到 `dist` 目录。

### 2. 构建分析

查看构建大小和分析：

```bash
npm run build:analyze
```

## 部署选项

### 1. 静态托管（推荐）

项目可以部署到任何静态托管服务：

#### Vercel

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel
```

或使用Git集成：
1. Push代码到GitHub
2. 在Vercel导入项目
3. 自动部署

#### Netlify

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod --dir=dist
```

或使用Git集成：
1. Push代码到GitHub/GitLab
2. 在Netlify导入项目
3. 配置构建命令：`npm run build`
4. 配置输出目录：`dist`

#### GitHub Pages

1. 创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. 推送到main分支即可自动部署

#### Cloudflare Pages

1. 连接您的Git仓库
2. 配置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`

### 2. Docker部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

创建 `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

构建和运行：

```bash
docker build -t poetry-fill-generator .
docker run -p 8080:80 poetry-fill-generator
```

### 3. 手动部署到服务器

1. 构建项目：
```bash
npm run build
```

2. 上传 `dist` 目录到服务器

3. 配置Web服务器（Nginx示例）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/poetry-fill/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

4. 重启Nginx：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 环境变量

### 可选配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `VITE_APP_TITLE` | 应用标题 | 诗词填空生成器 |
| `VITE_APP_VERSION` | 应用版本 | 1.0.0 |

在 `.env.production` 文件中配置：

```
VITE_APP_TITLE=诗词填空生成器
VITE_APP_VERSION=1.0.0
```

## 性能优化

### 生产环境优化

1. **启用Gzip/Brotli压缩**
2. **配置CDN加速**
3. **启用HTTP/2**
4. **设置缓存策略**

### 构建优化

Vite已自动优化：
- 代码分割
- Tree shaking
- 资源内联
- CSS代码分割

## 监控和错误追踪

### 建议添加

1. **错误监控**：Sentry、LogRocket等
2. **性能监控**：Web Vitals、Google Analytics
3. **可用性监控**：UptimeRobot等

### 集成示例

在 `src/main.tsx` 中添加Sentry：

```tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

## 故障排除

### 常见问题

1. **白屏问题**
   - 检查浏览器控制台错误
   - 确认 `dist` 目录存在且包含 `index.html`
   - 检查Web服务器配置

2. **静态资源加载失败**
   - 确认路径配置正确
   - 检查 `base` 配置（如果使用子路径）

3. **SPA路由404**
   - 确保服务器配置 `try_files $uri $uri/ /index.html`

## 安全建议

1. **保持依赖更新**
   ```bash
   npm audit
   npm update
   ```

2. **使用HTTPS**
   - 所有现代浏览器要求HTTPS
   - 使用Let's Encrypt获取免费证书

3. **配置CSP头**
   ```nginx
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
   ```

---

## 快速部署命令

```bash
# 构建
npm run build

# 预览本地构建
npm run preview

# 使用serve部署
npx serve dist
```

祝部署顺利！
