import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', notes: '', isPublic: false });
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await api.workouts.list();
      setWorkouts(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.workouts.create(form);
      setForm({ name: '', notes: '', isPublic: false });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this workout?')) return;
    try {
      await api.workouts.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h1>Workouts</h1>
          <p>Log and manage your training sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Workout'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{marginBottom: '1.5rem'}}>
          <h3 style={{marginBottom: '1rem'}}>New Workout</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <input className="input" value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
            <div className="form-group" style={{flexDirection:'row', alignItems:'center', gap:'0.5rem'}}>
              <input type="checkbox" id="public" checked={form.isPublic}
                onChange={e => setForm({...form, isPublic: e.target.checked})} />
              <label htmlFor="public" className="label" style={{margin:0}}>Make public</label>
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Workout'}
            </button>
          </form>
        </div>
      )}

      {workouts.length === 0 ? (
        <div className="card" style={{textAlign:'center', color:'var(--text2)', padding:'3rem'}}>
          No workouts yet. Log your first session!
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
          {workouts.map(w => (
            <div key={w.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600}}>{w.name}</div>
                <div style={{color:'var(--text2)', fontSize:'0.85rem'}}>
                  {new Date(w.date).toLocaleDateString()} · {w.exercises?.length ?? 0} exercises
                  {w.isPublic && <span style={{marginLeft:'0.5rem', color:'var(--accent)'}}>· public</span>}
                </div>
                {w.notes && <div style={{color:'var(--text2)', fontSize:'0.85rem', marginTop:'0.25rem'}}>{w.notes}</div>}
              </div>
              <button className="btn btn-danger" onClick={() => handleDelete(w.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
