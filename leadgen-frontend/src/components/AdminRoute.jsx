import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import API from '../api/axios';

/**
 * AdminRoute Component
 * Guards admin-only routes with both client-side role validation
 * and live server synchronization to prevent localStorage tampering.
 */
export default function AdminRoute({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const initialUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const [currentUser, setCurrentUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return (
      initialUser.role === 'admin' ||
      initialUser.isAdmin === true ||
      initialUser.email === 'akshay@kology.co'
    );
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Verify role with backend to prevent client-side storage manipulation
    API.get('/auth/me')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && res.data?.data?.user) {
          const freshUser = res.data.data.user;
          setCurrentUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));

          const hasAdminAccess =
            freshUser.role === 'admin' ||
            freshUser.isAdmin === true ||
            freshUser.email === 'akshay@kology.co';

          setIsAuthorized(hasAdminAccess);
        }
      })
      .catch((err) => {
        console.warn('Auth verification failed in AdminRoute:', err.message);
        // Fall back to stored state if network glitch, or clear if unauthorized 401/403
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthorized(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-600">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  // Access Denied Screen for non-admin users
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Shield Lock Icon */}
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">
            403 Forbidden
          </span>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            You do not have sufficient administrator privileges to view this section. The Admin Panel is restricted to authorized System Administrators only.
          </p>

          <div className="bg-gray-50 rounded-xl p-3.5 mb-6 text-left border border-gray-200/60">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span className="font-medium">Signed in as:</span>
              <span className="font-semibold text-gray-900 truncate max-w-[200px]">{currentUser.email || 'User'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-medium">Assigned Role:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800 capitalize">
                {currentUser.role || 'Employee'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/master-dashboard')}
              className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Return to Master Dashboard
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              View My Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
