import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.get('/api/dashboard');
        setData(res.data);
      } catch (err) {
        setError('Could not load dashboard — please log in again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  }

  return (
    // Outer container: responsive padding from mobile (p-4) to desktop (p-8)
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 antialiased">
      {/* Main Card: fluid max-width from small to extra-large screens */}
      <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-8">
        
        {/* Header: Stacks vertically on tiny screens, flex row on sm+ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Welcome back to your overview</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-center"
          >
            Log Out
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="mt-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-10 text-slate-500 text-sm">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading dashboard data...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs sm:text-sm text-red-800">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Data Grid: 1 column on mobile, 2 columns on tablet/desktop */}
          {!loading && !error && data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Message
                </span>
                <p className="text-slate-800 text-sm sm:text-base font-medium mt-1 break-words">
                  {data.message}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  User ID
                </span>
                <p className="font-mono text-xs sm:text-sm font-bold text-blue-600 mt-1 break-all">
                  {data.userId}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}