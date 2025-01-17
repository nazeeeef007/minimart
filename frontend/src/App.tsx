import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';
import ResidentPage from '@/pages/ResidentPage';
import AdminPage from '@/pages/AdminPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  useEffect(() => {
    // Update role state when localStorage changes
    const handleStorageChange = () => {
      const updatedRole = localStorage.getItem('role');
      setRole(updatedRole);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        {role === 'resident' && <Route path="/resident" element={<ResidentPage />} />}
        {role === 'admin' && <Route path="/admin" element={<AdminPage />} />}
      </Routes>
    </Router>
  );
};

export default App;
