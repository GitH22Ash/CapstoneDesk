import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function StudentDashboard() {
    const [groupData, setGroupData] = useState(null);
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

    if (!groupData) return null;

    return (
        <div className="page-container">
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', right: '-100px', background: 'rgba(59,130,246,0.25)' }} />

            <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
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
                    <button className="logout-btn" onClick={handleLogout} id="student-logout-btn">
                        Logout
                    </button>
                </div>

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
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

                {/* Members */}
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
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
