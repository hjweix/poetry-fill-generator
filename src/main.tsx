import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/stitch-theme.css'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

// 全局错误处理器
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  console.error('全局错误:', error, errorInfo)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary onError={handleGlobalError}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// 可选：注册 service worker（用于 PWA）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker 注册失败，不影响应用运行
    })
  })
}
