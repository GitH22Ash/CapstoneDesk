import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';

const initialMemberState = { name: '', reg_no: '', cgpa: '', email: '' };

function GroupSignup() {
    const [groupName, setGroupName] = useState('');
    const [password, setPassword] = useState('');
    const [members, setMembers] = useState(
        Array(5).fill(null).map(() => ({ ...initialMemberState }))
    );
    const [currentMember, setCurrentMember] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const signupData = sessionStorage.getItem('signupData');
        if (!signupData) {
            navigate('/student');
            return;
        }
        const { group_name, password: pwd } = JSON.parse(signupData);
        setGroupName(group_name);
        setPassword(pwd);
    }, [navigate]);

    const handleMemberChange = (field, value) => {
        const updatedMembers = [...members];
        updatedMembers[currentMember] = { ...updatedMembers[currentMember], [field]: value };
        setMembers(updatedMembers);
    };

    const isCurrentMemberValid = () => {
        const m = members[currentMember];
        return m.name.trim() && m.reg_no.trim() && m.cgpa.trim() && m.email.trim();
    };

    const handleNext = () => {
        if (!isCurrentMemberValid()) {
            setError('Please fill out all fields for this member.');
            return;
        }
        setError('');
        setCurrentMember(prev => Math.min(prev + 1, 4));
    };

    const handlePrev = () => {
        setError('');
        setCurrentMember(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        if (!isCurrentMemberValid()) {
            setError('Please fill out all fields for this member.');
            return;
        }

        // Validate all members are filled
        const incomplete = members.some(
            m => !m.name.trim() || !m.reg_no.trim() || !m.cgpa.trim() || !m.email.trim()
        );
        if (incomplete) {
            setError('All member details must be filled out. Please go back and complete them.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await API.post('/groups/register', {
                group_name: groupName,
                password,
                members,
            });

            setSuccess('Group created successfully! Redirecting to login...');
            sessionStorage.removeItem('signupData');

            // Auto-login after creation
            setTimeout(async () => {
                try {
                    const res = await API.post('/groups/login', {
                        group_name: groupName,
                        password,
                    });
                    sessionStorage.setItem('groupData', JSON.stringify(res.data));
                    navigate('/student/dashboard');
                } catch {
                    navigate('/student');
                }
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const member = members[currentMember];

    return (
        <div className="page-container">
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', left: '-100px', background: 'rgba(59,130,246,0.3)' }} />

            <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Link to="/student" className="back-link animate-fade-in">
                    ← Back to Student Portal
                </Link>

                <div className="animate-fade-in-up" style={{ maxWidth: '540px', width: '100%' }}>
                    {/* Group Name Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '2rem',
                    }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                            Creating Group
                        </p>
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {groupName}
                        </h2>
                    </div>

                    {/* Step Indicator */}
                    <div className="step-indicator">
                        {[0, 1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className={`step-dot ${i === currentMember ? 'active' : ''} ${i < currentMember ? 'completed' : ''}`}
                            />
                        ))}
                    </div>

                    {/* Member Card */}
                    <div className="member-card active animate-fade-in" key={currentMember}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: '1.5rem',
                            color: 'var(--text-primary)',
                        }}>
                            👤 Member {currentMember + 1}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400, marginLeft: '0.5rem' }}>
                                of 5
                            </span>
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={member.name}
                                    onChange={(e) => handleMemberChange('name', e.target.value)}
                                    placeholder="Enter full name"
                                    id={`member-name-${currentMember}`}
                                />
                            </div>
                            <div>
                                <label className="form-label">Registration Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={member.reg_no}
                                    onChange={(e) => handleMemberChange('reg_no', e.target.value)}
                                    placeholder="e.g., 21BCE1234"
                                    id={`member-reg-${currentMember}`}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">CGPA</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        value={member.cgpa}
                                        onChange={(e) => handleMemberChange('cgpa', e.target.value)}
                                        placeholder="e.g., 8.5"
                                        id={`member-cgpa-${currentMember}`}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={member.email}
                                        onChange={(e) => handleMemberChange('email', e.target.value)}
                                        placeholder="email@example.com"
                                        id={`member-email-${currentMember}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error / Success */}
                    {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginTop: '1rem' }}>{success}</div>}

                    {/* Navigation Buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '1.5rem',
                        gap: '1rem',
                    }}>
                        <button
                            className="btn-secondary"
                            onClick={handlePrev}
                            disabled={currentMember === 0}
                            style={{ flex: 1, opacity: currentMember === 0 ? 0.4 : 1 }}
                            id="member-prev-btn"
                        >
                            ← Previous
                        </button>

                        {currentMember < 4 ? (
                            <button
                                className="btn-primary"
                                onClick={handleNext}
                                style={{ flex: 1 }}
                                id="member-next-btn"
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                className="btn-success"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{ flex: 1 }}
                                id="create-group-btn"
                            >
                                {loading ? 'Creating Group...' : '✓ Create Group'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GroupSignup;
