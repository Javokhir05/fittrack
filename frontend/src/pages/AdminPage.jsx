import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await api.users.list();
      setUsers(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleRole(user) {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    try {
      await api.users.updateRole(user.id, newRole);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage users and roles</p>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td style={{fontFamily:'var(--mono)', fontSize:'0.85rem', color:'var(--text2)'}}>{u.email}</td>
                <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                <td style={{color:'var(--text2)', fontSize:'0.85rem'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-ghost" onClick={() => toggleRole(u)}>
                    Make {u.role === 'ADMIN' ? 'User' : 'Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
