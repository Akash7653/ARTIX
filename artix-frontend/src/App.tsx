import { useState, useEffect } from 'react';
import { RegistrationPage } from './components/RegistrationPage';
import { AdminScanner } from './components/AdminScanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './lib/api';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keep-alive ping to prevent Render backend from sleeping
  useEffect(() => {
    // Ping immediately on app load
    api.keepAlive();

    // Then ping every 10 minutes (600000 ms) to keep backend awake
    const keepAliveInterval = setInterval(() => {
      api.keepAlive();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(keepAliveInterval);
  }, []);

  // Route Handler
  const renderContent = () => {
    if (currentPath === '/admin-scan') {
      return <AdminScanner />;
    } else {
      // Default to registration page (home page)
      return <RegistrationPage fromLandingPage={false} />;
    }
  };

  return (
    <ErrorBoundary>
      {renderContent()}
    </ErrorBoundary>
  );
}

export default App;
