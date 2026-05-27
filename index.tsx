
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ExternalPortalApp from './views/ExternalPortalApp';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const pathname = window.location.pathname.toLowerCase();
const isExternalPortal =
  pathname.startsWith('/protocolo-digital') ||
  pathname.startsWith('/portal-externo') ||
  pathname.startsWith('/portalexterno');

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isExternalPortal ? <ExternalPortalApp /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);
