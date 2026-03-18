import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';

function AdminPanel() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(null);
    const navigate = useNavigate();
    
    // Supervisor creation form
    const [empId, setEmpId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Data states
    const [supervisors, setSupervisors] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSupervisor, setSelectedSupervisor] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'supervisors') fetchSupervisors();
        else if (activeTab === 'groups') fetchGroups();
        else if (activeTab === 'assign') {
            fetchGroups();
            fetchSupervisors();
        }
    }, [activeTab]);

    const fetchSupervisors = async () => {
        try {
            setLoading(true);
            const response = await API.get('/admin/supervisors');
            setSupervisors(response.data);
        } catch (err) {
            setError('Failed to fetch supervisors');
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await API.get('/admin/groups');
            setGroups(response.data);
        } catch (err) {
            setError('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupervisor = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!empId || !name || !email || !password) {
            setError('Please fill out all fields.');
            return;
        }

        try {
            setLoading(true);
            await API.post('/admin/supervisors/create', { emp_id: empId, name, email, password });
            setMessage('Supervisor created successfully!');
            setEmpId(''); setName(''); setEmail(''); setPassword('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create supervisor.');
        } finally {
            setLoading(false);
        }
    };

    const handleManualAssign = async () => {
        if (!selectedGroup || !selectedSupervisor) {
            setError('Please select both a group and a supervisor.');
            return;
        }

        setError(''); setMessage('');
        try {
            setLoading(true);
            await API.put(`/admin/groups/${selectedGroup}/assign`, { supervisorId: selectedSupervisor });
            setMessage('Group assigned successfully!');
            setSelectedGroup(''); setSelectedSupervisor('');
            fetchGroups();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to assign group.');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAssign = async () => {
        setError(''); setMessage('');
        try {
            setLoading(true);
            const response = await API.post('/admin/assign-groups');
            setMessage(response.data.msg);
            if (activeTab === 'groups') fetchGroups();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to assign groups.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async (groupId) => {
        setError(''); setMessage('');
        try {
            setLoading(true);
            await API.put(`/admin/groups/${groupId}/unassign`);
            setMessage('Group unassigned successfully!');
            fetchGroups();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to unassign group.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/');
    };

    const panels = [
        { key: 'create', icon: '➕', title: 'Create Supervisor', desc: 'Add new supervisor accounts', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
        { key: 'supervisors', icon: '👥', title: 'View Supervisors', desc: 'See all registered supervisors', gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)' },
        { key: 'groups', icon: '📋', title: 'View Groups', desc: 'Browse all student groups', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
        { key: 'assign', icon: '🔗', title: 'Group Assignment', desc: 'Assign groups to supervisors', gradient: 'linear-gradient(135deg, #f59e0b, #f43f5e)' },
    ];

    return (
        <div className="page-container">
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', left: '-100px', background: 'rgba(245,158,11,0.2)' }} />

            <div className="page-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
                    <button className="logout-btn" onClick={handleLogout} id="admin-logout-btn">
                        Logout
                    </button>
                </div>

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #f59e0b, #f43f5e)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>
                        Admin Panel
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Manage supervisors, groups, and assignments
                    </p>
                </div>

                {/* Alerts */}
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {message && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{message}</div>}

                {/* Panel Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                }}>
                    {panels.map((panel, i) => (
                        <div
                            key={panel.key}
                            className={`admin-panel-card ${activeTab === panel.key ? 'active' : ''} animate-fade-in-up delay-${i + 1}`}
                            onClick={() => setActiveTab(activeTab === panel.key ? null : panel.key)}
                            id={`panel-${panel.key}`}
                        >
                            <div className="panel-icon" style={{ background: panel.gradient }}>
                                {panel.icon}
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                {panel.title}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {panel.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Create Supervisor ── */}
                {activeTab === 'create' && (
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            Create New Supervisor
                        </h2>
                        <form onSubmit={handleCreateSupervisor}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label className="form-label">Employee ID</label>
                                    <input type="text" className="form-input" value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder="e.g., T001" id="admin-emp-id" />
                                </div>
                                <div>
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. John Smith" id="admin-sup-name" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@university.edu" id="admin-sup-email" />
                                </div>
                                <div>
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" id="admin-sup-password" />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} id="create-supervisor-btn">
                                {loading ? 'Creating...' : 'Create Supervisor'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── View Supervisors ── */}
                {activeTab === 'supervisors' && (
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem', overflowX: 'auto' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            Registered Supervisors
                        </h2>
                        {loading ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading...</p>
                        ) : supervisors.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No supervisors registered yet.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Groups</th>
                                        <th>Max</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supervisors.map((s) => (
                                        <tr key={s.emp_id}>
                                            <td style={{ fontWeight: 600 }}>{s.emp_id}</td>
                                            <td>{s.name}</td>
                                            <td>{s.email}</td>
                                            <td>{s.current_groups}</td>
                                            <td>{s.max_groups}</td>
                                            <td>
                                                <span className={`badge ${Number(s.current_groups) >= Number(s.max_groups) ? 'badge-danger' : 'badge-success'}`}>
                                                    {Number(s.current_groups) >= Number(s.max_groups) ? 'Full' : 'Available'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ── View Groups ── */}
                {activeTab === 'groups' && (
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem', overflowX: 'auto' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            Registered Groups
                        </h2>
                        {loading ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading...</p>
                        ) : groups.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No groups registered yet.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Group Name</th>
                                        <th>Members</th>
                                        <th>Supervisor</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((g) => (
                                        <tr key={g.group_id}>
                                            <td style={{ fontWeight: 600 }}>{g.group_id}</td>
                                            <td>{g.group_name}</td>
                                            <td>{g.member_count}</td>
                                            <td>{g.supervisor_name || '—'}</td>
                                            <td>
                                                <span className={`badge ${g.assigned_supervisor_id ? 'badge-success' : 'badge-warning'}`}>
                                                    {g.assigned_supervisor_id ? 'Assigned' : 'Unassigned'}
                                                </span>
                                            </td>
                                            <td>
                                                {g.assigned_supervisor_id && (
                                                    <button className="btn-danger" onClick={() => handleUnassign(g.group_id)} disabled={loading}>
                                                        Unassign
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ── Group Assignment ── */}
                {activeTab === 'assign' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Manual Assignment */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                                Manual Assignment
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label className="form-label">Select Group</label>
                                    <select className="form-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} id="assign-select-group">
                                        <option value="">Choose a group...</option>
                                        {groups.filter(g => !g.assigned_supervisor_id).map((g) => (
                                            <option key={g.group_id} value={g.group_id}>{g.group_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Select Supervisor</label>
                                    <select className="form-select" value={selectedSupervisor} onChange={(e) => setSelectedSupervisor(e.target.value)} id="assign-select-supervisor">
                                        <option value="">Choose a supervisor...</option>
                                        {supervisors.filter(s => Number(s.current_groups) < Number(s.max_groups)).map((s) => (
                                            <option key={s.emp_id} value={s.emp_id}>{s.name} ({s.current_groups}/{s.max_groups})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                className="btn-primary"
                                onClick={handleManualAssign}
                                disabled={loading || !selectedGroup || !selectedSupervisor}
                                id="manual-assign-btn"
                            >
                                {loading ? 'Assigning...' : 'Assign Group'}
                            </button>
                        </div>

                        {/* Auto Assignment */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>
                                Automatic Assignment
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                                Automatically assign all unassigned groups to supervisors based on their capacity and preferences.
                            </p>
                            <div style={{
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: '10px',
                                padding: '0.875rem 1rem',
                                marginBottom: '1.25rem',
                                fontSize: '0.85rem',
                                color: '#fcd34d',
                            }}>
                                ⚠ Make sure supervisors have set their group preferences before running the assignment.
                            </div>
                            <button
                                className="btn-success"
                                onClick={handleAutoAssign}
                                disabled={loading}
                                id="auto-assign-btn"
                            >
                                {loading ? 'Assigning Groups...' : 'Assign Groups Automatically'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;
