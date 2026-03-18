import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';

function SupervisorDashboard() {
    const [groups, setGroups] = useState([]);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [maxGroups, setMaxGroups] = useState(5);
    const [showPreferences, setShowPreferences] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/supervisor/login');
                return;
            }

            try {
                setLoading(true);
                const [groupsRes, prefRes] = await Promise.all([
                    API.get('/supervisors/my-groups'),
                    API.get('/supervisors/preferences')
                ]);
                setGroups(groupsRes.data || []);
                setMaxGroups(prefRes.data?.max_groups ?? 5);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError('Failed to load dashboard data. Please log in again.');
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handlePreferencesUpdate = async () => {
        try {
            setLoading(true);
            await API.put('/supervisors/preferences', { max_groups: maxGroups });
            setSuccess('Preferences updated successfully!');
            setShowPreferences(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update preferences.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkUpdate = async (student_reg_no, group_id, review_number, marks) => {
        try {
            await API.put('/supervisors/marks', {
                student_reg_no,
                group_id,
                review_number,
                marks: marks === '' ? null : Number(marks)
            });
            setError('');
        } catch (err) {
            console.error('Failed to update mark:', err);
            setError(`Failed to update mark for student ${student_reg_no}.`);
        }
    };

    const handleInputChange = (e, groupIndex, memberIndex, reviewNumber) => {
        const newGroups = [...groups];
        newGroups[groupIndex].members[memberIndex][`review${reviewNumber}_marks`] = e.target.value;
        setGroups(newGroups);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const toggleGroup = (groupId) => {
        setExpandedGroup(expandedGroup === groupId ? null : groupId);
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="bg-grid" />
                <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', right: '-100px', background: 'rgba(139,92,246,0.2)' }} />

            <div className="page-content" style={{ maxWidth: '960px', margin: '0 auto' }}>
                {/* Top bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                }} className="animate-fade-in">
                    <Link to="/" className="back-link" style={{ marginBottom: 0 }}>
                        ← Home
                    </Link>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => setShowPreferences(!showPreferences)}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                        >
                            ⚙ Preferences
                        </button>
                        <button className="logout-btn" onClick={handleLogout} id="supervisor-logout-btn">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>
                        Supervisor Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {groups.length} group{groups.length !== 1 ? 's' : ''} assigned to you
                    </p>
                </div>

                {/* Preferences Panel */}
                {showPreferences && (
                    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Group Preferences</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Maximum groups:</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={maxGroups}
                                onChange={(e) => setMaxGroups(parseInt(e.target.value) || 0)}
                                className="form-input"
                                style={{ width: '80px' }}
                            />
                            <button className="btn-success" onClick={handlePreferencesUpdate} style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                                Update
                            </button>
                            <button className="btn-secondary" onClick={() => setShowPreferences(false)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                Cancel
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                            Currently assigned: {groups.length} groups | Maximum: {maxGroups} groups
                        </p>
                    </div>
                )}

                {/* Alerts */}
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

                {/* Groups */}
                {groups.length === 0 ? (
                    <div className="empty-state animate-fade-in-up">
                        <div className="empty-state-icon">📋</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Currently no groups are assigned
                        </h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                            Check back later after the admin has assigned groups to you.
                        </p>
                    </div>
                ) : (
                    <div>
                        {groups.map((group, groupIndex) => (
                            <div key={group.group_id} className={`group-dropdown animate-fade-in-up delay-${Math.min(groupIndex + 1, 5)}`}>
                                <div
                                    className="group-dropdown-header"
                                    onClick={() => toggleGroup(group.group_id)}
                                    id={`group-toggle-${group.group_id}`}
                                >
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {group.group_name}
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                            {group.members.length} members
                                        </p>
                                    </div>
                                    <span style={{
                                        fontSize: '1.25rem',
                                        transition: 'transform 0.3s ease',
                                        transform: expandedGroup === group.group_id ? 'rotate(180deg)' : 'rotate(0deg)',
                                        color: 'var(--text-muted)',
                                    }}>
                                        ▾
                                    </span>
                                </div>

                                <div className={`group-dropdown-body ${expandedGroup === group.group_id ? 'open' : ''}`}>
                                    <div className="group-dropdown-content">
                                        {group.members.map((member, memberIndex) => (
                                            <div
                                                key={member.reg_no}
                                                style={{
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderRadius: '12px',
                                                    padding: '1.25rem',
                                                    marginBottom: memberIndex < group.members.length - 1 ? '0.75rem' : 0,
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                }}
                                            >
                                                {/* Student info row */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                                    gap: '1rem',
                                                    marginBottom: '1rem',
                                                }}>
                                                    <div>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</p>
                                                        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{member.name}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reg. No</p>
                                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{member.reg_no}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CGPA</p>
                                                        <p style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{member.cgpa}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.email || '—'}</p>
                                                    </div>
                                                </div>

                                                {/* Review marks row */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                                    gap: '0.75rem',
                                                    paddingTop: '1rem',
                                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                                }}>
                                                    {[1, 2, 3].map(reviewNumber => (
                                                        <div key={reviewNumber}>
                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                                                                Review {reviewNumber}
                                                            </p>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', textAlign: 'center' }}
                                                                value={member[`review${reviewNumber}_marks`] ?? ''}
                                                                onChange={(e) => handleInputChange(e, groupIndex, memberIndex, reviewNumber)}
                                                                onBlur={(e) => handleMarkUpdate(member.reg_no, group.group_id, reviewNumber, e.target.value)}
                                                                placeholder="—"
                                                                id={`mark-${group.group_id}-${member.reg_no}-r${reviewNumber}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupervisorDashboard;