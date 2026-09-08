import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { Mail, GraduationCap, UserRoundCheck, Loader2 } from 'lucide-react';

export default function StudentTeam() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState(null);

  useEffect(() => {
    fetchGroup();
  }, []);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await API.get('/groups/my-group');
      setGroupData(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load team data.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '150px' }} />)}
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="card animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-title">No Team Found</div>
          <p className="empty-state-description">Join or create a project group to view your team members here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{groupData.group_name}</h1>
          <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>{groupData.members?.length || 0} / 5 Members</p>
        </div>
        
        {/* Supervisor Card */}
        <div className="card" style={{ padding: '1rem', minWidth: '300px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserRoundCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Assigned Supervisor</div>
            {groupData.supervisor ? (
              <div style={{ fontWeight: 500 }}>{groupData.supervisor.name}</div>
            ) : (
              <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Not assigned yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Team Members</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {groupData.members?.map((member) => (
            <div key={member.reg_no} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {member.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.name}
                    {user.email === member.email && <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>You</span>}
                  </div>
                  <div className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <GraduationCap size={14} />
                    {member.reg_no}
                  </div>
                  <div className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Mail size={14} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email || 'No email provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
