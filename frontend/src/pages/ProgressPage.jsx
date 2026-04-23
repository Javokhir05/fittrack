import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function ProgressPage() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ weightKg: '', notes: '' });
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await api.progress.list();
      setEntries(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.progress.create({ weightKg: form.weightKg ? Number(form.weightKg) : undefined, notes: form.notes });
      setForm({ weightKg: '', notes: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.progress.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Progress</h1>
        <p>Track your body weight and notes over time</p>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{marginBottom: '1.5rem'}}>
        <h3 style={{marginBottom: '1rem'}}>Log Entry</h3>
        <form onSubmit={handleCreate} style={{display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'flex-end'}}>
          <div className="form-group" style={{margin:0, flex: '1 1 150px'}}>
            <label className="label">Weight (kg)</label>
            <input className="input" type="number" step="0.1" value={form.weightKg}
              onChange={e => setForm({...form, weightKg: e.target.value})} placeholder="70.5" />
          </div>
          <div className="form-group" style={{margin:0, flex: '2 1 200px'}}>
            <label className="label">Notes</label>
            <input className="input" value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})} placeholder="Feeling strong today" />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Log'}</button>
        </form>
      </div>

      {entries.length === 0 ? (
        <div className="card" style={{textAlign:'center', color:'var(--text2)', padding:'3rem'}}>No entries yet.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr><th>Date</th><th>Weight (kg)</th><th>Notes</th><th></th></tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td style={{fontFamily:'var(--mono)', fontSize:'0.85rem'}}>{new Date(e.date).toLocaleDateString()}</td>
                  <td style={{fontWeight: 600, color: 'var(--accent)'}}>{e.weightKg ?? '—'}</td>
                  <td style={{color:'var(--text2)'}}>{e.notes ?? '—'}</td>
                  <td><button className="btn btn-danger" onClick={() => handleDelete(e.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
