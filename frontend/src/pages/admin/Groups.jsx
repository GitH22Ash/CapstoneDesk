import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { Trash2, Link, Unlink, Loader2, Wand2 } from 'lucide-react';

export default function AdminGroups() {
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, supervisorsRes] = await Promise.all([
        API.get('/admin/groups'),
        API.get('/admin/supervisors')
      ]);
      setGroups(groupsRes.data);
      setSupervisors(supervisorsRes.data);
    } catch (err) {
      toast.error('Failed to load groups data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!window.confirm('This will attempt to automatically assign all unassigned groups to available supervisors. Continue?')) return;
    
    setAutoAssigning(true);
    try {
      const res = await API.post('/admin/assign-groups');
      toast.success(res.data.msg);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Auto-assign failed.');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleUnassign = async (groupId) => {
    if (!window.confirm('Are you sure you want to unassign this group?')) return;
    
    try {
      await API.put(`/admin/groups/${groupId}/unassign`);
      toast.success('Group unassigned successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to unassign.');
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Are you sure you want to completely delete this group and all its data? This cannot be undone.')) return;
    
    try {
      await API.delete(`/admin/groups/${groupId}`);
      toast.success('Group deleted successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete group.');
    }
  };

  const handleManualAssign = async (groupId, supervisorId) => {
    if (!supervisorId) return;
    try {
      await API.put(`/admin/groups/${groupId}/assign`, { supervisorId });
      toast.success('Group assigned successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to assign group.');
      fetchData(); // Reset select
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
          <h1 className="page-title">Group Management</h1>
          <p className="page-description">Manage student groups and supervisor assignments</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleAutoAssign} disabled={autoAssigning}>
            {autoAssigning ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Auto-Assign All
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Groups</h2>
          <span className="badge badge-neutral">{groups.length}</span>
        </div>
        <div style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Members</th>
                <th>Project Status</th>
                <th>Assigned Supervisor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>No groups found.</td></tr>
              ) : (
                groups.map(group => (
                  <tr key={group.group_id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{group.group_name}</td>
                    <td>{group.members?.length || 0}/5</td>
                    <td>
                      {group.project_status ? (
                        <span className={`badge badge-dot ${group.project_status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                          {group.project_status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-muted text-sm">No project</span>
                      )}
                    </td>
                    <td>
                      {group.assigned_supervisor_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 500 }}>{group.supervisor_name}</span>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleUnassign(group.group_id)} title="Unassign" style={{ padding: '0.25rem', height: 'auto', minHeight: 0 }}>
                            <Unlink size={14} />
                          </button>
                        </div>
                      ) : (
                        <select 
                          className="form-input" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          onChange={(e) => handleManualAssign(group.group_id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Select supervisor...</option>
                          {supervisors.map(sup => (
                            <option key={sup.emp_id} value={sup.emp_id} disabled={parseInt(sup.current_groups) >= parseInt(sup.max_groups)}>
                              {sup.name} ({sup.current_groups || 0}/{sup.max_groups})
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-icon btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(group.group_id)} title="Delete Group">
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

    </div>
  );
}
