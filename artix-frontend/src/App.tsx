import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
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
    } else if (currentPath === '/register') {
      return <RegistrationPage fromLandingPage={true} />;
    } else {
      // Default to landing page for home and any other route
      return <LandingPage />;
    }
  };

  return (
    <ErrorBoundary>
      {renderContent()}
    </ErrorBoundary>
  );
}

export default App;
