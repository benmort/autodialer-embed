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

