import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Route guard that ensures user is authenticated and has the required role.
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string|string[]} [props.roles] - Required role(s). If omitted, any authenticated user passes.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Still loading auth state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-page)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton skeleton-avatar" style={{ margin: '0 auto 1rem' }} />
          <div className="skeleton skeleton-text" style={{ width: '120px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role check
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to their own dashboard
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    }
  }

  return children;
}
