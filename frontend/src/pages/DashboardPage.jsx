import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ workouts: 0, progress: 0, exercises: 0 });

  useEffect(() => {
    Promise.all([api.workouts.list(), api.progress.list(), api.exercises.list()])
      .then(([w, p, e]) => setStats({
        workouts: w.data?.length ?? 0,
        progress: p.data?.length ?? 0,
        exercises: e.data?.length ?? 0,
      }))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Hey, {user?.name} 👋</h1>
        <p>Here's your fitness overview</p>
      </div>
      <div className="grid-2" style={{gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem'}}>
        <StatCard label="Workouts Logged" value={stats.workouts} icon="🏋️" />
        <StatCard label="Progress Entries" value={stats.progress} icon="📈" />
        <StatCard label="Exercises Available" value={stats.exercises} icon="💪" />
      </div>
      {user?.role === 'ADMIN' && (
        <div className="card" style={{borderColor: 'rgba(212,255,78,0.3)'}}>
          <h2 style={{marginBottom: '0.5rem'}}>🔧 Admin Panel</h2>
          <p style={{color: 'var(--text2)'}}>You have admin access. Manage exercises and users from the Admin section.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card" style={{textAlign: 'center'}}>
      <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{icon}</div>
      <div style={{fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)'}}>{value}</div>
      <div style={{color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.25rem'}}>{label}</div>
    </div>
  );
}
