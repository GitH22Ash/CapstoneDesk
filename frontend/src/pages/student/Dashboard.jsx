import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import {
  FolderKanban,
  Users,
  ListChecks,
  ClipboardCheck,
  Plus,
  ArrowRight,
  UserPlus,
  Loader2,
  X
} from 'lucide-react';
import ActivityFeed from '../../components/ActivityFeed';

export default function StudentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogMode, setDialogMode] = useState(null); // 'create' or 'join'
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/groups/my-group');
      setGroupData(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching group:', err);
      }
      setGroupData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  const handleGroupAction = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || !groupPassword.trim()) {
      return toast.error('Please enter group name and password.');
    }

    setActionLoading(true);
    try {
      if (dialogMode === 'create') {
        await API.post('/groups', { group_name: groupName, password: groupPassword });
        toast.success('Group created successfully!');
      } else {
        await API.post('/groups/join', { group_name: groupName, password: groupPassword });
        toast.success('Joined group successfully!');
      }
      setDialogMode(null);
      setGroupName('');
      setGroupPassword('');
      fetchGroupData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to perform action.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-info">
            <div className="skeleton skeleton-heading" style={{ width: '200px' }} />
            <div className="skeleton skeleton-text" style={{ width: '300px' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="page-description">
            {groupData ? `${groupData.group_name} • ${groupData.members?.length || 0}/5 members` : 'Get started by joining or creating a group'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Project Status</span>
            <FolderKanban size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value" style={{ fontSize: '1rem', marginTop: 'auto' }}>
            {groupData ? (groupData.project_status || 'Draft') : 'No Project'}
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Team</span>
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value" style={{ marginTop: 'auto' }}>
            {groupData?.members?.length || 0}
            <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/5</span>
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Milestones</span>
            <ListChecks size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value" style={{ marginTop: 'auto' }}>0</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Reviews</span>
            <ClipboardCheck size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value" style={{ marginTop: 'auto' }}>0<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>/4</span></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {!groupData ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={20} />
              </div>
              <div className="empty-state-title">No group yet</div>
              <p className="empty-state-description">
                Create a new capstone project group or join an existing one using the group password.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-primary btn-md" onClick={() => setDialogMode('create')}>
                  <Plus size={16} />
                  Create Group
                </button>
                <button className="btn btn-secondary btn-md" onClick={() => setDialogMode('join')}>
                  <UserPlus size={16} />
                  Join Group
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <button className="btn btn-secondary btn-md" style={{ justifyContent: 'flex-start' }}>
                <FolderKanban size={16} />
                View Project
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </button>
              <button className="btn btn-secondary btn-md" style={{ justifyContent: 'flex-start' }}>
                <Users size={16} />
                View Team
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </button>
              <button className="btn btn-secondary btn-md" style={{ justifyContent: 'flex-start' }}>
                <ListChecks size={16} />
                View Milestones
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>
        )}
        <ActivityFeed />
      </div>

      {/* Dialog for Create/Join */}
      {dialogMode && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3>{dialogMode === 'create' ? 'Create New Group' : 'Join Existing Group'}</h3>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setDialogMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleGroupAction}>
              <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p className="text-muted text-sm">
                  {dialogMode === 'create' 
                    ? 'Enter a unique name for your project group and set a password. Share this password with your teammates so they can join.'
                    : 'Enter the exact group name and the password provided by your group creator.'}
                </p>
                <div className="form-group">
                  <label className="form-label form-label-required">Group Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Team Alpha"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Group Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    placeholder={dialogMode === 'create' ? 'Set a strong password' : 'Enter group password'}
                  />
                </div>
              </div>
              <div className="dialog-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setDialogMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : (dialogMode === 'create' ? 'Create Group' : 'Join Group')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
