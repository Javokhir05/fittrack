import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ExercisesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', muscleGroup: '' });
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await api.exercises.list();
      setExercises(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.exercises.create(form);
      setForm({ name: '', description: '', category: '', muscleGroup: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this exercise?')) return;
    try {
      await api.exercises.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h1>Exercises</h1>
          <p>Browse the exercise catalog{isAdmin && ' · Admin: create & delete'}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Exercise'}
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && isAdmin && (
        <div className="card" style={{marginBottom: '1.5rem'}}>
          <h3 style={{marginBottom: '1rem'}}>New Exercise</h3>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Category</label>
                <input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Muscle Group</label>
                <input className="input" value={form.muscleGroup} onChange={e => setForm({...form, muscleGroup: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Muscle Group</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {exercises.map(ex => (
              <tr key={ex.id}>
                <td><strong>{ex.name}</strong>{ex.description && <div style={{color:'var(--text2)',fontSize:'0.8rem'}}>{ex.description}</div>}</td>
                <td><span className="badge badge-user">{ex.category}</span></td>
                <td style={{color:'var(--text2)'}}>{ex.muscleGroup}</td>
                {isAdmin && <td><button className="btn btn-danger" onClick={() => handleDelete(ex.id)}>Delete</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
