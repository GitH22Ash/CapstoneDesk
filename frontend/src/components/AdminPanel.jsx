import { useState, useEffect, useRef } from 'react';
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
    const [students, setStudents] = useState([]);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSupervisor, setSelectedSupervisor] = useState('');

    // Delete confirmation modal
    const [deleteModal, setDeleteModal] = useState(null);

    // Excel upload refs
    const studentFileRef = useRef(null);
    const supervisorFileRef = useRef(null);

    // Create group state
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupPassword, setNewGroupPassword] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

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
        } else if (activeTab === 'students') fetchStudents();
        else if (activeTab === 'createGroups') fetchUnassignedStudents();
    }, [activeTab]);

    const fetchSupervisors = async () => {
        try {
            setLoading(true);
            const response = await API.get('/admin/supervisors');
            setSupervisors(response.data);
        } catch (err) {
            console.error('Fetch supervisors error:', err);
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
            console.error('Fetch groups error:', err);
            setError('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await API.get('/admin/students');
            setStudents(response.data);
        } catch (err) {
            console.error('Fetch students error:', err);
            setError('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnassignedStudents = async () => {
        try {
            setLoading(true);
            const response = await API.get('/admin/unassigned-students');
            setUnassignedStudents(response.data);
            setSelectedStudents([]);
        } catch (err) {
            console.error('Fetch unassigned students error:', err);
            setError('Failed to fetch unassigned students');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupervisor = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
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

    // Delete handlers
    const handleDeleteSupervisor = async (empId) => {
        setError(''); setMessage('');
        try {
            setLoading(true);
            await API.delete(`/admin/supervisors/${empId}`);
            setMessage('Supervisor deleted successfully!');
            setDeleteModal(null);
            fetchSupervisors();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete supervisor.');
            setDeleteModal(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        setError(''); setMessage('');
        try {
            setLoading(true);
            await API.delete(`/admin/groups/${groupId}`);
            setMessage('Group and all associated data deleted successfully!');
            setDeleteModal(null);
            fetchGroups();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete group.');
            setDeleteModal(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (regNo) => {
        setError(''); setMessage('');
        try {
            setLoading(true);
            await API.delete(`/admin/students/${regNo}`);
            setMessage('Student deleted successfully!');
            setDeleteModal(null);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete student.');
            setDeleteModal(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromGroup = async (groupId, regNo) => {
        setError(''); setMessage('');
        try {
            setLoading(true);
            await API.delete(`/admin/groups/${groupId}/members/${regNo}`);
            setMessage('Student removed from group successfully!');
            setDeleteModal(null);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to remove student from group.');
            setDeleteModal(null);
        } finally {
            setLoading(false);
        }
    };

    // Create group handlers
    const handleCreateGroup = async () => {
        setError(''); setMessage('');
        if (!newGroupName || !newGroupPassword || selectedStudents.length === 0) {
            setError('Please provide group name, password, and select at least one student.');
            return;
        }
        if (selectedStudents.length > 5) {
            setError('A group can have at most 5 members.');
            return;
        }
        try {
            setLoading(true);
            const res = await API.post('/admin/create-group', {
                group_name: newGroupName,
                password: newGroupPassword,
                student_reg_nos: selectedStudents,
            });
            setMessage(res.data.msg);
            setNewGroupName(''); setNewGroupPassword(''); setSelectedStudents([]);
            fetchUnassignedStudents();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create group.');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCreateGroups = async () => {
        setError(''); setMessage('');
        try {
            setLoading(true);
            const res = await API.post('/admin/auto-create-groups');
            setMessage(res.data.msg);
            fetchUnassignedStudents();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to auto-create groups.');
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentSelection = (regNo) => {
        setSelectedStudents(prev =>
            prev.includes(regNo)
                ? prev.filter(r => r !== regNo)
                : prev.length < 5
                    ? [...prev, regNo]
                    : prev
        );
    };

    // Excel upload handlers
    const handleExcelUpload = async (type, file) => {
        if (!file) return;
        setError(''); setMessage('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const endpoint = type === 'students' ? '/admin/upload-students' : '/admin/upload-supervisors';
            const res = await API.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage(res.data.msg);
            if (res.data.errors && res.data.errors.length > 0) {
                setError('Some rows had errors: ' + res.data.errors.join(', '));
            }
            if (type === 'supervisors' && activeTab === 'supervisors') fetchSupervisors();
        } catch (err) {
            setError(err.response?.data?.msg || `Failed to upload ${type} Excel file.`);
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
        { key: 'supervisors', icon: '👥', title: 'View Supervisors', desc: 'Manage all supervisors', gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)' },
        { key: 'students', icon: '🎓', title: 'View Students', desc: 'Manage all student records', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
        { key: 'groups', icon: '📋', title: 'View Groups', desc: 'Manage all student groups', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
        { key: 'createGroups', icon: '🏗', title: 'Create Groups', desc: 'Form new student groups', gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
        { key: 'assign', icon: '🔗', title: 'Group Assignment', desc: 'Assign groups to supervisors', gradient: 'linear-gradient(135deg, #f59e0b, #f43f5e)' },
        { key: 'import', icon: '📥', title: 'Bulk Import', desc: 'Upload Excel sheets', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
    ];

    return (
        <div className="page-container">
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', left: '-100px', background: 'rgba(245,158,11,0.2)' }} />

            <div className="page-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Top bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem',
                }} className="animate-fade-in">
                    <Link to="/" className="back-link" style={{ marginBottom: 0 }}>← Home</Link>
                    <button className="logout-btn" onClick={handleLogout} id="admin-logout-btn">Logout</button>
                </div>

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2.25rem', fontWeight: 800,
                        background: 'linear-gradient(135deg, #f59e0b, #f43f5e)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>Admin Panel</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage supervisors, groups, students, and assignments</p>
                </div>

                {/* Alerts */}
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {message && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{message}</div>}

                {/* Panel Cards */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '1rem', marginBottom: '2rem',
                }}>
                    {panels.map((panel, i) => (
                        <div
                            key={panel.key}
                            className={`admin-panel-card ${activeTab === panel.key ? 'active' : ''} animate-fade-in-up delay-${i + 1}`}
                            onClick={() => setActiveTab(activeTab === panel.key ? null : panel.key)}
                            id={`panel-${panel.key}`}
                        >
                            <div className="panel-icon" style={{ background: panel.gradient }}>{panel.icon}</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{panel.title}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{panel.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── Create Supervisor ── */}
                {activeTab === 'create' && (
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Supervisor</h2>
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
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>Registered Supervisors</h2>
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
                                        <th>Actions</th>
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
                                            <td>
                                                <button
                                                    className="btn-danger"
                                                    onClick={() => setDeleteModal({ type: 'supervisor', id: s.emp_id, name: s.name })}
                                                    id={`delete-supervisor-${s.emp_id}`}
                                                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                                                >
                                                    🗑 Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ── View Students ── */}
                {activeTab === 'students' && (
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem', overflowX: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>All Students</h2>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{students.length} total</span>
                        </div>
                        {loading ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading...</p>
                        ) : students.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No students registered yet.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Reg No</th>
                                        <th>Name</th>
                                        <th>CGPA</th>
                                        <th>Email</th>
                                        <th>Group Name</th>
                                        <th>Group #</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((st) => (
                                        <tr key={st.reg_no}>
                                            <td style={{ fontWeight: 600 }}>{st.reg_no}</td>
                                            <td>{st.name}</td>
                                            <td>{st.cgpa}</td>
                                            <td>{st.email || '—'}</td>
                                            <td>{st.group_name || '—'}</td>
                                            <td>{st.group_id || '—'}</td>
                                            <td>
                                                <span className={`badge ${st.status === 'In Group' ? 'badge-success' : 'badge-warning'}`}>
                                                    {st.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    {st.group_id && (
                                                        <button
                                                            className="btn-secondary"
                                                            onClick={() => setDeleteModal({ type: 'removeFromGroup', id: st.reg_no, groupId: st.group_id, name: st.name, groupName: st.group_name })}
                                                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                                            id={`remove-student-${st.reg_no}`}
                                                        >
                                                            ↩ Remove
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => setDeleteModal({ type: 'student', id: st.reg_no, name: st.name })}
                                                        id={`delete-student-${st.reg_no}`}
                                                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                                    >
                                                        🗑 Delete
                                                    </button>
                                                </div>
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
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>Registered Groups</h2>
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
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {g.assigned_supervisor_id && (
                                                        <button className="btn-secondary" onClick={() => handleUnassign(g.group_id)} disabled={loading}
                                                            style={{ fontSize: '0.73rem', padding: '0.3rem 0.6rem' }}>
                                                            Unassign
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => setDeleteModal({ type: 'group', id: g.group_id, name: g.group_name })}
                                                        id={`delete-group-${g.group_id}`}
                                                        style={{ fontSize: '0.73rem', padding: '0.3rem 0.6rem' }}
                                                    >
                                                        🗑 Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ── Create Groups ── */}
                {activeTab === 'createGroups' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Manual Group Creation */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>Manual Group Creation</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                Select up to 5 unassigned students and create a new group.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label className="form-label">Group Name</label>
                                    <input type="text" className="form-input" value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder="e.g., Team Alpha" id="new-group-name" />
                                </div>
                                <div>
                                    <label className="form-label">Group Password</label>
                                    <input type="text" className="form-input" value={newGroupPassword}
                                        onChange={(e) => setNewGroupPassword(e.target.value)}
                                        placeholder="Login password for the group" id="new-group-password" />
                                </div>
                            </div>

                            {/* Student selection */}
                            <label className="form-label">
                                Select Students ({selectedStudents.length}/5 selected)
                            </label>
                            {loading ? (
                                <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>Loading...</p>
                            ) : unassignedStudents.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>
                                    No unassigned students available.
                                </p>
                            ) : (
                                <div style={{
                                    maxHeight: '280px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px', marginBottom: '1.25rem',
                                }}>
                                    {unassignedStudents.map((st) => (
                                        <div
                                            key={st.reg_no}
                                            onClick={() => toggleStudentSelection(st.reg_no)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.75rem 1rem', cursor: 'pointer',
                                                background: selectedStudents.includes(st.reg_no) ? 'rgba(139,92,246,0.12)' : 'transparent',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                transition: 'background 0.15s',
                                            }}
                                            id={`select-student-${st.reg_no}`}
                                        >
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '4px',
                                                border: selectedStudents.includes(st.reg_no) ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.2)',
                                                background: selectedStudents.includes(st.reg_no) ? '#8b5cf6' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', color: '#fff', flexShrink: 0,
                                            }}>
                                                {selectedStudents.includes(st.reg_no) && '✓'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{st.name}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.75rem' }}>
                                                    {st.reg_no} • CGPA: {st.cgpa}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button className="btn-primary" onClick={handleCreateGroup}
                                disabled={loading || selectedStudents.length === 0 || !newGroupName || !newGroupPassword}
                                id="create-group-btn">
                                {loading ? 'Creating...' : `Create Group (${selectedStudents.length} members)`}
                            </button>
                        </div>

                        {/* Auto Create Groups */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>Automatic Group Creation</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                                Automatically create groups of 5 from all unassigned students. Groups will be randomly formed and named "Auto-Group-1", "Auto-Group-2", etc.
                            </p>
                            <div style={{
                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem',
                                fontSize: '0.85rem', color: '#fcd34d',
                            }}>
                                ⚠ Default password for auto-created groups: <strong>capstone123</strong>. Students should change it after first login.
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                {unassignedStudents.length} unassigned student{unassignedStudents.length !== 1 ? 's' : ''} available
                                ({Math.floor(unassignedStudents.length / 5)} groups can be formed)
                            </p>
                            <button className="btn-success" onClick={handleAutoCreateGroups}
                                disabled={loading || unassignedStudents.length < 5}
                                id="auto-create-groups-btn">
                                {loading ? 'Creating Groups...' : 'Auto-Create Groups'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Group Assignment ── */}
                {activeTab === 'assign' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>Manual Assignment</h2>
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
                            <button className="btn-primary" onClick={handleManualAssign}
                                disabled={loading || !selectedGroup || !selectedSupervisor} id="manual-assign-btn">
                                {loading ? 'Assigning...' : 'Assign Group'}
                            </button>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>Automatic Assignment</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                                Automatically assign all unassigned groups to supervisors based on their capacity and preferences.
                            </p>
                            <div style={{
                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem',
                                fontSize: '0.85rem', color: '#fcd34d',
                            }}>
                                ⚠ Make sure supervisors have set their group preferences before running the assignment.
                            </div>
                            <button className="btn-success" onClick={handleAutoAssign} disabled={loading} id="auto-assign-btn">
                                {loading ? 'Assigning Groups...' : 'Assign Groups Automatically'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Bulk Import ── */}
                {activeTab === 'import' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Student Excel Upload */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>📥 Import Students</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                                Upload an Excel file (.xlsx) with columns: <strong>reg_no</strong>, <strong>name</strong>, <strong>cgpa</strong>, <strong>email</strong>
                            </p>
                            <div style={{
                                border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px',
                                padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s',
                            }}
                                onClick={() => studentFileRef.current?.click()}
                                id="student-excel-zone"
                            >
                                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to select student Excel file</p>
                                <input ref={studentFileRef} type="file" accept=".xlsx,.xls"
                                    onChange={(e) => handleExcelUpload('students', e.target.files[0])}
                                    style={{ display: 'none' }} id="student-excel-input" />
                            </div>
                        </div>

                        {/* Supervisor Excel Upload */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>📥 Import Supervisors</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: 1.6 }}>
                                Upload an Excel file (.xlsx) with columns: <strong>emp_id</strong>, <strong>name</strong>, <strong>email</strong>, <strong>password</strong> (optional, defaults to 'default123')
                            </p>
                            <p style={{ color: '#fcd34d', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                                ⚠ Duplicate supervisors (by employee ID) will be automatically skipped.
                            </p>
                            <div style={{
                                border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px',
                                padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s',
                            }}
                                onClick={() => supervisorFileRef.current?.click()}
                                id="supervisor-excel-zone"
                            >
                                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to select supervisor Excel file</p>
                                <input ref={supervisorFileRef} type="file" accept=".xlsx,.xls"
                                    onChange={(e) => handleExcelUpload('supervisors', e.target.files[0])}
                                    style={{ display: 'none' }} id="supervisor-excel-input" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Delete Confirmation Modal ── */}
            {deleteModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1100,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem',
                }} onClick={() => setDeleteModal(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(20,20,35,0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px', padding: '2rem',
                            maxWidth: '450px', width: '100%', textAlign: 'center',
                        }}
                        id="delete-confirmation-modal"
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            {deleteModal.type === 'removeFromGroup' ? 'Confirm Removal' : 'Confirm Deletion'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            {deleteModal.type === 'removeFromGroup' ? (
                                <>
                                    Are you sure you want to remove <strong style={{ color: '#f59e0b' }}>{deleteModal.name}</strong> from
                                    group <strong style={{ color: '#f59e0b' }}>{deleteModal.groupName}</strong>?
                                    <br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        The student can be reassigned to another group later.
                                    </span>
                                </>
                            ) : (
                                <>
                                    Are you sure you want to delete {deleteModal.type === 'supervisor' ? 'supervisor' : deleteModal.type === 'student' ? 'student' : 'group'}{' '}
                                    <strong style={{ color: '#ef4444' }}>{deleteModal.name}</strong>?
                                    {deleteModal.type === 'group' && (
                                        <><br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            This will also delete all members, marks, and submissions.
                                        </span></>
                                    )}
                                    {deleteModal.type === 'supervisor' && (
                                        <><br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            All assigned groups will be unassigned.
                                        </span></>
                                    )}
                                    {deleteModal.type === 'student' && (
                                        <><br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            The student will be removed from their group and all marks will be deleted.
                                        </span></>
                                    )}
                                </>
                            )}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => setDeleteModal(null)}
                                style={{ padding: '0.6rem 1.5rem' }}
                                id="cancel-delete-btn"
                            >
                                Cancel
                            </button>
                            <button
                                className={deleteModal.type === 'removeFromGroup' ? 'btn-primary' : 'btn-danger'}
                                onClick={() => {
                                    if (deleteModal.type === 'supervisor') handleDeleteSupervisor(deleteModal.id);
                                    else if (deleteModal.type === 'group') handleDeleteGroup(deleteModal.id);
                                    else if (deleteModal.type === 'student') handleDeleteStudent(deleteModal.id);
                                    else if (deleteModal.type === 'removeFromGroup') handleRemoveFromGroup(deleteModal.groupId, deleteModal.id);
                                }}
                                disabled={loading}
                                style={{ padding: '0.6rem 1.5rem' }}
                                id="confirm-delete-btn"
                            >
                                {loading ? 'Processing...' : deleteModal.type === 'removeFromGroup' ? '↩ Remove' : '🗑 Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
