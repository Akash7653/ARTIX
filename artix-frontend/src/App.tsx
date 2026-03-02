import { useState, useEffect } from 'react';
import { RegistrationPage } from './components/RegistrationPage';
import { AdminScanner } from './components/AdminScanner';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
