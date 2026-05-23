import React, { useEffect, useState } from 'react';
import { Check, Edit3 } from 'lucide-react';
import './SubPages.css';

const Profile = () => {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('userInfo'));
      return {
        username: stored?.username || stored?.name || 'enjel',
        email: stored?.email || 'enjel@gmail.com',
        bio: stored?.bio || 'Focused on collaborative study and weekly revision.'
      };
    } catch (error) {
      return { username: 'enjel', email: 'enjel@gmail.com', bio: 'Focused on collaborative study and weekly revision.' };
    }
  });
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    const previous = JSON.parse(localStorage.getItem('userInfo') || '{}');
    localStorage.setItem('userInfo', JSON.stringify({ ...previous, ...user }));
  }, [user]);

  return (
    <main className="sc-page-content">
      <header className="page-header">
        <div>
          <h1>User Profile</h1>
          <p className="text-dim">Manage the identity used across StudyConnect.</p>
        </div>
      </header>

      <section className="profile-layout">
        <article className="pro-card profile-card">
          <div className="avatar-big">{(user.username || 'S')[0].toUpperCase()}</div>
          {edit ? (
            <div className="form-stack">
              <input className="pro-input" value={user.username} onChange={(event) => setUser({ ...user, username: event.target.value })} />
              <input className="pro-input" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} />
              <textarea className="pro-input" value={user.bio} onChange={(event) => setUser({ ...user, bio: event.target.value })} rows="4" />
            </div>
          ) : (
            <div>
              <h2>{user.username}</h2>
              <p className="text-dim">{user.email}</p>
              <p>{user.bio}</p>
            </div>
          )}
          <button className="btn-pill-green" type="button" onClick={() => setEdit(!edit)}>
            {edit ? <><Check size={18} /> Done</> : <><Edit3 size={18} /> Edit Profile</>}
          </button>
        </article>
      </section>
    </main>
  );
};

export default Profile;
