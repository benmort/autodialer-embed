import React from 'react';
import { createRoot } from 'react-dom/client';
import { Homepage } from './pages/Homepage';
import './styles.css';

// Import the widget component to ensure it's registered
import './web-components/AutodialerWidget';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(React.createElement(Homepage));
