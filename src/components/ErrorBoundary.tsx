import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获React组件渲染过程中的错误，防止整个应用崩溃
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新state使下一次渲染能够显示降级UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    console.error('错误边界捕获到错误:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 可以在这里发送错误报告到服务器
    this.reportError(error, errorInfo);
  }

  /**
   * 报告错误到监控服务
   */
  private reportError(error: Error, _errorInfo: ErrorInfo): void {
    // 生产环境中可以发送到错误监控服务
    if (import.meta.env.PROD) {
      // 例如：Sentry、LogRocket等
      // Sentry.captureException(error, { extra: errorInfo });
      console.error('生产环境错误报告:', { error: error.message, stack: error.stack });
    }
  }

  /**
   * 重置错误状态
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果有自定义的降级UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认降级UI
      return (
        <div
          className="error-boundary"
          role="alert"
          aria-live="assertive"
          style={{
            padding: '40px 20px',
            maxWidth: '600px',
            margin: '50px auto',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}
              aria-hidden="true"
            >
              😔
            </div>
            <h2
              style={{
                color: '#cf1322',
                marginBottom: '12px',
                fontSize: '24px',
              }}
            >
              出现了一些问题
            </h2>
            <p
              style={{
                color: '#8c8c8c',
                marginBottom: '20px',
              }}
            >
              应用遇到了意外错误，请尝试刷新页面或稍后重试。
            </p>

            {/* 错误详情（仅在开发环境显示） */}
            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  marginTop: '20px',
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}
                >
                  错误详情（开发模式）
                </summary>
                <pre
                  style={{
                    overflow: 'auto',
                    maxHeight: '200px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={this.resetError}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '12px',
                }}
              >
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  color: '#1890ff',
                  border: '1px solid #1890ff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * 高阶组件形式的错误边界
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundary;
}
