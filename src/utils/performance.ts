/**
 * 性能监控工具
 * 用于追踪和报告 Web Vitals 指标
 */

interface PerformanceMetrics {
  // 页面加载时间
  pageLoadTime: number;
  // 首次内容绘制 (FCP)
  firstContentfulPaint: number;
  // 最大内容绘制 (LCP)
  largestContentfulPaint: number;
  // 首次输入延迟 (FID)
  firstInputDelay: number;
  // 累积布局偏移 (CLS)
  cumulativeLayoutShift: number;
  // 交互到绘制时间 (TTI)
  timeToInteractive: number;
}

interface MetricCallback {
  (metric: { name: string; value: number; delta: number; id: string; entries: PerformanceEntry[] }): void;
}

/**
 * 获取性能指标
 */
export function getPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const timing = window.performance.timing;

  // 计算各项指标
  const metrics: PerformanceMetrics = {
    // 页面加载时间 (白屏时间)
    pageLoadTime: timing.loadEventEnd - timing.navigationStart,

    // 首次内容绘制
    firstContentfulPaint: getFirstContentfulPaint(),

    // 最大内容绘制
    largestContentfulPaint: getLargestContentfulPaint(),

    // 首次输入延迟
    firstInputDelay: getFirstInputDelay(),

    // 累积布局偏移
    cumulativeLayoutShift: getCumulativeLayoutShift(),

    // 交互到绘制时间
    timeToInteractive: timing.domInteractive - timing.navigationStart,
  };

  return metrics;
}

/**
 * 获取首次内容绘制时间
 */
function getFirstContentfulPaint(): number {
  const entries = performance.getEntriesByType('paint');
  const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
  return fcp ? fcp.startTime : 0;
}

/**
 * 获取最大内容绘制时间
 */
function getLargestContentfulPaint(): number {
  if ('LargestContentfulPaint' in window) {
    const entries = performance.getEntriesByType('largest-contentful-paint');
    const lastEntry = entries[entries.length - 1];
    return lastEntry ? lastEntry.startTime : 0;
  }
  return 0;
}

/**
 * 获取首次输入延迟
 */
function getFirstInputDelay(): number {
  const entries = performance.getEntriesByType('first-input') as PerformanceEventTiming[];
  if (entries.length > 0) {
    return entries[0].processingStart - entries[0].startTime;
  }
  return 0;
}

/**
 * 获取累积布局偏移
 */
function getCumulativeLayoutShift(): number {
  if ('PerformanceObserver' in window) {
    let cls = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ('hadRecentInput' in entry && !(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    return cls;
  }
  return 0;
}

/**
 * 观察性能指标变化
 */
export function observePerformanceMetrics(callback: MetricCallback): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  const observers: PerformanceObserver[] = [];

  // 观察 FCP
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        callback({
          name: 'FCP',
          value: entry.startTime,
          delta: entry.startTime,
          id: 'fcp',
          entries: [entry],
        });
      }
    }
  });
  fcpObserver.observe({ type: 'paint', buffered: true });
  observers.push(fcpObserver);

  // 观察 LCP
  if ('LargestContentfulPaint' in window) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        delta: lastEntry.startTime,
        id: 'lcp',
        entries,
      });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    observers.push(lcpObserver);
  }

  // 观察 FID
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fpEntry = entry as PerformanceEventTiming;
      callback({
        name: 'FID',
        value: fpEntry.processingStart - fpEntry.startTime,
        delta: fpEntry.processingStart - fpEntry.startTime,
        id: 'fid',
        entries: [entry],
      });
    }
  });
  fidObserver.observe({ type: 'first-input', buffered: true });
  observers.push(fidObserver);

  // 观察 CLS
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as any;
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value;
        clsEntries.push(entry);
      }
    }
  });
  clsObserver.observe({ type: 'layout-shift', buffered: true });
  observers.push(clsObserver);

  // 返回清理函数
  return () => {
    observers.forEach(observer => observer.disconnect());
  };
}

