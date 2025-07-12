import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error tracking (optional)
if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
  import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing(),
      ],
      tracesSampleRate: 0.1,
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
