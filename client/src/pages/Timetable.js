import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Save } from 'lucide-react';
import './SubPages.css';

const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const defaultSchedule = [
  { id: 1, time: '08:00 - 09:00', mon: 'Maths', tue: 'Physics', wed: 'Maths', thu: 'English', fri: 'Lab' },
  { id: 2, time: '10:00 - 11:00', mon: 'Biology', tue: 'Study Group', wed: 'Chemistry', thu: 'Maths', fri: 'Revision' }
];

const Timetable = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [schedule, setSchedule] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studyconnectTimetable')) || defaultSchedule;
    } catch (error) {
      return defaultSchedule;
    }
  });

  useEffect(() => {
    localStorage.setItem('studyconnectTimetable', JSON.stringify(schedule));
  }, [schedule]);

  const updateCell = (rowId, field, value) => {
    setSchedule(prev => prev.map(row => row.id === rowId ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setSchedule(prev => [...prev, { id: Date.now(), time: '12:00 - 13:00', mon: '', tue: '', wed: '', thu: '', fri: '' }]);
    setIsEditing(true);
  };

  return (
    <main className="sc-page-content">
      <header className="page-header">
        <div>
          <h1>Academic Timetable</h1>
          <p className="text-dim">Plan study sessions and class work for the week.</p>
        </div>
        <div className="row-actions">
          <button className="btn-pill-green" type="button" onClick={addRow}><Plus size={18} /> Row</button>
          <button className="btn-pill-green" type="button" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <><Save size={18} /> Save</> : <><Edit2 size={18} /> Edit</>}
          </button>
        </div>
      </header>

      <div className="table-wrapper">
        <table className="sc-table-ui">
          <thead>
            <tr>
              <th>Time Slot</th>
              {labels.map(label => <th key={label}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {schedule.map(row => (
              <tr key={row.id}>
                <td>
                  {isEditing ? <input className="table-input" value={row.time} onChange={(event) => updateCell(row.id, 'time', event.target.value)} /> : <strong>{row.time}</strong>}
                </td>
                {days.map(day => (
                  <td key={day}>
                    {isEditing ? <input className="table-input" value={row[day]} onChange={(event) => updateCell(row.id, day, event.target.value)} /> : row[day]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Timetable;
