import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Calendar, Users, CheckSquare, Sun, User, LogOut } from 'lucide-react';

const NavigationRail = ({ active, theme, setTheme }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <nav className="navigation-rail" style={{ 
      width: '72px', height: '100vh', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', flexShrink: 0 
    }}>
      <div className="rail-logo" style={{ marginBottom: '20px', color: '#00a884', fontWeight: 'bold', fontSize: '1.2rem' }}>SC</div>
      
      <div className="rail-main" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {[
          { id: 'dashboard', icon: <LayoutDashboard size={20}/>, path: '/' },
          { id: 'chat', icon: <MessageSquare size={20}/>, path: '/chat' },
          { id: 'timetable', icon: <Calendar size={20}/>, path: '/timetable' },
          { id: 'groups', icon: <Users size={20}/>, path: '/groups' },
          { id: 'tasks', icon: <CheckSquare size={20}/>, path: '/tasks' }
        ].map(item => (
          <div key={item.id} onClick={() => navigate(item.path)} style={{ 
            cursor: 'pointer', color: active === item.id ? '#e9edef' : '#8696a0',
            background: active === item.id ? '#2a3942' : 'transparent',
            padding: '12px', borderRadius: '10px'
          }}>
            {item.icon}
          </div>
        ))}
      </div>

      {/* Bottom Icons - Unified & Dotted Top Border */}
      <div className="rail-bottom" style={{ 
        display: 'flex', flexDirection: 'column', gap: '15px', 
        borderTop: '1px solid #222d34', width: '100%', alignItems: 'center', paddingTop: '15px' 
      }}>
        <Sun size={20} color="#8696a0" style={{ cursor: 'pointer' }} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        <User size={20} color="#8696a0" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')} />
        <LogOut size={20} color="#ef4444" style={{ cursor: 'pointer', marginBottom: '10px' }} onClick={handleLogout} />
      </div>
    </nav>
  );
};

export default NavigationRail;
