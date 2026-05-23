import React, { useMemo } from 'react';
import { BookOpen, CheckSquare, Clock, MessageSquare, Star, Users } from 'lucide-react';
import './SubPages.css';

const readStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (error) {
    return fallback;
  }
};

const Dashboard = () => {
  const user = readStorage('userInfo', { username: 'student' });
  const groups = readStorage('studyconnectGroups', []);
  const tasks = readStorage('studyconnectTasks', []);
  const timetable = readStorage('studyconnectTimetable', []);
  const messages = readStorage('studyconnectMessages', {});

  const stats = useMemo(() => {
    const messageCount = Object.values(messages).flat().length;
    const openTasks = tasks.filter(task => !task.done).length;
    return [
      { title: 'Groups', val: groups.length || 2, sub: 'active study spaces', icon: <Users size={18} /> },
      { title: 'Open Tasks', val: openTasks || 2, sub: 'assignments to complete', icon: <CheckSquare size={18} /> },
      { title: 'Weekly Sessions', val: timetable.length || 2, sub: 'planned timetable rows', icon: <Clock size={18} /> },
      { title: 'Messages', val: messageCount || 4, sub: 'chat notes saved', icon: <MessageSquare size={18} /> }
    ];
  }, [groups.length, messages, tasks, timetable.length]);

  return (
    <main className="sc-page-content">
      <header className="page-header">
        <div>
          <h1>Academic Overview</h1>
          <p className="text-dim">Welcome back, {user.username || user.name || 'student'}.</p>
        </div>
      </header>

      <div className="pro-grid">
        {stats.map(stat => (
          <article className="pro-card metric-card" key={stat.title}>
            <div className="icon-box">{stat.icon}</div>
            <h3>{stat.title}</h3>
            <h2>{stat.val}</h2>
            <p className="text-dim">{stat.sub}</p>
          </article>
        ))}
      </div>

      <section className="dashboard-split">
        <article className="pro-card">
          <div className="card-heading">
            <h3>Today</h3>
            <BookOpen size={18} />
          </div>
          <p>Use the timetable to plan your sessions, then track assignment progress in Tasks.</p>
        </article>
        <article className="pro-card">
          <div className="card-heading">
            <h3>Study Momentum</h3>
            <Star size={18} />
          </div>
          <p>Complete tasks and stay active in your groups to keep your academic workspace current.</p>
        </article>
      </section>
    </main>
  );
};

export default Dashboard;
