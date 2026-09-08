import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ROLE_LABELS, ROLES } from '../lib/constants';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'student';
  const mode = searchParams.get('mode') || 'login'; // 'login' or 'register'

  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [role] = useState(roleParam);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Registration (students only for now)
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        if (role === ROLES.STUDENT && (!regNo.trim() || !cgpa.trim())) {
          setError('Registration number and CGPA are required for students.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const userData = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          reg_no: regNo.trim(),
          cgpa: parseFloat(cgpa),
        });
        toast.success(`Welcome, ${userData.name}!`);
        navigate(`/${userData.role}/dashboard`);
      } else {
        // Login
        if (!email.trim() || !password.trim()) {
          setError('Please enter your email and password.');
          setLoading(false);
          return;
        }

        const userData = await login(email.trim().toLowerCase(), password);
        toast.success(`Welcome back, ${userData.name}!`);
        navigate(`/${userData.role}/dashboard`);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = ROLE_LABELS[role] || 'User';
  const canRegister = role === ROLES.STUDENT; // Only students can self-register

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in-up">
        {/* Back link */}
        <Link to="/" className="auth-back">
          <ArrowLeft size={14} />
          Back
        </Link>

        {/* Header */}
        <div className="auth-header">
          <img src="/logo.png" alt="CapstoneDesk" className="landing-logo" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {isRegister ? `Create ${roleLabel} Account` : `${roleLabel} Sign In`}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {isRegister
              ? 'Enter your college details to get started'
              : 'Enter your credentials to continue'
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Registration-only fields */}
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              {role === ROLES.STUDENT && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label form-label-required" htmlFor="auth-reg">Registration No.</label>
                    <input
                      id="auth-reg"
                      type="text"
                      className="form-input"
                      placeholder="e.g., 21BCE1234"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required" htmlFor="auth-cgpa">CGPA</label>
                    <input
                      id="auth-cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="form-input"
                      placeholder="e.g., 8.5"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="auth-email">
              {role === ROLES.STUDENT ? 'College Email' : 'Email'}
            </label>
            <input
              id="auth-email"
              type="email"
              className={`form-input ${error ? 'form-input-error' : ''}`}
              placeholder={role === ROLES.STUDENT ? 'your.name@college.edu' : 'email@university.edu'}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${error ? 'form-input-error' : ''}`}
                placeholder={isRegister ? 'Min 6 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem',
                  display: 'flex',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            id="auth-submit-btn"
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {isRegister ? 'Creating account…' : 'Signing in…'}
              </>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Toggle login/register */}
        {canRegister && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                {isRegister ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Spin animation for loader */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
