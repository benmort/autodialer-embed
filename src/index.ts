import './styles.css';
import './web-components/AutodialerWidget';
import { AutodialerService } from './services/AutodialerService';
import { AutodialerConfig } from './types';

// Export types and classes for programmatic usage
export { AutodialerService } from './services/AutodialerService';
export { WebRTCService } from './services/WebRTCService';
export { PusherService } from './services/PusherService';
export { DialerInterface } from './components/DialerInterface';
export * from './types';

// Global initialization function for easy embedding
declare global {
  interface Window {
    AutodialerEmbed: {
      init: (config: AutodialerConfig, containerId: string) => AutodialerService;
      createWidget: (config: AutodialerConfig) => AutodialerService;
    };
  }
}

// Initialize global API
window.AutodialerEmbed = {
  init: (config: AutodialerConfig, containerId: string): AutodialerService => {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    const service = new AutodialerService(config);
    
    // Create React root and render
    const { createRoot } = require('react-dom/client');
    const React = require('react');
    const { DialerInterface } = require('./components/DialerInterface');
    
    const root = createRoot(container);
    root.render(React.createElement(DialerInterface, { service }));
    
    return service;
  },

  createWidget: (config: AutodialerConfig): AutodialerService => {
    return new AutodialerService(config);
  }
};

// Auto-initialize any existing autodialer-widget elements
document.addEventListener('DOMContentLoaded', () => {
  const widgets = document.querySelectorAll('autodialer-widget');
  widgets.forEach(widget => {
    // Widget will auto-initialize via connectedCallback
    console.log('Found autodialer-widget:', widget);
  });
});

// Also check for widgets added dynamically
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.tagName === 'AUTODIALER-WIDGET') {
          console.log('Dynamic autodialer-widget detected:', element);
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
