import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { HackathonProvider } from './context/HackathonContext.jsx';
import { initModalScrollLockObserver } from './utils/scrollLock.js';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient.js';
import router from './router.jsx';

// Initialize automatic DOM observer to lock background scrolling whenever a modal is open
initModalScrollLockObserver();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HackathonProvider>
        <RouterProvider router={router} />
      </HackathonProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
