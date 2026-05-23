import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import NavigationRail from './components/NavigationRail';
import ChatSystem from './pages/ChatSystem';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import Timetable from './pages/Timetable';
import './Global.css';

const AppContent = ({ theme, setTheme }) => {
  const location = useLocation();
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);
  const isLoggedIn = Boolean(localStorage.getItem('userInfo'));

  const getActive = () => {
    if (location.pathname === '/') return 'dashboard';
    return location.pathname.replace('/', '') || 'dashboard';
  };

  if (isAuthRoute) {
    if (isLoggedIn) {
      return <Navigate to="/" replace />;
    }

    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-main-container" data-theme={theme}>
      <NavigationRail active={getActive()} theme={theme} setTheme={setTheme} />
      <div className="content-view-area">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatSystem />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState('dark');

  return (
    <Router>
      <AppContent theme={theme} setTheme={setTheme} />
    </Router>
  );
}

export default App;
