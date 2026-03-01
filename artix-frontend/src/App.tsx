import { useState, useEffect } from 'react';
import { RegistrationPage } from './components/RegistrationPage';
import { AdminScanner } from './components/AdminScanner';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPath === '/admin-scan') {
    return <AdminScanner />;
  }

  return <RegistrationPage />;
}

export default App;
