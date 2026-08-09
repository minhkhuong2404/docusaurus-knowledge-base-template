// Polyfill window.gtag to prevent 'TypeError: window.gtag is not a function' in dev mode
// or when ad blockers prevent Google Tag Manager script from loading.
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  if (typeof (window as any).gtag !== 'function') {
    (window as any).gtag = function (...args: any[]) {
      window.dataLayer.push(args);
    };
  }
}

export {};
