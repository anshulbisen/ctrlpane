import React from 'react';
import ReactDOM from 'react-dom/client';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <div>ctrlpane</div>
  </React.StrictMode>,
);
