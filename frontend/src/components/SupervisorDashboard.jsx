import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';
import VideoCall from './VideoCall';

function SupervisorDashboard() {
    const [groups, setGroups] = useState([]);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [maxGroups, setMaxGroups] = useState(3);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('groups');
    const navigate = useNavigate();

    // Change password state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Submissions state
    const [submissions, setSubmissions] = useState([]);
    const [summaryModal, setSummaryModal] = useState(null);
    const [summarizing, setSummarizing] = useState(false);

    // Video call state
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [activeCallGroup, setActiveCallGroup] = useState(null);
    const [supervisorId, setSupervisorId] = useState('');

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
                setMaxGroups(prefRes.data?.max_groups ?? 3);

                // Decode token to get supervisor ID
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setSupervisorId(payload.supervisor?.id || '');
                } catch (e) { console.error('Token parse warning:', e); }
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

    useEffect(() => {
        if (activeTab === 'submissions') fetchSubmissions();
    }, [activeTab]);

    const fetchSubmissions = async () => {
        try {
            const res = await API.get('/submissions/supervisor');
            setSubmissions(res.data);
        } catch (err) {
            console.error('Failed to fetch submissions:', err);
        }
    };

    const handlePreferencesUpdate = async () => {
        try {
            setLoading(true);
            await API.put('/supervisors/preferences', { max_groups: maxGroups });
            setSuccess('Preferences updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update preferences.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setError('');
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Please fill all password fields.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            await API.put('/supervisors/change-password', { currentPassword, newPassword });
            setSuccess('Password changed successfully!');
            setShowChangePassword(false);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = async (sub) => {
        setSummarizing(true);
        setSummaryModal({ ...sub, summary: null });
        try {
            const res = await API.post('/summarizer/summarize', {
                file_url: sub.file_url,
                file_name: sub.file_name,
                file_type: sub.file_type,
            });
            setSummaryModal(prev => ({ ...prev, summary: res.data.summary }));
        } catch (err) {
            setSummaryModal(prev => ({ ...prev, summary: 'Failed to generate summary. ' + (err.response?.data?.msg || '') }));
        } finally {
            setSummarizing(false);
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
        let val = e.target.value;
        if (val !== '') {
            val = Number(val);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
        }
        newGroups[groupIndex].members[memberIndex][`review${reviewNumber}_marks`] = val;
        setGroups(newGroups);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const toggleGroup = (groupId) => {
        setExpandedGroup(expandedGroup === groupId ? null : groupId);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading && groups.length === 0) {
        return (
            <div className="page-container">
                <div className="bg-grid" />
                <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const dashTabs = [
        { key: 'groups', label: '📋 My Groups' },
        { key: 'submissions', label: '📁 Submissions' },
        { key: 'settings', label: '⚙ Settings' },
    ];

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

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem',
                }}>
                    {dashTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            id={`sup-tab-${tab.key}`}
                            style={{
                                padding: '0.6rem 1.25rem', borderRadius: '10px',
                                background: activeTab === tab.key ? 'rgba(139,92,246,0.15)' : 'transparent',
                                border: activeTab === tab.key ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                                color: activeTab === tab.key ? '#a78bfa' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Alerts */}
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                    <>
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {group.group_name}
                                                    </h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                        {group.members.length} members
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveCallGroup(group);
                                                        setShowVideoCall(true);
                                                    }}
                                                    className="btn-success"
                                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                                >
                                                    📞 Call
                                                </button>
                                                <span style={{
                                                    fontSize: '1.25rem',
                                                    transition: 'transform 0.3s ease',
                                                    transform: expandedGroup === group.group_id ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    color: 'var(--text-muted)',
                                                }}>
                                                    ▾
                                                </span>
                                            </div>
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

                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                                            gap: '0.75rem',
                                                            paddingTop: '1rem',
                                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                                        }}>
                                                            {[1, 2, 3, 4].map(reviewNumber => (
                                                                <div key={reviewNumber}>
                                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                                                                        Review {reviewNumber}
                                                                    </p>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
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
                                                            {(() => {
                                                                const hasAllMarks = [1, 2, 3, 4].every(r => member[`review${r}_marks`] !== null && member[`review${r}_marks`] !== undefined && member[`review${r}_marks`] !== '');
                                                                if (!hasAllMarks) return null;
                                                                const avg = ([1, 2, 3, 4].reduce((sum, r) => sum + Number(member[`review${r}_marks`]), 0) / 4).toFixed(2);
                                                                return (
                                                                    <div>
                                                                        <p style={{ color: 'var(--accent-emerald)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 600 }}>
                                                                            Total Marks
                                                                        </p>
                                                                        <div className="form-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                                                                            {avg}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            📁 Student Submissions
                        </h2>
                        {submissions.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                No submissions received yet.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {submissions.map(sub => (
                                    <div key={sub.submission_id} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '12px', padding: '1rem',
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>
                                                {sub.file_type === 'pdf' ? '📄' : '📊'}
                                            </span>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.file_name}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    {sub.group_name} • {formatSize(sub.file_size)} • {formatDate(sub.uploaded_at)} • by {sub.uploader_name || sub.uploaded_by}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {sub.file_type === 'pdf' && (
                                                <button
                                                    onClick={() => handleSummarize(sub)}
                                                    className="btn-primary"
                                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                                    id={`summarize-${sub.submission_id}`}
                                                >
                                                    🤖 Summarize
                                                </button>
                                            )}
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                                className="btn-secondary"
                                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', textDecoration: 'none' }}>
                                                ⬇ Download
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Preferences */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>📋 Group Preferences</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Maximum groups:</label>
                                <input
                                    type="number" min="1" max="20"
                                    value={maxGroups}
                                    onChange={(e) => setMaxGroups(parseInt(e.target.value) || 0)}
                                    className="form-input"
                                    style={{ width: '80px' }}
                                />
                                <button className="btn-success" onClick={handlePreferencesUpdate}
                                    style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                                    Update
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                                Currently assigned: {groups.length} groups | Maximum: {maxGroups} groups
                            </p>
                        </div>

                        {/* Change Password */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>🔒 Change Password</h3>
                            {!showChangePassword ? (
                                <button
                                    className="btn-primary"
                                    onClick={() => setShowChangePassword(true)}
                                    id="show-change-password-btn"
                                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                                >
                                    Change Password
                                </button>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
                                    <div>
                                        <label className="form-label">Current Password</label>
                                        <input type="password" className="form-input" value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password" id="current-password" />
                                    </div>
                                    <div>
                                        <label className="form-label">New Password</label>
                                        <input type="password" className="form-input" value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters" id="new-password" />
                                    </div>
                                    <div>
                                        <label className="form-label">Confirm New Password</label>
                                        <input type="password" className="form-input" value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password" id="confirm-password" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="btn-success" onClick={handleChangePassword}
                                            disabled={loading} id="change-password-btn"
                                            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
                                            {loading ? 'Changing...' : 'Save Password'}
                                        </button>
                                        <button className="btn-secondary" onClick={() => {
                                            setShowChangePassword(false);
                                            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                                        }} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Modal */}
            {summaryModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1100,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem',
                }} onClick={() => setSummaryModal(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(20,20,35,0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px', padding: '2rem',
                            maxWidth: '700px', width: '100%', maxHeight: '80vh',
                            overflowY: 'auto',
                        }}
                    >
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            🤖 AI Summary
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            {summaryModal.file_name}
                        </p>
                        {summarizing ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                Generating summary...
                            </p>
                        ) : (
                            <div style={{
                                background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                                padding: '1.25rem', lineHeight: 1.7, fontSize: '0.9rem',
                                color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
                            }}>
                                {summaryModal.summary}
                            </div>
                        )}
                        <button
                            className="btn-secondary" onClick={() => setSummaryModal(null)}
                            style={{ marginTop: '1.25rem', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Video Call */}
            {showVideoCall && activeCallGroup && (
                <VideoCall
                    groupId={activeCallGroup.group_id}
                    supervisorId={supervisorId}
                    isSuper={true}
                    onClose={() => { setShowVideoCall(false); setActiveCallGroup(null); }}
                />
            )}
        </div>
    );
}

export default SupervisorDashboard;