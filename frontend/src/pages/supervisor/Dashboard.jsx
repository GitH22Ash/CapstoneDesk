import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../lib/api';
import { Users, ClipboardCheck, FolderKanban, AlertCircle } from 'lucide-react';
import ActivityFeed from '../../components/ActivityFeed';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const res = await API.get('/supervisors/my-groups');
        setGroups(res.data || []);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-info">
            <div className="skeleton skeleton-heading" />
            <div className="skeleton skeleton-text" style={{ width: '250px' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}
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
            {groups.length} group{groups.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Assigned Groups</span>
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value">{groups.length}</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Total Students</span>
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value">
            {groups.reduce((acc, g) => acc + (g.members?.length || 0), 0)}
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Pending Reviews</span>
            <ClipboardCheck size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value">0</span>
          <span className="badge badge-dot badge-info" style={{ alignSelf: 'flex-start' }}>
            Coming soon
          </span>
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={20} />
            </div>
            <div className="empty-state-title">No groups assigned</div>
            <p className="empty-state-description">
              Groups will appear here once the admin assigns them to you.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div className="card">
            <div className="card-header">
              <h2>Assigned Groups</h2>
              <span className="badge badge-neutral">{groups.length}</span>
            </div>
            <div style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Project Title</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.group_id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {group.group_name}
                      </td>
                      <td>{group.project_title ? group.project_title : <span className="text-muted">No project registered</span>}</td>
                      <td>{group.members?.length || 0}/5</td>
                      <td>
                        <span className={`badge badge-dot ${group.project_status === 'active' ? 'badge-success' : group.project_status === 'proposal_submitted' ? 'badge-warning' : 'badge-draft'}`} style={{ textTransform: 'capitalize' }}>
                          {group.project_status ? group.project_status.replace('_', ' ') : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <a href={`/supervisor/groups/${group.group_id}`} className="btn btn-secondary btn-sm">View Details</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <ActivityFeed />
        </div>
      )}
    </div>
  );
}
