import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { HackathonProvider } from './context/HackathonContext.jsx';
import { initModalScrollLockObserver } from './utils/scrollLock.js';

// Initialize automatic DOM observer to lock background scrolling whenever a modal is open
initModalScrollLockObserver();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <HackathonProvider>
        <App />
      </HackathonProvider>
    </BrowserRouter>
  </React.StrictMode>
);
