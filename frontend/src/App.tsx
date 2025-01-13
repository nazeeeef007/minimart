import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';
import ResidentPage from '@/pages/ResidentPage'; // Import the Resident page
// import AdminPage from '@/pages/AdminPage'; // Import the Admin page

const App: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Define the root route */}
        <Route path="/" element={<AuthPage />} />

        {/* Define the /auth route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Conditionally route based on role */}
        {role === 'resident' && <Route path="/resident" element={<ResidentPage />} />}
        {/* {role === 'admin' && <Route path="/admin" element={<AdminPage />} />} */}

        {/* Other routes */}
      </Routes>
    </Router>
  );
};

export default App;
