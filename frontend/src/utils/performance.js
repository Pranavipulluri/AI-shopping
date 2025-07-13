class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Custom metrics
    this.measureApiPerformance();
    this.measureRenderPerformance();
  }

  measureApiPerformance() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const response = await originalFetch(...args);
      const endTime = performance.now();
      
      const url = args[0];
      const duration = endTime - startTime;
      
      this.trackApiCall(url, duration, response.status);
      
      return response;
    };
  }

  measureRenderPerformance() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        this.metrics.pageLoad = perfData.loadEventEnd - perfData.fetchStart;
        this.metrics.domReady = perfData.domContentLoadedEventEnd - perfData.fetchStart;
      });
    }
  }

  trackApiCall(url, duration, status) {
    if (!this.metrics.apiCalls) {
      this.metrics.apiCalls = [];
    }
    
    this.metrics.apiCalls.push({
      url,
      duration,
      status,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connectionType: navigator.connection?.effectiveType || 'unknown'
    };
  }

  sendMetrics() {
    const metrics = this.getMetrics();
    
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'performance_metrics', metrics);
    }
    
    // Or send to custom endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    }).catch(console.error);
  }
}

export default new PerformanceMonitor();