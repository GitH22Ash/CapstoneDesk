import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../lib/api';
import {
  GraduationCap,
  UserRoundCheck,
  Users,
  FolderKanban,
  TrendingUp,
} from 'lucide-react';
import ActivityFeed from '../../components/ActivityFeed';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    supervisors: 0,
    groups: 0,
    unassigned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [studentsRes, supervisorsRes, groupsRes] = await Promise.all([
          API.get('/admin/students').catch(() => ({ data: [] })),
          API.get('/admin/supervisors').catch(() => ({ data: [] })),
          API.get('/admin/groups').catch(() => ({ data: [] })),
        ]);

        const groups = groupsRes.data || [];
        setStats({
          students: (studentsRes.data || []).length,
          supervisors: (supervisorsRes.data || []).length,
          groups: groups.length,
          unassigned: groups.filter(g => !g.assigned_supervisor_id).length,
        });
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-description">System overview and management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Total Students</span>
            <GraduationCap size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value">{stats.students}</span>
          <span className="stat-card-meta">registered accounts</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Supervisors</span>
            <UserRoundCheck size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value">{stats.supervisors}</span>
          <span className="stat-card-meta">active supervisors</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Groups</span>
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value">{stats.groups}</span>
          <span className="stat-card-meta">total groups</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-card-label">Unassigned</span>
            <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span className="stat-card-value">{stats.unassigned}</span>
          <span className={`badge badge-dot ${stats.unassigned > 0 ? 'badge-warning' : 'badge-success'}`} style={{ alignSelf: 'flex-start' }}>
            {stats.unassigned > 0 ? 'Needs attention' : 'All assigned'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div className="card">
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              <span>
                <strong>System Health: Excellent.</strong> Use the sidebar to manage students, supervisors, and assignments.
              </span>
            </div>
          </div>
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}
