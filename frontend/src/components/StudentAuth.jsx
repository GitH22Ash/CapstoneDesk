import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';

const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
);

const EyeToggle = ({ show, onToggle, id }) => (
    <button
        type="button"
        onClick={onToggle}
        title={show ? 'Hide password' : 'Show password'}
        id={id}
        style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '0',
            transition: 'color 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
    >
        {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
);

function StudentAuth() {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [groupName, setGroupName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!groupName.trim() || !password) {
            setError('Please fill out all fields.');
            return;
        }

        try {
            setLoading(true);
            const res = await API.post('/groups/login', {
                group_name: groupName,
                password,
            });
            sessionStorage.setItem('groupData', JSON.stringify(res.data));
            navigate('/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = (e) => {
        e.preventDefault();
        setError('');

        if (!groupName.trim()) {
            setError('Please enter a group name.');
            return;
        }
        if (!password || password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        sessionStorage.setItem('signupData', JSON.stringify({
            group_name: groupName,
            password,
        }));
        navigate('/student/signup/members');
    };

    return (
        <div className="page-container">
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', right: '-100px', background: 'rgba(59,130,246,0.3)' }} />

            <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Link to="/" className="back-link animate-fade-in">
                    ← Back to Home
                </Link>

                <div className="form-container animate-fade-in-up" style={{ width: '100%' }}>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        🎓 Student Portal
                    </h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        Sign up a new group or login to your existing group
                    </p>

                    {/* Toggle */}
                    <div className="toggle-group" style={{ marginBottom: '2rem' }}>
                        <button
                            className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setError(''); }}
                            id="student-login-toggle"
                        >
                            Group Login
                        </button>
                        <button
                            className={`toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => { setMode('signup'); setError(''); }}
                            id="student-signup-toggle"
                        >
                            Group Signup
                        </button>
                    </div>

                    {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                    <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label">Group Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter your group name"
                                id="student-group-name"
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    id="student-password"
                                    style={{ paddingRight: '3rem' }}
                                />
                                <EyeToggle
                                    show={showPassword}
                                    onToggle={() => setShowPassword(prev => !prev)}
                                    id="student-password-toggle"
                                />
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <div style={{ marginBottom: '1.25rem' }} className="animate-fade-in">
                                <label className="form-label">Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="form-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        id="student-confirm-password"
                                        style={{ paddingRight: '3rem' }}
                                    />
                                    <EyeToggle
                                        show={showConfirmPassword}
                                        onToggle={() => setShowConfirmPassword(prev => !prev)}
                                        id="student-confirm-password-toggle"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            id="student-submit-btn"
                            style={{ marginTop: '0.5rem' }}
                        >
                            {loading
                                ? 'Please wait...'
                                : mode === 'login'
                                    ? 'Login to Group'
                                    : 'Continue to Add Members →'
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default StudentAuth;
