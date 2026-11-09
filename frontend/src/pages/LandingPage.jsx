import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/LandingPage.css';

const FEATURES = [
  {
    icon: '🏋️',
    title: 'Log every workout',
    text: 'Record a session with its exercises, sets, reps and weight. Everything is saved together, so a workout is never half-logged.',
  },
  {
    icon: '💪',
    title: 'A ready exercise catalog',
    text: 'Pick from a shared library of exercises instead of typing them out each time. Admins keep the catalog tidy and up to date.',
  },
  {
    icon: '📈',
    title: 'Track body progress',
    text: 'Add body-weight entries with notes over time, so you can see whether your training is actually working.',
  },
  {
    icon: '🔐',
    title: 'Private by default',
    text: 'Secure sign-in with JWT authentication. Your workouts and measurements belong to your account and nobody else’s.',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', text: 'Register with an email and password. It takes less than a minute.' },
  { n: '02', title: 'Log your training', text: 'Choose exercises from the catalog and record what you lifted.' },
  { n: '03', title: 'Watch yourself improve', text: 'Check your dashboard and progress log to see the numbers move.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const signedIn = Boolean(user);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand" aria-label="FitTrack home">⚡ FitTrack</Link>
          <nav className="lp-nav-links" aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </nav>
          <div className="lp-nav-actions">
            {signedIn ? (
              <Link to="/dashboard" className="btn btn-primary">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="lp-signin">Sign in</Link>
                <Link to="/register" className="btn btn-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-eyebrow">Health &amp; fitness tracker</span>
              <h1>
                Log the work.<br />
                <span className="lp-accent">See the progress.</span>
              </h1>
              <p className="lp-lead">
                FitTrack keeps your workouts, exercises and body-weight progress in one place —
                simple enough to use between sets, clear enough to show you where you’re headed.
              </p>
              <div className="lp-cta-row">
                {signedIn ? (
                  <Link to="/dashboard" className="btn btn-primary lp-btn-lg">Go to your dashboard →</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary lp-btn-lg">Start tracking →</Link>
                    <Link to="/login" className="btn btn-ghost lp-btn-lg">Sign in</Link>
                  </>
                )}
              </div>
              <ul className="lp-points">
                <li>Workouts</li>
                <li>Exercise catalog</li>
                <li>Progress log</li>
              </ul>
            </div>

            <AppPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head">
              <span className="lp-eyebrow">Features</span>
              <h2>Everything you need, nothing you don’t</h2>
              <p>A focused toolkit for people who want to train consistently and measure it.</p>
            </div>
            <div className="lp-feature-grid">
              {FEATURES.map((f) => (
                <article key={f.title} className="card lp-feature">
                  <div className="lp-feature-icon" aria-hidden="true">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="lp-section lp-section-alt">
          <div className="lp-container">
            <div className="lp-section-head">
              <span className="lp-eyebrow">How it works</span>
              <h2>From sign-up to first logged workout in three steps</h2>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s) => (
                <li key={s.n} className="lp-step">
                  <span className="lp-step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Final CTA */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-final card">
              <h2>Ready for your first logged workout?</h2>
              <p>Create an account and start building your training history today.</p>
              <div className="lp-cta-row lp-cta-center">
                {signedIn ? (
                  <Link to="/dashboard" className="btn btn-primary lp-btn-lg">Go to your dashboard →</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary lp-btn-lg">Create your account →</Link>
                    <Link to="/login" className="btn btn-ghost lp-btn-lg">I already have one</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span className="lp-brand">⚡ FitTrack</span>
          <span className="lp-footer-note">© {new Date().getFullYear()} FitTrack. Train. Track. Improve.</span>
        </div>
      </footer>
    </div>
  );
}

/* Decorative, static illustration of the dashboard — not real user data. */
function AppPreview() {
  return (
    <div className="lp-preview" aria-hidden="true">
      <div className="lp-preview-glow" />
      <div className="lp-window">
        <div className="lp-window-bar">
          <i /><i /><i />
          <span>dashboard</span>
        </div>
        <div className="lp-window-body">
          <div className="lp-stats">
            <div><b>12</b><small>Workouts</small></div>
            <div><b>8</b><small>Entries</small></div>
            <div><b>6</b><small>Exercises</small></div>
          </div>
          <div className="lp-log">
            <div className="lp-log-head"><span>Progress log</span><em>sample</em></div>
            <div><span>Mon</span><b>72.4 kg</b></div>
            <div><span>Fri</span><b>72.0 kg</b></div>
            <div><span>Mon</span><b>71.6 kg</b></div>
          </div>
          <div className="lp-rows">
            <div><span>Bench press</span><code>4 × 8</code></div>
            <div><span>Back squat</span><code>5 × 5</code></div>
            <div><span>Deadlift</span><code>3 × 5</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
