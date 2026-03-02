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

  const content = currentPath === '/admin-scan' ? <AdminScanner /> : <RegistrationPage />;

  return (
    <ErrorBoundary>
      {content}
    </ErrorBoundary>
  );
}

export default App;
