import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';
import AIChatbot from './AIChatbot';
import FileUpload from './FileUpload';
import VideoCall from './VideoCall';

function StudentDashboard() {
    const [groupData, setGroupData] = useState(null);
    const [activeTab, setActiveTab] = useState('members');
    const [showVideoCall, setShowVideoCall] = useState(false);
    
    // Settings state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [newGroupName, setNewGroupName] = useState('');
    const [groupNameCurrentPassword, setGroupNameCurrentPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const data = sessionStorage.getItem('groupData');
        if (!data) {
            navigate('/student');
            return;
        }
        setGroupData(JSON.parse(data));
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('groupData');
        navigate('/');
    };

    const handleChangePassword = async () => {
        setError('');
        setSuccess('');
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
            await API.put('/groups/change-password', {
                group_id: groupData.group_id,
                currentPassword,
                newPassword: newPassword
            });
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

    const handleChangeGroupName = async () => {
        setError('');
        setSuccess('');
        if (!groupNameCurrentPassword || !newGroupName) {
            setError('Please fill all fields to change group name.');
            return;
        }

        try {
            setLoading(true);
            const res = await API.put('/groups/change-name', {
                group_id: groupData.group_id,
                currentPassword: groupNameCurrentPassword,
                newGroupName: newGroupName
            });
            setSuccess('Group name updated successfully!');
            setGroupNameCurrentPassword('');
            setNewGroupName('');
            
            // Update sessionStorage and local state
            const updatedData = { ...groupData, group_name: res.data.group_name };
            sessionStorage.setItem('groupData', JSON.stringify(updatedData));
            setGroupData(updatedData);

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to change group name.');
        } finally {
            setLoading(false);
        }
    };

    if (!groupData) return null;

    const tabs = [
        { key: 'members', label: '👥 Members', desc: 'View group members & marks' },
        { key: 'submissions', label: '📁 Submissions', desc: 'Upload & manage files' },
        { key: 'settings', label: '⚙ Settings', desc: 'Update group name & password' },
    ];

    return (
        <div className="page-container">
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', right: '-100px', background: 'rgba(59,130,246,0.25)' }} />

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
                        {groupData.assigned_supervisor_id && (
                            <button
                                className="btn-success"
                                onClick={() => setShowVideoCall(true)}
                                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                id="video-call-btn"
                            >
                                📞 Call Supervisor
                            </button>
                        )}
                        <button className="logout-btn" onClick={handleLogout} id="student-logout-btn">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                        Group Dashboard
                    </p>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {groupData.group_name}
                    </h1>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem',
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            id={`tab-${tab.key}`}
                            style={{
                                padding: '0.6rem 1.25rem', borderRadius: '10px',
                                background: activeTab === tab.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                                border: activeTab === tab.key ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                                color: activeTab === tab.key ? '#60a5fa' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {groupData.members.map((member, index) => (
                            <div
                                key={member.reg_no}
                                className={`glass-card animate-fade-in-up delay-${index + 1}`}
                                style={{ padding: '1.5rem' }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    flexWrap: 'wrap',
                                    gap: '1rem',
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {member.name}
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {member.reg_no}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CGPA</p>
                                            <p style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{member.cgpa}</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                                            <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.email || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Marks */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                    gap: '0.75rem',
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--border-glass)',
                                }}>
                                    {[1, 2, 3, 4].map(r => (
                                        <div key={r} style={{
                                            textAlign: 'center',
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                        }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                                                Review {r}
                                            </p>
                                            <p style={{ fontWeight: 600, fontSize: '1.1rem', color: member[`review${r}_marks`] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                {member[`review${r}_marks`] ?? '—'}
                                            </p>
                                        </div>
                                    ))}
                                    {(() => {
                                        const hasAllMarks = [1, 2, 3, 4].every(r => member[`review${r}_marks`] !== null && member[`review${r}_marks`] !== undefined && member[`review${r}_marks`] !== '');
                                        if (!hasAllMarks) return null;
                                        const avg = ([1, 2, 3, 4].reduce((sum, r) => sum + Number(member[`review${r}_marks`]), 0) / 4).toFixed(2);
                                        return (
                                        <div style={{
                                            textAlign: 'center',
                                            background: 'rgba(59,130,246,0.05)',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(59,130,246,0.2)'
                                        }}>
                                            <p style={{ color: '#60a5fa', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                                                Total Marks
                                            </p>
                                            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: '#60a5fa' }}>
                                                {avg}
                                            </p>
                                        </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
                        <FileUpload
                            groupId={groupData.group_id}
                            uploadedBy={groupData.members?.[0]?.reg_no || 'unknown'}
                        />
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                        {error && <div className="alert alert-error" style={{ marginBottom: '0.5rem' }}>{error}</div>}
                        {success && <div className="alert alert-success" style={{ marginBottom: '0.5rem' }}>{success}</div>}

                        {/* Change Group Name */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>🏷️ Change Group Name</h3>
                            <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
                                <div>
                                    <label className="form-label">Current Group Name</label>
                                    <input type="text" className="form-input" value={groupData.group_name} disabled style={{ opacity: 0.7 }} />
                                </div>
                                <div>
                                    <label className="form-label">New Group Name</label>
                                    <input type="text" className="form-input" value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder="Enter new group name" />
                                </div>
                                <div>
                                    <label className="form-label">Current Password</label>
                                    <input type="password" className="form-input" value={groupNameCurrentPassword}
                                        onChange={(e) => setGroupNameCurrentPassword(e.target.value)}
                                        placeholder="Enter current password to verify" />
                                </div>
                                <div>
                                    <button className="btn-primary" onClick={handleChangeGroupName}
                                        disabled={loading}
                                        style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
                                        {loading ? 'Updating...' : 'Update Group Name'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>🔒 Change Password</h3>
                            {!showChangePassword ? (
                                <button
                                    className="btn-primary"
                                    onClick={() => setShowChangePassword(true)}
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
                                            placeholder="Enter current password" />
                                    </div>
                                    <div>
                                        <label className="form-label">New Password</label>
                                        <input type="password" className="form-input" value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters" />
                                    </div>
                                    <div>
                                        <label className="form-label">Confirm New Password</label>
                                        <input type="password" className="form-input" value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="btn-success" onClick={handleChangePassword}
                                            disabled={loading}
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

            {/* AI Chatbot */}
            <AIChatbot />

            {/* Video Call Modal */}
            {showVideoCall && groupData.assigned_supervisor_id && (
                <VideoCall
                    groupId={groupData.group_id}
                    supervisorId={groupData.assigned_supervisor_id}
                    onClose={() => setShowVideoCall(false)}
                />
            )}
        </div>
    );
}

export default StudentDashboard;
