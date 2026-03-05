import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Hide loader when app mounts
const loader = document.getElementById('app-loader');
if (loader) {
  // Add hidden class after a short delay to ensure smooth transition
  setTimeout(() => loader.classList.add('hidden'), 500);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
