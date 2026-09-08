import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { UserRoundCheck, Trash2, Plus, Upload, Loader2, Download } from 'lucide-react';

export default function AdminSupervisors() {
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState([]);
  
  // Create state
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Upload state
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/supervisors');
      setSupervisors(res.data);
    } catch (err) {
      toast.error('Failed to load supervisors.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!empId || !name || !email || !password) {
      return toast.error('Please fill out all fields.');
    }
    
    setCreating(true);
    try {
      await API.post('/admin/supervisors/create', { emp_id: empId, name, email, password });
      toast.success('Supervisor created successfully!');
      setEmpId(''); setName(''); setEmail(''); setPassword('');
      fetchSupervisors();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create supervisor.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supervisor? All their assigned groups will be unassigned.')) return;
    
    try {
      await API.delete(`/admin/supervisors/${id}`);
      toast.success('Supervisor deleted successfully.');
      fetchSupervisors();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete supervisor.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await API.post('/admin/upload-supervisors', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.msg);
      if (res.data.errors && res.data.errors.length > 0) {
        console.warn('Upload errors:', res.data.errors);
        toast.error('Some rows failed to import. Check console for details.');
      }
      fetchSupervisors();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to upload Excel file.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Supervisors</h1>
          <p className="page-description">Manage supervisor accounts and capacity</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Bulk Import (Excel)
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileRef} onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Supervisors List */}
        <div className="card">
          <div className="card-header">
            <h2>Active Supervisors</h2>
            <span className="badge badge-neutral">{supervisors.length}</span>
          </div>
          <div style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Emp ID</th>
                  <th>Email</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supervisors.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>No supervisors found.</td></tr>
                ) : (
                  supervisors.map(sup => (
                    <tr key={sup.emp_id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sup.name}</td>
                      <td>{sup.emp_id}</td>
                      <td>{sup.email}</td>
                      <td>
                        <span className={`badge ${parseInt(sup.current_groups) >= parseInt(sup.max_groups) ? 'badge-warning' : 'badge-success'}`}>
                          {sup.current_groups || 0} / {sup.max_groups || 3}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-icon btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(sup.emp_id)} title="Delete Supervisor">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Supervisor Form */}
        <div className="card">
          <div className="card-header">
            <h2>Add Supervisor</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label form-label-required">Employee ID</label>
                <input type="text" className="form-input" value={empId} onChange={e => setEmpId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Full Name</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Email</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Password</label>
                <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={creating} style={{ marginTop: '0.5rem' }}>
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create Supervisor
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
