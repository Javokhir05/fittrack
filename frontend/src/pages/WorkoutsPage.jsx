import { useEffect, useState } from 'react';
import { api } from '../api/client';

const EMPTY_FORM = { name: '', notes: '', isPublic: false };

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
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

  function startEdit(w) {
    setEditingId(w.id);
    setForm({ name: w.name, notes: w.notes || '', isPublic: w.isPublic });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await api.workouts.update(editingId, form);
      } else {
        await api.workouts.create(form);
      }
      cancelForm();
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Workouts</h1>
          <p>Log and manage your training sessions</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Workout</button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Workout' : 'New Workout'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <textarea
                className="input"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={5}
                placeholder="Write your workout notes here... Press Enter for new lines."
                style={{ resize: 'vertical', lineHeight: '1.6', fontFamily: 'var(--font)' }}
              />
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="public"
                checked={form.isPublic}
                onChange={e => setForm({ ...form, isPublic: e.target.checked })}
              />
              <label htmlFor="public" className="label" style={{ margin: 0 }}>Make public</label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : editingId ? 'Update Workout' : 'Save Workout'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cancelForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {workouts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', padding: '3rem' }}>
          No workouts yet. Log your first session!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {workouts.map(w => (
            <div key={w.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{w.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {new Date(w.date).toLocaleDateString()} · {w.exercises?.length ?? 0} exercises
                    {w.isPublic && <span style={{ marginLeft: '0.5rem', color: 'var(--accent)' }}>· public</span>}
                  </div>
                  {w.notes && (
                    <div style={{
                      color: 'var(--text2)',
                      fontSize: '0.88rem',
                      marginTop: '0.6rem',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.7',
                      background: 'var(--bg3)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      borderLeft: '3px solid var(--border)',
                    }}>
                      {w.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => startEdit(w)}
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(w.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
