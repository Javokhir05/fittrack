import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

// The real credentials are httpOnly cookies. This flag is only a non-secret hint
// ("this browser has signed in before") so visitors who never logged in (e.g. on the
// landing page) don't trigger pointless /auth/me and /auth/refresh calls.
const HINT_KEY = 'ft_session';

function hasHint() {
  try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; }
}
function setHint() {
  try { localStorage.setItem(HINT_KEY, '1'); } catch { /* storage unavailable */ }
}
function clearHint() {
  try { localStorage.removeItem(HINT_KEY); } catch { /* storage unavailable */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Tokens used to live in localStorage; remove any left over from older versions.
    try { localStorage.removeItem('token'); } catch { /* storage unavailable */ }

    function onExpired() {
      if (!hasHint()) return; // never signed in here, nothing "expired"
      clearHint();
      setUser(null);
      setSessionExpired(true);
    }
    window.addEventListener('auth:expired', onExpired);

    if (hasHint()) {
      api.auth.me()
        .then((res) => setUser(res.data.user))
        .catch(() => { /* a failed refresh already fired auth:expired */ })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  async function login(email, password) {
    const res = await api.auth.login({ email, password });
    setUser(res.data.user);
    setHint();
    setSessionExpired(false);
  }

  async function register(email, password, name) {
    await api.auth.register({ email, password, name });
    await login(email, password);
  }

  function logout() {
    setUser(null);
    clearHint();
    setSessionExpired(false);
    api.auth.logout().catch(() => { /* cookies expire on their own */ });
  }

  return (
    <AuthContext.Provider value={{ user, loading, sessionExpired, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}