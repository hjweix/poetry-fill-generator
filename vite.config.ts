import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 性能优化配置
  build: {
    // 启用CSS代码分割
    cssCodeSplit: true,

    // 生成sourcemap用于调试（生产环境可关闭）
    sourcemap: false,

    // 资源内联阈值（小于此值的资源将内联）
    assetsInlineLimit: 4096,

    // 分块策略
    rollupOptions: {
      output: {
        // 文件名哈希化
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // 压缩配置
    minify: 'esbuild',

    // 目标浏览器
    target: 'es2015',

    // 启用CSS Tree Shaking
    cssTarget: 'chrome80',
  },

  // 开发服务器优化
  server: {
    port: 5173,
    host: true,
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
  },

  // 依赖优化
  optimizeDeps: {
    // 预构建依赖
    include: ['react', 'react-dom', 'docx', 'file-saver', 'jspdf', 'html2canvas'],
  },
})
