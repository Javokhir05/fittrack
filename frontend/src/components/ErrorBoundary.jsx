import { Component } from 'react';

/**
 * Catches render errors anywhere below it so one bad component or API response
 * cannot white-screen the whole app (TD-05).
 * Uses plain <a> links (not react-router) so it also works when mounted outside the router.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook for an error tracker (e.g. Sentry) later; for now keep it in the console.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: this.props.fullPage ? '100vh' : '60vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div className="card" style={{ maxWidth: 440 }}>
          <div style={{ fontSize: '2.2rem' }} aria-hidden="true">⚠️</div>
          <h2 style={{ margin: '0.6rem 0' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text2)', marginBottom: '1.4rem' }}>
            An unexpected error occurred. Your data is safe — reloading the page usually fixes it.
          </p>
          <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <a className="btn btn-ghost" href="/" style={{ color: 'var(--text)' }}>
              Go to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}