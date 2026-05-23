import React, { useEffect, useState } from 'react';
import { Lock, Plus, Unlock, Users } from 'lucide-react';
import './SubPages.css';

const defaultGroups = [
  { id: 1, name: 'Advanced Mathematics', subject: 'Science', description: 'Problem solving and weekly revision.', privacy: 'public', members: 4, joined: true },
  { id: 2, name: 'Physics Lab Team', subject: 'Physics', description: 'Lab reports, experiments, and prep notes.', privacy: 'private', members: 6, joined: false }
];

const Groups = () => {
  const [groups, setGroups] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studyconnectGroups')) || defaultGroups;
    } catch (error) {
      return defaultGroups;
    }
  });
  const [draft, setDraft] = useState({ name: '', subject: '', description: '', privacy: 'public' });

  useEffect(() => {
    localStorage.setItem('studyconnectGroups', JSON.stringify(groups));
  }, [groups]);

  const createGroup = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setGroups(prev => [
      { id: Date.now(), ...draft, name: draft.name.trim(), subject: draft.subject.trim() || 'General', members: 1, joined: true },
      ...prev
    ]);
    setDraft({ name: '', subject: '', description: '', privacy: 'public' });
  };

  const toggleJoin = (groupId) => {
    setGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      const joined = !group.joined;
      return { ...group, joined, members: Math.max(1, group.members + (joined ? 1 : -1)) };
    }));
  };

  return (
    <main className="sc-page-content">
      <header className="page-header">
        <div>
          <h1>Study Groups</h1>
          <p className="text-dim">Create groups, join classmates, and organize shared study sessions.</p>
        </div>
      </header>

      <form className="toolbar-form" onSubmit={createGroup}>
        <input className="pro-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Group name" />
        <input className="pro-input" value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} placeholder="Subject" />
        <input className="pro-input" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" />
        <select className="pro-input" value={draft.privacy} onChange={(event) => setDraft({ ...draft, privacy: event.target.value })}>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <button className="btn-pill-green" type="submit"><Plus size={18} /> Create</button>
      </form>

      <div className="pro-grid">
        {groups.map(group => (
          <article className="pro-card" key={group.id}>
            <div className="card-heading">
              <div className="icon-box"><Users size={22} /></div>
              {group.privacy === 'private' ? <Lock size={18} /> : <Unlock size={18} />}
            </div>
            <h3>{group.name}</h3>
            <p className="text-dim">{group.subject} - {group.members} members</p>
            <p>{group.description}</p>
            <button className="btn-pill-green" type="button" onClick={() => toggleJoin(group.id)}>
              {group.joined ? 'Leave Group' : group.privacy === 'private' ? 'Request Access' : 'Join Group'}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Groups;
