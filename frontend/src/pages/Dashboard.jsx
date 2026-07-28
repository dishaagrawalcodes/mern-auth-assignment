import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/api/dashboard');
        setData(res.data);
      } catch (err) {
        setError('Could not load dashboard - please log in again');
      }
    }
    fetchDashboard();
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ padding: '40px' }}>
      <h2>Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data && (
        <>
          <p>{data.message}</p>
          <p>Your user ID: {data.userId}</p>
        </>
      )}
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}