/**
 * 性能指标评分
 * 基于 Core Web Vitals 标准
 */
export function getPerformanceScore(): {
  score: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  details: {
    fcp: { score: number; rating: string };
    lcp: { score: number; rating: string };
    fid: { score: number; rating: string };
    cls: { score: number; rating: string };
  };
} {
  const metrics = getPerformanceMetrics();
  if (!metrics) {
    return {
      score: 0,
      rating: 'needs-improvement',
      details: {
        fcp: { score: 0, rating: 'unknown' },
        lcp: { score: 0, rating: 'unknown' },
        fid: { score: 0, rating: 'unknown' },
        cls: { score: 0, rating: 'unknown' },
      },
    };
  }

  // FCP 评分 (Good: < 1.8s, Poor: > 3.0s)
  const fcpScore = metrics.firstContentfulPaint < 1800 ? 100 :
                   metrics.firstContentfulPaint < 3000 ? 50 : 0;
  const fcpRating = metrics.firstContentfulPaint < 1800 ? 'good' :
                    metrics.firstContentfulPaint < 3000 ? 'needs-improvement' : 'poor';

  // LCP 评分 (Good: < 2.5s, Poor: > 4.0s)
  const lcpScore = metrics.largestContentfulPaint < 2500 ? 100 :
                   metrics.largestContentfulPaint < 4000 ? 50 : 0;
  const lcpRating = metrics.largestContentfulPaint < 2500 ? 'good' :
                    metrics.largestContentfulPaint < 4000 ? 'needs-improvement' : 'poor';

  // FID 评分 (Good: < 100ms, Poor: > 300ms)
  const fidScore = metrics.firstInputDelay < 100 ? 100 :
                   metrics.firstInputDelay < 300 ? 50 : 0;
  const fidRating = metrics.firstInputDelay < 100 ? 'good' :
                    metrics.firstInputDelay < 300 ? 'needs-improvement' : 'poor';

  // CLS 评分 (Good: < 0.1, Poor: > 0.25)
  const clsScore = metrics.cumulativeLayoutShift < 0.1 ? 100 :
                   metrics.cumulativeLayoutShift < 0.25 ? 50 : 0;
  const clsRating = metrics.cumulativeLayoutShift < 0.1 ? 'good' :
                    metrics.cumulativeLayoutShift < 0.25 ? 'needs-improvement' : 'poor';

  // 综合评分
  const overallScore = Math.round((fcpScore + lcpScore + fidScore + clsScore) / 4);
  const overallRating = overallScore >= 90 ? 'good' :
                        overallScore >= 50 ? 'needs-improvement' : 'poor';

  return {
    score: overallScore,
    rating: overallRating,
    details: {
      fcp: { score: fcpScore, rating: fcpRating },
      lcp: { score: lcpScore, rating: lcpRating },
      fid: { score: fidScore, rating: fidRating },
      cls: { score: clsScore, rating: clsRating },
    },
  };
}

/**
 * 格式化性能指标为可读字符串
 */
export function formatPerformanceMetrics(): string {
  const metrics = getPerformanceMetrics();
  if (!metrics) {
    return '性能指标不可用';
  }

  return `
页面加载时间: ${(metrics.pageLoadTime / 1000).toFixed(2)}s
首次内容绘制 (FCP): ${(metrics.firstContentfulPaint / 1000).toFixed(2)}s
最大内容绘制 (LCP): ${(metrics.largestContentfulPaint / 1000).toFixed(2)}s
首次输入延迟 (FID): ${metrics.firstInputDelay.toFixed(0)}ms
累积布局偏移 (CLS): ${metrics.cumulativeLayoutShift.toFixed(4)}
交互到绘制时间 (TTI): ${(metrics.timeToInteractive / 1000).toFixed(2)}s
  `.trim();
}
