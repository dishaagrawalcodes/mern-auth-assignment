import { createContext, useContext, useState, useEffect } from 'react';
import api, { rawAxios, setAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  // On first load, try to silently refresh - if the user has a valid
  // refresh cookie from a previous session, this logs them back in
  // without needing to re-enter credentials.
  useEffect(() => {
    async function tryRestoreSession() {
      try {
        const res = await rawAxios.post('/api/auth/refresh');
        setAccessToken(res.data.accessToken);
        // We don't get user info back from /refresh, so fetch it via dashboard
        // (in a bigger app you'd have a dedicated /api/auth/me endpoint)
        setUser({ loggedIn: true });
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    tryRestoreSession();
  }, []);

  async function signup(email, password) {
    const res = await api.post('/api/auth/signup', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }

  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}