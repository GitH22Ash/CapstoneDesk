import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { Trash2, Upload, Loader2 } from 'lucide-react';

export default function AdminStudents() {
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

  // Upload state
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/students');
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await API.post('/admin/upload-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.msg);
      if (res.data.errors && res.data.errors.length > 0) {
        toast.error('Some rows failed to import. Check console for details.');
        console.warn('Upload errors:', res.data.errors);
      }
      fetchStudents();
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
          <h1 className="page-title">Students</h1>
          <p className="page-description">Manage student records</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Bulk Import (Excel)
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileRef} onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Registered Students</h2>
          <span className="badge badge-neutral">{students.length}</span>
        </div>
        <div style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>CGPA</th>
                <th>Group Name</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>No students found.</td></tr>
              ) : (
                students.map(student => (
                  <tr key={student.reg_no}>
                    <td style={{ fontWeight: 500 }}>{student.reg_no}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.cgpa}</td>
                    <td>
                      {student.group_name ? (
                        <span className="badge badge-info">{student.group_name}</span>
                      ) : (
                        <span className="text-muted text-sm">Not in group</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
