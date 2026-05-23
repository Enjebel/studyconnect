import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import './SubPages.css';

const defaultTasks = [
  { id: 1, title: 'Submit Physics Report', course: 'Physics', priority: 'High', done: false },
  { id: 2, title: 'Revise matrix transformations', course: 'Mathematics', priority: 'Medium', done: false }
];

const Tasks = () => {
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studyconnectTasks')) || defaultTasks;
    } catch (error) {
      return defaultTasks;
    }
  });
  const [draft, setDraft] = useState({ title: '', course: '', priority: 'Medium' });

  useEffect(() => {
    localStorage.setItem('studyconnectTasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setTasks(prev => [
      { id: Date.now(), title: draft.title.trim(), course: draft.course.trim() || 'General', priority: draft.priority, done: false },
      ...prev
    ]);
    setDraft({ title: '', course: '', priority: 'Medium' });
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, done: !task.done } : task));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  return (
    <main className="sc-page-content">
      <header className="page-header">
        <div>
          <h1>Academic Tasks</h1>
          <p className="text-dim">{tasks.filter(task => !task.done).length} open tasks</p>
        </div>
      </header>

      <form className="toolbar-form" onSubmit={addTask}>
        <input className="pro-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Task title" />
        <input className="pro-input" value={draft.course} onChange={(event) => setDraft({ ...draft, course: event.target.value })} placeholder="Course" />
        <select className="pro-input" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button className="btn-pill-green" type="submit"><Plus size={18} /> Add Task</button>
      </form>

      <div className="list-stack">
        {tasks.map(task => (
          <article className={`pro-card task-card ${task.done ? 'is-done' : ''}`} key={task.id}>
            <div>
              <h3>{task.title}</h3>
              <p className="text-dim">{task.course} - {task.priority} priority</p>
            </div>
            <div className="row-actions">
              <button className="btn-pill-green" type="button" onClick={() => toggleTask(task.id)}><Check size={16} /> {task.done ? 'Reopen' : 'Done'}</button>
              <button className="icon-danger" type="button" onClick={() => deleteTask(task.id)} aria-label="Delete task"><Trash2 size={18} /></button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Tasks;
